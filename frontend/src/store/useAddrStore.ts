import { create } from 'zustand';
import { ElementDefinition } from 'cytoscape';
import { AddrResponse } from '@/types/addr';
import { Packet, Change } from '@/types/packet';
import { addrToGraph } from './transformers/addrToGraph';

type AddrActions = {
  setData: (data: Map<string, AddrResponse>) => void;
  getGraph: (namespace: string) => ElementDefinition[];
  tracePacket: (packet: Packet) => [Packet, Change[]];
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
      // TODO: implement
      const changes: Change[] = [];
      return [packet, changes];
    }
  }
}));

export const useAddrData = () => useAddrStore((state) => state.data);
export const useAddrActions = () => useAddrStore((state) => state.actions);
