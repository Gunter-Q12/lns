import { create } from 'zustand';
import { ElementDefinition } from 'cytoscape';
import { AddrResponse } from '@/types/addr';
import { Packet, Change } from '@/types/packet';

type AddrActions = {
  setData: (data: AddrResponse) => void;
  getGraph: (hook: string) => ElementDefinition[];
  tracePacket: (packet: Packet) => [Packet, Change[]];
}

type AddrStore = {
  data: AddrResponse;
  actions: AddrActions;
}

const useAddrStore = create<AddrStore>((set) => ({
  data: [],
  actions: {
    setData: (data) => set({ data }),
    getGraph: (_: string): ElementDefinition[] => {
      // TODO: implement
      return [
        { data: { id: 'addr-stub-1', name: 'Addr Stub' } },
      ];
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
