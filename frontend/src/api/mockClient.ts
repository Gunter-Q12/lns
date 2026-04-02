import { NftResponse, NftResponseSchema } from '@/types/nft';
import { AddrResponse, AddrResponseSchema } from '@/types/addr';
import { RuleResponseSchema, IpResponse, RouteResponseSchema } from '@/types/ip';

export async function mockFetchNft(_baseUrl: string = '/api'): Promise<NftResponse> {
  const data = await import('./__tests__/fixtures/nft/long_chain.json');
  return NftResponseSchema.parse(data);
}

export async function mockFetchRoute(_baseUrl: string = '/api'): Promise<IpResponse> {
  const [routeModule, rule4Module, rule6Module] = await Promise.all([
    import('./__tests__/fixtures/route/route.json'),
    import('./__tests__/fixtures/rule/rule4.json'),
    import('./__tests__/fixtures/rule/rule6.json'),
  ]);

  const routes = RouteResponseSchema.parse(routeModule.default);
  const rules4 = RuleResponseSchema.parse(rule4Module.default);
  const rules6 = RuleResponseSchema.parse(rule6Module.default);

  return {
    routes,
    rules: [...rules4, ...rules6],
  };
}

export async function mockFetchAddr(_baseUrl: string = '/api'): Promise<AddrResponse> {
  const data = await import('./__tests__/fixtures/addr/addr.json');
  return AddrResponseSchema.parse(data.default);
}
