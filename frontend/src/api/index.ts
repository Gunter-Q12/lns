import { AddrResponse } from '@/types/addr';
import { IpResponse } from '@/types/ip';
import { LsnsResponse } from '@/types/lsns';
import * as mockClient from './mockClient';
import * as realClient from './realClient';

// Determine which client to use based on environment variable
const useMock = import.meta.env.VITE_USE_MOCK_API === 'true' || import.meta.env.DEV;

const baseUrl = import.meta.env.VITE_API_Base_URL || '/api';

export const fetchNft = (namespace?: string) =>
  useMock ? mockClient.mockFetchNft(baseUrl, namespace) : realClient.fetchNft(baseUrl, namespace);

export const fetchRoute = (namespace?: string): Promise<IpResponse> =>
  useMock ? mockClient.mockFetchRoute(baseUrl, namespace) : realClient.fetchRoute(baseUrl, namespace);

export const fetchAddr = (namespace?: string): Promise<AddrResponse> =>
  useMock ? mockClient.mockFetchAddr(baseUrl, namespace) : realClient.fetchAddr(baseUrl, namespace);

export const fetchLsns = (namespace?: string): Promise<LsnsResponse> =>
  useMock ? mockClient.mockFetchLsns(baseUrl, namespace) : realClient.fetchLsns(baseUrl, namespace);
