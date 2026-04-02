import { create } from 'zustand';
import { ElementDefinition } from 'cytoscape';
import { IpResponse } from '@/types/ip';
import { Packet, Change } from '@/types/packet';
import { ipToGraph } from './transformers/ipToGraph';

type IpActions = {
  setData: (data: IpResponse) => void;
  getGraph: (hook: string) => ElementDefinition[];
  tracePacket: (packet: Packet) => [Packet, Change[]];
}

type IpStore = {
  data: IpResponse;
  actions: IpActions;
}

const useIpStore = create<IpStore>((set, get) => ({
  data: {
    routes: [],
    rules: [],
  },
  actions: {
    setData: (data) => set({ data }),
    getGraph: (_: string): ElementDefinition[] => {
        return ipToGraph(get().data);
    },
    tracePacket: (packet: Packet): [Packet, Change[]] => {
      const changes = [
        { namespace: "host", hook: "routing", id: 'stub-node-ip-1', decision: "forward" },
      ];
      return [packet, changes];
    }
  }
}));

export const useIpData = () => useIpStore((state) => state.data);
export const useIpActions = () => useIpStore((state) => state.actions);
