import { create } from 'zustand';
import { ElementDefinition } from 'cytoscape';

import { RestructuredNft, restructureNft } from './transformers/nftTransformer';
import { nftToGraph } from './transformers/nftToGraph';
import { Packet, Change } from '@/types/packet';
import { NftResponse } from '@/types/nft';

type NftActions = {
  setData: (data: Map<string, NftResponse>) => void;
  getGraph: (namespace: string, hook: string) => ElementDefinition[];
  tracePacket: (packet: Packet) => [Packet, Change[]];
}

type NftStore = {
  data: Map<string, RestructuredNft>;
  actions: NftActions
}

const useNftStore = create<NftStore>((set, get) => ({
  data: new Map(),
  actions: {
    setData: (data) => {
      const restructuredData = new Map<string, RestructuredNft>();
      data.forEach((val, key) => {
        restructuredData.set(key, restructureNft(val));
      });
      set({ data: restructuredData });
    },
    getGraph: (namespace: string, hook: string): ElementDefinition[] => {
      const namespaceData = get().data.get(namespace);
      if (!namespaceData) return [];
      return nftToGraph(namespaceData, hook);
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
