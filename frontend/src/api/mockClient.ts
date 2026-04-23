import { NftResponse, NftResponseSchema } from '@/types/nft';
import { AddrResponse, AddrResponseSchema } from '@/types/addr';
import { RuleResponseSchema, IpResponse, RouteResponseSchema } from '@/types/ip';
import { LsnsResponse, LsnsResponseSchema } from '@/types/lsns';

export async function mockFetchNft(_baseUrl: string, namespace?: string): Promise<NftResponse> {
  let data;
  if (namespace === "/run/docker/netns/31beedc22845") {
    data = await import('../testdata/nft/demo_docker0_nft.json');
  } else if (namespace === "/run/docker/netns/0b4b9baa433a") {
    data = await import('../testdata/nft/demo_docker1_nft.json');
  } else if (namespace === "/run/docker/netns/6772672e60ad") {
    data = await import('../testdata/nft/demo_docker2_nft.json');
  } else {
    data = await import('../testdata/nft/demo_host.json');
  }
  return NftResponseSchema.parse(data);
}

export async function mockFetchRoute(_baseUrl: string, namespace?: string): Promise<IpResponse> {
  let route4Module, route6Module, rule4Module, rule6Module;

  if (namespace === "/run/docker/netns/31beedc22845") {
    [route4Module, route6Module, rule4Module, rule6Module] = await Promise.all([
      import('../testdata/route/demo_docker0_4.json'),
      import('../testdata/route/demo_docker0_6.json'),
      import('../testdata/rule/demo_docker0_rule4.json'),
      import('../testdata/rule/demo_docker0_rule6.json'),
    ]);
  } else if (namespace === "/run/docker/netns/0b4b9baa433a") {
    [route4Module, route6Module, rule4Module, rule6Module] = await Promise.all([
      import('../testdata/route/demo_docker1_4.json'),
      import('../testdata/route/demo_docker1_6.json'),
      import('../testdata/rule/demo_docker1_rule4.json'),
      import('../testdata/rule/demo_docker1_rule6.json'),
    ]);
  } else if (namespace === "/run/docker/netns/6772672e60ad") {
    [route4Module, route6Module, rule4Module, rule6Module] = await Promise.all([
      import('../testdata/route/demo_docker2_4.json'),
      import('../testdata/route/demo_docker2_6.json'),
      import('../testdata/rule/demo_docker2_rule4.json'),
      import('../testdata/rule/demo_docker2_rule6.json'),
    ]);
  } else {
    [route4Module, route6Module, rule4Module, rule6Module] = await Promise.all([
      import('../testdata/route/demo_host4.json'),
      import('../testdata/route/demo_host6.json'),
      import('../testdata/rule/demo_host4.json'),
      import('../testdata/rule/demo_host6.json'),
    ]);
  }

  const routes4 = RouteResponseSchema.parse(route4Module.default).map(r => ({ ...r, isV6: false }));
  const routes6 = RouteResponseSchema.parse(route6Module.default).map(r => ({ ...r, isV6: true }));
  const rules4 = RuleResponseSchema.parse(rule4Module.default).map(r => ({ ...r, isV6: false }));
  const rules6 = RuleResponseSchema.parse(rule6Module.default).map(r => ({ ...r, isV6: true }));

  return {
    routes: [...routes4, ...routes6],
    rules: [...rules4, ...rules6],
  };
}

export async function mockFetchAddr(_baseUrl: string, namespace?: string): Promise<AddrResponse> {
  let data;
  if (namespace === "/run/docker/netns/31beedc22845") {
    data = await import('../testdata/addr/demo_docker0_addr.json');
  } else if (namespace === "/run/docker/netns/0b4b9baa433a") {
    data = await import('../testdata/addr/demo_docker1_addr.json');
  } else if (namespace === "/run/docker/netns/6772672e60ad") {
    data = await import('../testdata/addr/demo_docker2_addr.json');
  } else {
    data = await import('../testdata/addr/demo_host.json');
  }
  return AddrResponseSchema.parse(data.default);
}

export async function mockFetchLsns(_baseUrl: string, _namespace?: string): Promise<LsnsResponse> {
  const data = await import('../testdata/lsns/demo_host.json');
  return LsnsResponseSchema.parse(data.default);
}
