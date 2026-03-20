import { ApiClient } from './types';
import { MockApiClient } from './mockClient';
import { RealApiClient } from './realClient';

// Determine which client to use based on environment variable
// You can set VITE_USE_MOCK_API=true in .env to force mock mode
const useMock = import.meta.env.VITE_USE_MOCK_API === 'true' || import.meta.env.DEV;

export const api: ApiClient = useMock
  ? new MockApiClient()
  : new RealApiClient(import.meta.env.VITE_API_Base_URL || '/api');

export * from './types';
export * from './nftTypes';
