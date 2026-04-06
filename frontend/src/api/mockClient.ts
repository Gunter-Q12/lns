import { NftResponse, NftResponseSchema } from '@/types/nft';
import { AddrResponse, AddrResponseSchema } from '@/types/addr';
import { RuleResponseSchema, IpResponse, RouteResponseSchema } from '@/types/ip';
import { LsnsResponse, LsnsResponseSchema } from '@/types/lsns';

export async function mockFetchNft(_baseUrl: string, namespace?: string): Promise<NftResponse> {
  let data;
  if (namespace === "/run/docker/netns/94ba6f52f019") {
    data = await import('./__tests__/fixtures/nft/docker.json');
  } else {
    data = await import('./__tests__/fixtures/nft/long_chain.json');
  }
  return NftResponseSchema.parse(data);
}

export async function mockFetchRoute(_baseUrl: string, namespace?: string): Promise<IpResponse> {
  let routeModule, rule4Module, rule6Module;

  if (namespace === "/run/docker/netns/94ba6f52f019") {
    [routeModule, rule4Module, rule6Module] = await Promise.all([
      import('./__tests__/fixtures/route/docker.json'),
      import('./__tests__/fixtures/rule/docker4.json'),
      import('./__tests__/fixtures/rule/docker6.json'),
    ]);
  } else {
    [routeModule, rule4Module, rule6Module] = await Promise.all([
      import('./__tests__/fixtures/route/route.json'),
      import('./__tests__/fixtures/rule/rule4.json'),
      import('./__tests__/fixtures/rule/rule6.json'),
    ]);
  }

  const routes = RouteResponseSchema.parse(routeModule.default);
  const rules4 = RuleResponseSchema.parse(rule4Module.default);
  const rules6 = RuleResponseSchema.parse(rule6Module.default);

  return {
    routes,
    rules: [...rules4, ...rules6],
  };
}

export async function mockFetchAddr(_baseUrl: string, namespace?: string): Promise<AddrResponse> {
  let data;
  if (namespace === "/run/docker/netns/94ba6f52f019") {
    data = await import('./__tests__/fixtures/addr/docker.json');
  } else {
    data = await import('./__tests__/fixtures/addr/addr.json');
  }
  return AddrResponseSchema.parse(data.default);
}

export async function mockFetchLsns(_baseUrl: string, _namespace?: string): Promise<LsnsResponse> {
  const data = await import('./__tests__/fixtures/lsns/lsns.json');
  return LsnsResponseSchema.parse(data.default);
}
