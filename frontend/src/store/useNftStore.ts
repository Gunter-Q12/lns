import { create } from 'zustand';
import { RestructuredNft, restructureNft } from './transformers/nftTransformer';

import { Graph } from '@/types/graph';
import { Packet, Change } from '@/types/packet';
import { Hook, NftResponse } from '@/types/nft';

type NftActions = {
  loadNftData: (data: NftResponse) => void;
  getSubgraph: (hook: Hook) => Graph;
  tracePacket: (packet: Packet) => [Packet, Change[]];
}

type NftStore = {
  data: RestructuredNft;
  actions: NftActions
}

const useNftStore = create<NftStore>((set) => ({
  data: new Map(),
  actions: {
    loadNftData: (data) => set({ data: restructureNft(data) }),
    getSubgraph: (_: Hook): Graph => {
      return [
        { data: { id: 'stub-node-1', name: 'Stub entry' } },
        { data: { id: 'stub-node-2', name: 'Stub exit', parent: 'stub-node-1' } }
      ];
    },
    tracePacket: (packet: Packet): [Packet, Change[]] => {
      const changes = [
        { hook: Hook.IpPrerouting, id: 'trace-1', decision: "Drop" }
      ];
      return [packet, changes];
    }
  }
}));

export const useNftData = () => useNftStore((state) => state.data)
export const useNftActions = () => useNftStore((state) => state.actions)
