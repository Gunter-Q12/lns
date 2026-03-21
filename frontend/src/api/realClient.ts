import { ApiClient } from './types';
import { NftResponse, NftResponseSchema } from './nftTypes';

export const createRealApiClient = (baseUrl: string = '/api'): ApiClient => ({
  async getNft(): Promise<NftResponse> {
    const response = await fetch(`${baseUrl}/nft`);
    if (!response.ok) {
      throw new Error(`Failed to fetch nft: ${response.statusText}`);
    }
    const data = await response.json();
    return NftResponseSchema.parse(data);
  },

  async getRoute(): Promise<any> {
    const response = await fetch(`${baseUrl}/route`);
    if (!response.ok) {
      throw new Error(`Failed to fetch route: ${response.statusText}`);
    }
    return response.json();
  },

  async getAddr(): Promise<any> {
    const response = await fetch(`${baseUrl}/addr`);
    if (!response.ok) {
      throw new Error(`Failed to fetch addr: ${response.statusText}`);
    }
    return response.json();
  },
});
