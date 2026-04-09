import { NftResponse, ChainDef, RuleDef } from '@/types/nft';

/**
 * Maps represented as follows:
 * result: Map<hookName, Map<chainName, [chainDef, ruleDefs[]]>>  #TODO: create aliases
 */
export type RestructuredNft = Map<string, Map<string, [ChainDef, RuleDef[]]>>;

/**
 * Restructure the parsed nftables data into a mapping from hook names to mappings
 * from chain names to pairs of chain definitions and their rules.
 */
export function restructureNft(root: NftResponse): RestructuredNft {
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

  const result: RestructuredNft = new Map();

  for (const [key, chain] of chains.entries()) {
    if (chain.hook) {
      const hook = `${chain.family}_${chain.hook}`;
      const ruleVec = rules.get(key) || [];

      if (!result.has(hook)) {
        result.set(hook, new Map());
      }

      result.get(hook)!.set(chain.name, [chain, ruleVec]);
    }
  }

  return result;
}
