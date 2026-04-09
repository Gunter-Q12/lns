import { create } from 'zustand';
import { ElementDefinition } from 'cytoscape';
import { AddrResponse } from '@/types/addr';
import { Packet, Change } from '@/types/packet';
import { addrToGraph, interfaceToId } from './transformers/addrToGraph';

type AddrActions = {
  setData: (data: Map<string, AddrResponse>) => void;
  getGraph: (namespace: string) => ElementDefinition[];
  tracePacket: (packet: Packet) => [Packet, Change[]];
  listInterfaces: () => Map<string, string[]>;
  isBridge: (ifname: string, namespace: string) => boolean;
  isLocal: (packet: Packet) => boolean;
  doesGoToNamespace: (packet: Packet, namespace: string) => [boolean, Packet, Change[]];
}

type AddrStore = {
  data: Map<string, AddrResponse>;
  actions: AddrActions;
}

const useAddrStore = create<AddrStore>((set, get) => ({
  data: new Map(),
  actions: {
    setData: (data) => set({ data }),
    getGraph: (namespace: string): ElementDefinition[] => {
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
    isLocal: (packet: Packet): boolean => {
      // TODO: check against local addresses and interface addresses
        return true;
    },
    doesGoToNamespace: (packet: Packet, namespace: string): [boolean, Packet, Change[]] => {
      return [false, packet, []];
    }
  }
}));

export const useAddrData = () => useAddrStore((state) => state.data);
export const useAddrActions = () => useAddrStore((state) => state.actions);
