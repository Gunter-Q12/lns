import { ApiClient } from './types';
import { NftResponse } from './nftTypes';

export class MockApiClient implements ApiClient {
  async getNft(): Promise<NftResponse> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { nftables: [] };
  }

  async getRoute(): Promise<any> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return {};
  }

  async getAddr(): Promise<any> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return {};
  }
}
