import { ApiClient, Change, SubgraphNode, TraceRequest } from './types';
import subgraphsMock from '@/data/subgraphs.json';
import changesMock from '@/data/changes.json';

export class MockApiClient implements ApiClient {
  async getSubgraphs(): Promise<SubgraphNode[]> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));
    return subgraphsMock as SubgraphNode[];
  }

  async tracePacket(request: TraceRequest): Promise<Change[]> {
    console.log('[MockAPI] Tracing packet:', request);
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    return changesMock as Change[];
  }
}
