import { create } from 'zustand';
import { ElementDefinition } from 'cytoscape';
import { AddrResponse } from '@/types/addr';
import { Packet, Change } from '@/types/packet';
import { addrToGraph, interfaceToId } from './toGraph/addrToGraph';

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
          id: "",
          decision: "other",
        });
      } else {
        const addrData = get().data.get(srcNamespace || "host");
        const item = addrData?.find(i => i.ifname === srcInterface);

        changes.push({
          namespace: "host",
          hook: "interfaces_in",
          id: item ? interfaceToId(srcNamespace || "host", item.ifindex) : "",
          decision: "other",
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
      return addrData.some(item => item.master === ifname);
    },
    doesGoToNamespace: (packet: Packet, namespace: string): [boolean, Packet, Change[]] => {
      const { dstInterface } = packet;
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
          decision: "accept",
        });
      }

      if (item?.vEthOtherEndNs && item?.vEthOtherEndIfname) {
        const nextPacket = {
          ...packet,
          srcNamespace: item.vEthOtherEndNs,
          srcInterface: item.vEthOtherEndIfname
        };

        changes.push({
          namespace: item.vEthOtherEndNs,
          hook: "interfaces_in",
          id: interfaceToId(item.vEthOtherEndNs, item.link_index!), // We know link_index is set if vEth fields are set
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
