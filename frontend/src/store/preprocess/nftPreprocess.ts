import { NftResponse, ChainDef, RuleDef } from '@/types/nft';

/**
 * Maps represented as follows:
 * result: Map<hookName, Map<chainName, { chain: ChainDef, rules: RuleDef[] }>>
 */
export type ProcessedNft = Map<string, Map<string, { chain: ChainDef, rules: RuleDef[] }>>;

/**
 * Get the hook name for a chain.
 * Normalizes family "ip", "ipv6", and "inet" to "ip".
 */
export function getHookName(chain: ChainDef): string {
  const family = ['ip', 'ipv6', 'inet'].includes(chain.family) ? 'ip' : chain.family;
  return `${family}_${chain.hook}`;
}

/**
 * Restructure the parsed nftables data into a mapping from hook names to mappings
 * from chain names to pairs of chain definitions and their rules.
 */
export function restructureNft(root: NftResponse): ProcessedNft {
  const chains = new Map<string, ChainDef>();
  const rules = new Map<string, RuleDef[]>();

  for (const item of root.nftables) {
    if (item.chain) {
      const chain = item.chain;
      const key = `${chain.family}|${chain.table}|${chain.name}`;
      chains.set(key, chain);
    } else if (item.rule) {
      const rule = item.rule;
      const key = `${rule.family}|${rule.table}|${rule.chain}`;

      const ruleVec = rules.get(key) || [];
      ruleVec.push(rule);
      rules.set(key, ruleVec);
    }
  }

  const result: ProcessedNft = new Map();

  for (const [key, chain] of chains.entries()) {
    if (chain.hook) {
      const hook = getHookName(chain);
      const ruleVec = rules.get(key) || [];

      if (!result.has(hook)) {
        result.set(hook, new Map());
      }

      result.get(hook)!.set(chain.name, { chain, rules: ruleVec });
    }
  }

  return result;
}
