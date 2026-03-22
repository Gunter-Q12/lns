import { create } from 'zustand';
import { ElementDefinition } from 'cytoscape';

import { RestructuredNft, restructureNft } from './transformers/nftTransformer';
import { Packet, Change } from '@/types/packet';
import { NftResponse } from '@/types/nft';

type NftActions = {
  setNftData: (data: NftResponse) => void;
  getGraph: (hook: string) => ElementDefinition[];
  tracePacket: (packet: Packet) => [Packet, Change[]];
}

type NftStore = {
  data: RestructuredNft;
  actions: NftActions
}

const useNftStore = create<NftStore>((set) => ({
  data: new Map(),
  actions: {
    setNftData: (data) => set({ data: restructureNft(data) }),
    getGraph: (_: string): ElementDefinition[] => {
      // TODO: implement
    return [
        { data: { id: 'stub-node-1', name: 'Stub entry' } },
        { data: { id: 'stub-node-2', name: 'Stub entry II' } },
        { data: { source: 'stub-node-1', target: 'stub-node-2' } },
    ]
    },
    tracePacket: (packet: Packet): [Packet, Change[]] => {
      const changes = [
        { namespace: "host", hook: "ip_prerouting", id: 'trace-1', decision: "Drop" }
      ];
      return [packet, changes];
    }
  }
}));

export const useNftData = () => useNftStore((state) => state.data)
export const useNftActions = () => useNftStore((state) => state.actions)
