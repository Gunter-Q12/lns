import { ApiClient } from './types';
import { NftResponse, NftResponseSchema } from './nftTypes';

export class RealApiClient implements ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  async getNft(): Promise<NftResponse> {
    const response = await fetch(`${this.baseUrl}/nft`);
    if (!response.ok) {
      throw new Error(`Failed to fetch nft: ${response.statusText}`);
    }
    const data = await response.json();
    return NftResponseSchema.parse(data);
  }

  async getRoute(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/route`);
    if (!response.ok) {
      throw new Error(`Failed to fetch route: ${response.statusText}`);
    }
    return response.json();
  }

  async getAddr(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/addr`);
    if (!response.ok) {
      throw new Error(`Failed to fetch addr: ${response.statusText}`);
    }
    return response.json();
  }
}
