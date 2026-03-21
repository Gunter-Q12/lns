import { create } from 'zustand';
import { RestructuredNft, restructureNft } from '../api/transformers/nftTransformer';

// TODO: move this Enum somewhere
export enum Hook {
  IpPrerouting = "ip_prerouting",
}

// TODO: this type is used everywhere, where can we put it?
export interface Node {
  data: {
    id: string;
    name?: string;
    parent?: string;
    matcher?: string;
    action?: string;
    [key: string]: any;
  };
  position?: {
    x: number;
    y: number;
  }
}

// TODO: move with Node
export interface Edge {
  id: string;
  source: string;
  target: string;
}

export type Graph = Array<Node|Edge>

interface Packet {
}

interface NftActions {
  setNftData: (data: RestructuredNft) => void;
  getSubgraph: (hook: Hook) => Graph;
  tracePacket: (packet: Packet) => [Packet, Graph];
}

interface NftStore {
  data: RestructuredNft;
  actions: NftActions
}

const useNftStore = create<NftStore>((set) => ({
  data: new Map(),
  actions: {
    setNftData: (data) => set({ data: data }),
    getSubgraph: (_: Hook): Graph => {
      return [
        { data: { id: 'stub-node-1', name: 'Stub entry' } },
        { data: { id: 'stub-node-2', name: 'Stub exit', parent: 'stub-node-1' } }
      ];
    },
    tracePacket: (packet: Packet): [Packet, Graph] => {
      const nodes = [
        { data: { id: 'trace-1', name: 'Filter Hit' } }
      ];
      return [packet, nodes];
    }
  }
}));

export const useNftData = () => useNftStore((state) => state.data)
export const useNftActions = () => useNftStore((state) => state.actions)
