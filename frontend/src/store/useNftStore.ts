import { create } from 'zustand';
import { ElementDefinition } from 'cytoscape';

import { ProcessedNft, restructureNft } from './preprocess/nftPreprocess';
import { nftToGraph, translateNftTraceResult } from './toGraph/nftToGraph';
import { Packet, Change } from '@/types/packet';
import { NftResponse } from '@/types/nft';
import { traceNftPacket } from './trace/nftTrace';

type NftActions = {
  setData: (data: Map<string, NftResponse>) => void;
  getGraph: (namespace: string, hook: string) => ElementDefinition[];
  tracePacket: (packet: Packet, hook: string, namespace: string) => [Packet, Change[]];
}

type NftStore = {
  data: Map<string, ProcessedNft>;
  actions: NftActions
}

const useNftStore = create<NftStore>((set, get) => ({
  data: new Map(),
  actions: {
    setData: (data) => {
      const restructuredData = new Map<string, ProcessedNft>();
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
      if (!namespaceData) {
        return [packet, []];
      }

      const hookData = namespaceData.get(hook);
      if (!hookData) {
        return [packet, []];
      }

      // Convert hookData Map<string, [ChainDef, RuleDef[]]> to Map<string, { chain: ChainDef, rules: RuleDef[] }>
      const chainsMap = new Map();
      hookData.forEach(([chain, rules], name) => {
        chainsMap.set(name, { chain, rules });
      });

      const traceResult = traceNftPacket(packet, chainsMap);
      return translateNftTraceResult(traceResult, namespace, hook);
    }
  }
}));

export const useNftData = () => useNftStore((state) => state.data)
export const useNftActions = () => useNftStore((state) => state.actions)
