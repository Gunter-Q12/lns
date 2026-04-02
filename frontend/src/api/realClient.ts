import { NftResponse, NftResponseSchema } from '@/types/nft';
import { AddrResponse, AddrResponseSchema } from '@/types/addr';
import { RuleResponseSchema, IpResponse, RouteResponseSchema } from '@/types/ip';

export async function fetchNft(baseUrl: string = '/api'): Promise<NftResponse> {
  const response = await fetch(`${baseUrl}/nft`);
  if (!response.ok) {
    throw new Error(`Failed to fetch nft: ${response.statusText}`);
  }
  const data = await response.json();
  return NftResponseSchema.parse(data);
}

export async function fetchRoute(baseUrl: string = '/api'): Promise<IpResponse> {
  const [routeRes, rule4Res, rule6Res] = await Promise.all([
    fetch(`${baseUrl}/route`),
    fetch(`${baseUrl}/rule4`),
    fetch(`${baseUrl}/rule6`),
  ]);

  if (!routeRes.ok || !rule4Res.ok || !rule6Res.ok) {
    throw new Error(`Failed to fetch routes or rules`);
  }

  const [routes, rules4, rules6] = await Promise.all([
    routeRes.json(),
    rule4Res.json(),
    rule6Res.json(),
  ]);

  const parsedRoutes = RouteResponseSchema.parse(routes);
  const parsedRules4 = RuleResponseSchema.parse(rules4);
  const parsedRules6 = RuleResponseSchema.parse(rules6);

  return {
    routes: parsedRoutes,
    rules: [...parsedRules4, ...parsedRules6],
  };
}

export async function fetchAddr(baseUrl: string = '/api'): Promise<AddrResponse> {
  const response = await fetch(`${baseUrl}/addr`);
  if (!response.ok) {
    throw new Error(`Failed to fetch addr: ${response.statusText}`);
  }
  const data = await response.json();
  return AddrResponseSchema.parse(data);
}
