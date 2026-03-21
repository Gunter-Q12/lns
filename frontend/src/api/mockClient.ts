import { NftResponse } from '@/types/nft';

export async function mockFetchNft(_baseUrl: string = '/api'): Promise<NftResponse> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return { nftables: [] };
}

export async function mockFetchRoute(_baseUrl: string = '/api'): Promise<any> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return {};
}

export async function mockFetchAddr(_baseUrl: string = '/api'): Promise<any> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return {};
}
