import { create } from 'zustand';
import { ElementDefinition } from 'cytoscape';
import { IpResponse } from '@/types/ip';
import { Packet, Change } from '@/types/packet';
import { ipToGraph } from './transformers/ipToGraph';

type IpActions = {
  setData: (data: Map<string, IpResponse>) => void;
  getGraph: (namespace: string) => ElementDefinition[];
  tracePacket: (packet: Packet) => [Packet, Change[]];
}

type IpStore = {
  data: Map<string, IpResponse>;
  actions: IpActions;
}

const useIpStore = create<IpStore>((set, get) => ({
  data: new Map(),
  actions: {
    setData: (data) => set({ data }),
    getGraph: (namespace: string): ElementDefinition[] => {
        const namespaceData = get().data.get(namespace);
        if (!namespaceData) return [];
        return ipToGraph(namespaceData);
    },
    tracePacket: (packet: Packet): [Packet, Change[]] => {
      const changes = [
        { namespace: "host", hook: "routing", id: 'stub-node-ip-1', decision: "forward" },
      ];
      return [packet, changes];
    }
  }
}));

export const useIpData = () => useIpStore((state) => state.data);
export const useIpActions = () => useIpStore((state) => state.actions);
