import { create } from 'zustand';
import { ElementDefinition } from 'cytoscape';

import { RestructuredNft, restructureNft } from './transformers/nftTransformer';
import { nftToGraph } from './transformers/nftToGraph';
import { Packet, Change } from '@/types/packet';
import { NftResponse } from '@/types/nft';

type NftActions = {
  setData: (data: Map<string, NftResponse>) => void;
  getGraph: (namespace: string, hook: string) => ElementDefinition[];
  tracePacket: (packet: Packet, hook: string, namespace: string) => [Packet, Change[]];
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
    tracePacket: (packet: Packet, hook: string, namespace: string): [Packet, Change[]] => {
      const namespaceData = get().data.get(namespace);
      const changes: Change[] = [];

      if (namespaceData) {
        const hookData = namespaceData.get(hook);
        if (hookData) {
          hookData.forEach(([, rules]) => {  // TODO: order by priority
            rules.forEach((rule) => {
              changes.push({
                namespace: namespace,
                hook: hook,
                id: `${rule.handle}_rule`,
                decision: "accept",  // TODO: set proper decision
              });
            });
          });
        }
      }

      return [packet, changes];
    }
  }
}));

export const useNftData = () => useNftStore((state) => state.data)
export const useNftActions = () => useNftStore((state) => state.actions)
