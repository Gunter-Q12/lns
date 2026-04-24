import { Address4, Address6 } from 'ip-address';
import { IpResponse, RouteItem, RuleItem } from '../../types/ip';

export interface Address {
  parsed: Address4 | Address6;
  label: string;
}

export type ProcessedRouteItem = Omit<RouteItem, 'dst'> & {
  dst: Address;
};

export type ProcessedRuleItem = Omit<RuleItem, 'src' | 'dst'> & {
  src: Address | undefined;
  dst: Address | undefined;
};

export interface ProcessedIp {
  rules: ProcessedRuleItem[];
  routes: Record<string, ProcessedRouteItem[]>;
}

const parseAddress = (cidr: string | undefined, isV6: boolean = false): Address | undefined => {
  if (!cidr) return undefined;

  let normalizedCidr = cidr;
  if (['all', 'any', '0.0.0.0/0', '::/0', 'default'].includes(cidr)) {
    normalizedCidr = isV6 ? '::/0' : '0.0.0.0/0';
  }
  if (!normalizedCidr.includes('/')) {
    normalizedCidr = `${normalizedCidr}/${isV6 ? 128 : 32}`;
  }

  try {
    const parsed = isV6 ? new Address6(normalizedCidr) : new Address4(normalizedCidr);
    return {
      parsed,
      label: cidr
    };
  } catch {
    return undefined;
  }
};

export const preprocessIp = (data: IpResponse): ProcessedIp => {
  // Sort rules by priority and process addresses
  const rules: ProcessedRuleItem[] = [...data.rules]
    .sort((a, b) => a.priority - b.priority)
    .map(rule => ({
      ...rule,
      src: parseAddress(rule.src, rule.isV6),
      dst: parseAddress(rule.dst, rule.isV6),
    }));

  // Group routes by table and process addresses
  const routes: Record<string, ProcessedRouteItem[]> = {};

  data.routes.forEach((route) => {
    const table = route.table || 'main';
    if (!routes[table]) {
      routes[table] = [];
    }

    const parsedDst = parseAddress(route.dst, route.isV6);
    if (parsedDst) {
      routes[table].push({
        ...route,
        dst: parsedDst,
      });
    }
  });

  // Ensure tables referenced in rules also exist in routes map
  rules.forEach((rule) => {
    if (!routes[rule.table]) {
      routes[rule.table] = [];
    }
  });

  return {
    rules,
    routes,
  };
};
