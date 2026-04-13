import { create } from 'zustand';
import { ElementDefinition } from 'cytoscape';
import { IpResponse } from '@/types/ip';
import { Packet, Change } from '@/types/packet';
import { ipToGraph, translateTraceResult } from './toGraph/ipToGraph';
import { ProcessedIp, preprocessIp } from './preprocess/ipPreprocess';
import { traceIp } from './trace/ipTrace';

type IpActions = {
  setData: (data: Map<string, IpResponse>) => void;
  getGraph: (namespace: string) => ElementDefinition[];
  tracePacket: (packet: Packet, namespace: string) => [Packet, Change[]];
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
    tracePacket: (packet: Packet, namespace: string): [Packet, Change[]] => {
      const namespaceData = get().data.get(namespace);
      if (!namespaceData) {
        return [packet, []];
      }
      const traceResult = traceIp(packet, namespaceData);
      return translateTraceResult(traceResult, namespaceData);
    }
  }
}));

export const useIpData = () => useIpStore((state) => state.data);
export const useIpActions = () => useIpStore((state) => state.actions);
