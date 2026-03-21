import * as mockClient from './mockClient';
import * as realClient from './realClient';

// Determine which client to use based on environment variable
const useMock = import.meta.env.VITE_USE_MOCK_API === 'true' || import.meta.env.DEV;

const baseUrl = import.meta.env.VITE_API_Base_URL || '/api';

export const fetchNft = () =>
  useMock ? mockClient.mockFetchNft(baseUrl) : realClient.fetchNft(baseUrl);

export const fetchRoute = () =>
  useMock ? mockClient.mockFetchRoute(baseUrl) : realClient.fetchRoute(baseUrl);

export const fetchAddr = () =>
  useMock ? mockClient.mockFetchAddr(baseUrl) : realClient.fetchAddr(baseUrl);
