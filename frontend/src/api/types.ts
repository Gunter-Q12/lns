export interface SubgraphNode {
  id: number;
  pin: string;
  info: {
    matcher: string;
    decision: string;
  };
  next: number[];
}

export interface Change {
  id: number;
  change: string;
  pin: string;
  decision: 'drop' | 'accept' | 'change' | 'other' | string;
}

export interface TraceRequest {
  protocol: string;
  senderMac?: string;
  targetMac?: string;
  srcPort?: string;
  dstPort?: string;
  srcIp?: string;
  dstIp?: string;
}

export interface ApiClient {
  getSubgraphs(): Promise<SubgraphNode[]>;
  tracePacket(request: TraceRequest): Promise<Change[]>;
}
