import { AddrResponse } from '@/types/addr';
import { IpResponse } from '@/types/ip';
import { LsnsResponse } from '@/types/lsns';
import * as mockClient from './mockClient';
import * as realClient from './realClient';

// These will be initialized from main.tsx
let useMock = false;
let baseUrl = '/api';

export const setBaseUrl = (url: string) => {
  baseUrl = url;
};

export const setUseMock = (mock: boolean) => {
  useMock = mock;
};

export const fetchNft = (namespace?: string) =>
  useMock ? mockClient.mockFetchNft(baseUrl, namespace) : realClient.fetchNft(baseUrl, namespace);

export const fetchRoute = (namespace?: string): Promise<IpResponse> =>
  useMock ? mockClient.mockFetchRoute(baseUrl, namespace) : realClient.fetchRoute(baseUrl, namespace);

export const fetchAddr = (namespace?: string): Promise<AddrResponse> =>
  useMock ? mockClient.mockFetchAddr(baseUrl, namespace) : realClient.fetchAddr(baseUrl, namespace);

export const fetchLsns = (namespace?: string): Promise<LsnsResponse> =>
  useMock ? mockClient.mockFetchLsns(baseUrl, namespace) : realClient.fetchLsns(baseUrl, namespace);
