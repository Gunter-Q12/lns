import { create } from 'zustand';
import { ElementDefinition } from 'cytoscape';
import { IpResponse } from '@/types/ip';
import { Packet, Change } from '@/types/packet';
import { ipToGraph } from './transformers/ipToGraph';
import { ProcessedIp, preprocessIp } from './preprocess/ipPreprocess';

type IpActions = {
  setData: (data: Map<string, IpResponse>) => void;
  getGraph: (namespace: string) => ElementDefinition[];
  tracePacket: (packet: Packet, namepsace: string) => [Packet, Change[]];
}

type IpStore = {
  data: Map<string, ProcessedIp>;
  actions: IpActions;
}

const useIpStore = create<IpStore>((set, get) => ({
  data: new Map(),
  actions: {
    setData: (data) => {
      const processedData = new Map<string, ProcessedIp>();
      data.forEach((value, key) => {
        processedData.set(key, preprocessIp(value));
      });
      set({ data: processedData });
    },
    getGraph: (namespace: string): ElementDefinition[] => {
        const namespaceData = get().data.get(namespace);
        if (!namespaceData) return [];
        return ipToGraph(namespaceData);
    },
    tracePacket: (packet: Packet, _: string): [Packet, Change[]] => {
      const changes = [
        { namespace: "host", hook: "routing", id: 'stub-node-ip-1', decision: "forward" },
      ];
      return [packet, changes];
    }
  }
}));

export const useIpData = () => useIpStore((state) => state.data);
export const useIpActions = () => useIpStore((state) => state.actions);
