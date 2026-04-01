import { NftResponse, NftResponseSchema } from '@/types/nft';
import { AddrResponse, AddrResponseSchema } from '@/types/addr';

export async function fetchNft(baseUrl: string = '/api'): Promise<NftResponse> {
  const response = await fetch(`${baseUrl}/nft`);
  if (!response.ok) {
    throw new Error(`Failed to fetch nft: ${response.statusText}`);
  }
  const data = await response.json();
  return NftResponseSchema.parse(data);
}

export async function fetchRoute(baseUrl: string = '/api'): Promise<any> {
  const response = await fetch(`${baseUrl}/route`);
  if (!response.ok) {
    throw new Error(`Failed to fetch route: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchAddr(baseUrl: string = '/api'): Promise<AddrResponse> {
  const response = await fetch(`${baseUrl}/addr`);
  if (!response.ok) {
    throw new Error(`Failed to fetch addr: ${response.statusText}`);
  }
  const data = await response.json();
  return AddrResponseSchema.parse(data);
}
