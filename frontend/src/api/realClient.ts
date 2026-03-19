import { ApiClient, Change, SubgraphNode, TraceRequest } from './types';

export class RealApiClient implements ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  async getSubgraphs(): Promise<SubgraphNode[]> {
    const response = await fetch(`${this.baseUrl}/subgraphs`);
    if (!response.ok) {
      throw new Error(`Failed to fetch subgraphs: ${response.statusText}`);
    }
    return response.json();
  }

  async tracePacket(request: TraceRequest): Promise<Change[]> {
    const response = await fetch(`${this.baseUrl}/trace`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to trace packet: ${response.statusText}`);
    }
    return response.json();
  }
}
