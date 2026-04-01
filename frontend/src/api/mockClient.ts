import { NftResponse, NftResponseSchema } from '@/types/nft';
import { AddrResponse, AddrResponseSchema } from '@/types/addr';

export async function mockFetchNft(_baseUrl: string = '/api'): Promise<NftResponse> {
  const data = await import('./__tests__/fixtures/nft/long_chain.json');
  return NftResponseSchema.parse(data);
}

export async function mockFetchRoute(_baseUrl: string = '/api'): Promise<any> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return {};
}

export async function mockFetchAddr(_baseUrl: string = '/api'): Promise<AddrResponse> {
  const data = await import('./__tests__/fixtures/addr/addr.json');
  return AddrResponseSchema.parse(data.default);
}
