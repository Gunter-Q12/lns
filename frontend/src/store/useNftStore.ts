import { create } from 'zustand';
import { ElementDefinition } from 'cytoscape';

import { RestructuredNft, restructureNft } from './transformers/nftTransformer';
import { nftToGraph } from './transformers/nftToGraph';
import { Packet, Change } from '@/types/packet';
import { NftResponse } from '@/types/nft';

type NftActions = {
  setData: (data: NftResponse) => void;
  getGraph: (hook: string) => ElementDefinition[];
  tracePacket: (packet: Packet) => [Packet, Change[]];
}

type NftStore = {
  data: RestructuredNft;
  actions: NftActions
}

const useNftStore = create<NftStore>((set, get) => ({
  data: new Map(),
  actions: {
    setData: (data) => set({ data: restructureNft(data) }),
    getGraph: (_: string): ElementDefinition[] => {
        return nftToGraph(get().data);
    },
    tracePacket: (packet: Packet): [Packet, Change[]] => {
      const changes = [
        { namespace: "host", hook: "ip_prerouting", id: 'stub-node-1', decision: "change" },
        { namespace: "host", hook: "ip_prerouting", id: 'stub-node-2', decision: "drop" },
      ];
      return [packet, changes];
    }
  }
}));

export const useNftData = () => useNftStore((state) => state.data)
export const useNftActions = () => useNftStore((state) => state.actions)
