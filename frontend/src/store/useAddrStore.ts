import { create } from 'zustand';
import { ElementDefinition } from 'cytoscape';
import { AddrResponse } from '@/types/addr';
import { Packet, Change } from '@/types/packet';
import { addrToGraph, interfaceToId } from './toGraph/addrToGraph';
import { toAddress } from './trace/packetMatch';
import { Address4, Address6 } from 'ip-address';

type AddrActions = {
  setData: (data: Map<string, AddrResponse>) => void;
  getGraph: (namespace: string) => ElementDefinition[];
  tracePacket: (packet: Packet) => [Packet, Change[]];
  listInterfaces: () => Map<string, string[]>;
  isBridge: (ifname: string, namespace: string) => boolean;
  doesGoToNamespace: (packet: Packet, namespace: string) => [boolean, Packet, Change[]];
}

type AddrStore = {
  data: Map<string, AddrResponse>;
  actions: AddrActions;
}

const useAddrStore = create<AddrStore>((set, get) => ({
  data: new Map(),
  actions: {
    setData: (data) => {
      // Create a mutable copy to update fields
      const updatedData = new Map<string, AddrResponse>();

      // Initialize the updated map with shallow copies of the items to avoid mutating original if it matters
      // though typically setData is the source of truth.
      for (const [ns, items] of data.entries()) {
        updatedData.set(ns, items.map(item => ({ ...item })));
      }

      // Fill bridgeChildren and vEth fields
      for (const [_, items] of updatedData.entries()) {
        for (const item of items) {
          // bridgeChildren: array of other interfaces in the same namespace with "master" field set to "ifname" of this interface
          item.bridgeChildren = items
            .filter(i => i.master === item.ifname)
            .map(i => i.ifindex);

          // vEthOtherEndNs and vEthOtherEndIfname
          if (item.link_index) {
            for (const [otherNs, otherItems] of updatedData.entries()) {
              const peer = otherItems.find(i => i.ifindex === item.link_index && i.link_index === item.ifindex);
              if (peer) {
                item.vEthOtherEndNs = otherNs;
                item.vEthOtherEndIfname = peer.ifname;
                break;
              }
            }
          }
        }
      }

      set({ data: updatedData });
    },
    getGraph: (_: string): ElementDefinition[] => {
        return addrToGraph(get().data);
    },
    tracePacket: (packet: Packet): [Packet, Change[]] => {
      const { srcNamespace, srcInterface } = packet;
      const changes: Change[] = [];

      if (!srcInterface || srcInterface === "process") {
        changes.push({
          namespace: srcNamespace || "host",
          hook: "local_process",
          id: "Local process",
          decision: "start",
        });
      } else {
        const addrData = get().data.get(srcNamespace || "host");
        const item = addrData?.find(i => i.ifname === srcInterface);

        changes.push({
          namespace: "host",
          hook: "interfaces_in",
          id: item ? interfaceToId(srcNamespace || "host", item.ifindex) : "",
          name: item ? item.ifname : "",
          decision: "start",
        });
      }

      return [packet, changes];
    },
    listInterfaces: (): Map<string, string[]> => {
      const result = new Map<string, string[]>();
      for (const [namespace, addrData] of get().data.entries()) {
        const interfaces = addrData.map(item => item.ifname);
        result.set(namespace, interfaces);
      }
      return result;
    },
    isBridge: (ifname: string, namespace: string): boolean => {
      const addrData = get().data.get(namespace || 'host');
      if (!addrData || !ifname) {
        return false;
      }
      const isBridge = addrData.some(item => item.master === ifname);
      console.log("ISSBRDIGE", isBridge);
      return isBridge;
    },

    doesGoToNamespace: (packet: Packet, namespace: string): [boolean, Packet, Change[]] => {
      const { dstInterface } = packet;
      const dstIp = packet.internet.dstIp;

      if (!dstInterface) {
        return [false, packet, []];
      }

      const addrData = get().data.get(namespace || 'host');
      const item = addrData?.find(i => i.ifname === dstInterface);

      const changes: Change[] = [];
      if (item) {
        changes.push({
          namespace: namespace || 'host',
          hook: "interfaces_out",
          id: interfaceToId(namespace || 'host', item.ifindex),
          name: item.ifname,
          decision: "accept",
        });
      } else {
        return [false, packet, []];
      }

      // If the destination interface is a bridge, we need to find which bridge child leads to the destination IP
      if (get().actions.isBridge(item.ifname, namespace)) {
        const bridgeChildren = addrData?.filter(i => i.master === item.ifname) || [];

        for (const child of bridgeChildren) {
          // Check if this child leads to another namespace via vEth
          if (child.vEthOtherEndNs && child.vEthOtherEndIfname) {
            // Check if dstIp belongs to the subnet of the peer interface in the target namespace
            const peerNsData = get().data.get(child.vEthOtherEndNs);
            const peerIf = peerNsData?.find(i => i.ifname === child.vEthOtherEndIfname);

            if (peerIf && dstIp) {
              const packetAddr = toAddress(dstIp.address);
              const matchesSubnet = peerIf.addr_info.some(addr => {
                const ifAddr = toAddress(addr.local);
                if (packetAddr && ifAddr && packetAddr.v4 === ifAddr.v4) {
                   const mask = addr.prefixlen;
                   return packetAddr.isInSubnet(new (packetAddr.v4 ? Address4 : Address6)(`${addr.local}/${mask}`));
                }
                return false;
              });

              if (matchesSubnet) {
                changes.push({
                  namespace: namespace || 'host',
                  hook: "interfaces_out",
                  id: interfaceToId(namespace || 'host', child.ifindex),
                  name: child.ifname,
                  decision: "accept",
                });

                const nextPacket = {
                  ...packet,
                  srcNamespace: child.vEthOtherEndNs,
                  srcInterface: child.vEthOtherEndIfname
                };

                changes.push({
                  namespace: namespace || "host",
                  hook: "interfaces_out",
                  id: `namespace_${child.vEthOtherEndNs}`,
                  name: `Namespace: ${child.vEthOtherEndNs}`,
                  decision: "accept",
                },
                {
                  namespace: child.vEthOtherEndNs,
                  hook: "interfaces_in",
                  id: interfaceToId(child.vEthOtherEndNs, child.link_index!),
                  name: child.vEthOtherEndIfname,
                  decision: "accept",
                });

                return [true, nextPacket, changes];
              }
            }
          }
        }

        // If no child matched the destination IP, the packet is dropped by the bridge
        changes.push({
          namespace: namespace || 'host',
          hook: "interfaces_out",
          id: "Bridge Drop",
          name: `Bridge ${item.ifname}`,
          decision: "drop",
          description: `No route to ${dstIp?.address}`,
        });
        return [false, packet, changes];
      }

      // Standard vEth logic for non-bridge interfaces
      if (item?.vEthOtherEndNs && item?.vEthOtherEndIfname) {
        const nextPacket = {
          ...packet,
          srcNamespace: item.vEthOtherEndNs,
          srcInterface: item.vEthOtherEndIfname
        };

        changes.push({
          namespace: item.vEthOtherEndNs,
          hook: "namespace",
          id: `namespace_${item.vEthOtherEndNs}`,
          name: `Namespace: ${item.vEthOtherEndNs}`,
          decision: "accept",
        });

        changes.push({
          namespace: item.vEthOtherEndNs,
          hook: "interfaces_in",
          id: interfaceToId(item.vEthOtherEndNs, item.link_index!), // We know link_index is set if vEth fields are set
          name: item.vEthOtherEndIfname,
          decision: "accept",
        });

        return [true, nextPacket, changes];
      }

      return [false, packet, changes];
    }
  }
}));

export const useAddrData = () => useAddrStore((state) => state.data);
export const useAddrActions = () => useAddrStore((state) => state.actions);
