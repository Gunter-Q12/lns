import { create } from 'zustand';
import { ElementDefinition } from 'cytoscape';
import { IpResponse } from '@/types/ip';
import { Packet, Change } from '@/types/packet';

type IpActions = {
  setData: (data: IpResponse) => void;
  getGraph: (hook: string) => ElementDefinition[];
  tracePacket: (packet: Packet) => [Packet, Change[]];
}

type IpStore = {
  data: IpResponse;
  actions: IpActions;
}

const useIpStore = create<IpStore>((set) => ({
  data: {
    routes: [],
    rules: [],
  },
  actions: {
    setData: (data) => set({ data }),
    getGraph: (_: string): ElementDefinition[] => {
      // TODO: implement
      return [
        { data: { id: 'stub-node-ip-1', name: 'Stub IP entry' } },
        { data: { id: 'stub-node-ip-2', name: 'Stub IP entry II' } },
        { data: { source: 'stub-node-ip-1', target: 'stub-node-ip-2' } },
      ];
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
