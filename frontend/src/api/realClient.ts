import { NftResponse, NftResponseSchema } from '@/types/nft';
import { AddrResponse, AddrResponseSchema } from '@/types/addr';
import { RuleResponseSchema, IpResponse, RouteResponseSchema } from '@/types/ip';
import { LsnsResponse, LsnsResponseSchema } from '@/types/lsns';

export async function fetchNft(baseUrl: string, namespace?: string): Promise<NftResponse> {
  const url = new URL('nft', baseUrl);
  if (namespace) url.searchParams.append('namespace', namespace);
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Failed to fetch nft: ${response.statusText}`);
  }
  const data = await response.json();
  return NftResponseSchema.parse(data);
}

export async function fetchRoute(baseUrl: string, namespace?: string): Promise<IpResponse> {
  const routeUrl = new URL('route', baseUrl);
  const rule4Url = new URL('rule4', baseUrl);
  const rule6Url = new URL('rule6', baseUrl);

  if (namespace) {
    routeUrl.searchParams.append('namespace', namespace);
    rule4Url.searchParams.append('namespace', namespace);
    rule6Url.searchParams.append('namespace', namespace);
  }

  const [routeRes, rule4Res, rule6Res] = await Promise.all([
    fetch(routeUrl.toString()),
    fetch(rule4Url.toString()),
    fetch(rule6Url.toString()),
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

export async function fetchAddr(baseUrl: string, namespace?: string): Promise<AddrResponse> {
  const url = new URL('addr', baseUrl);
  if (namespace) url.searchParams.append('namespace', namespace);
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Failed to fetch addr: ${response.statusText}`);
  }
  const data = await response.json();
  return AddrResponseSchema.parse(data);
}

export async function fetchLsns(baseUrl: string, namespace?: string): Promise<LsnsResponse> {
  const url = new URL('namespaces', baseUrl);
  if (namespace) url.searchParams.append('namespace', namespace);
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Failed to fetch namespaces: ${response.statusText}`);
  }
  const data = await response.json();
  return LsnsResponseSchema.parse(data);
}
