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
  const route4Url = new URL('route4', baseUrl);
  const route6Url = new URL('route6', baseUrl);
  const rule4Url = new URL('rule4', baseUrl);
  const rule6Url = new URL('rule6', baseUrl);

  if (namespace) {
    route4Url.searchParams.append('namespace', namespace);
    route6Url.searchParams.append('namespace', namespace);
    rule4Url.searchParams.append('namespace', namespace);
    rule6Url.searchParams.append('namespace', namespace);
  }

  const [route4Res, route6Res, rule4Res, rule6Res] = await Promise.all([
    fetch(route4Url.toString()),
    fetch(route6Url.toString()),
    fetch(rule4Url.toString()),
    fetch(rule6Url.toString()),
  ]);

  if (!route4Res.ok || !route6Res.ok || !rule4Res.ok || !rule6Res.ok) {
    throw new Error(`Failed to fetch routes or rules`);
  }

  const [routes4, routes6, rules4, rules6] = await Promise.all([
    route4Res.json(),
    route6Res.json(),
    rule4Res.json(),
    rule6Res.json(),
  ]);

  const parsedRoutes4 = RouteResponseSchema.parse(routes4).map(r => ({ ...r, isV6: false }));
  const parsedRoutes6 = RouteResponseSchema.parse(routes6).map(r => ({ ...r, isV6: true }));
  const parsedRules4 = RuleResponseSchema.parse(rules4).map(r => ({ ...r, isV6: false }));
  const parsedRules6 = RuleResponseSchema.parse(rules6).map(r => ({ ...r, isV6: true }));

  return {
    routes: [...parsedRoutes4, ...parsedRoutes6],
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
