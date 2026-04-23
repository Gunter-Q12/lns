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
  if (!chain.hook) {
    return "hookless";
  }
  const family = ['ip', 'ipv6', 'inet'].includes(chain.family) ? 'ip' : chain.family;
  return `${family}_${chain.hook}`;
}

/**
 * Restructure the parsed nftables data into a mapping from hook names to mappings
 * from chain names to pairs of chain definitions and their rules.
 * This also performs a DFS/reachability analysis to ensure that all chains
 * reachable via jumps from a hook's base chains are included within that hook's entry.
 */
export function restructureNft(root: NftResponse): ProcessedNft {
  const { chains, chainRules, chainsByName } = collectNftElements(root);
  const result: ProcessedNft = new Map();

  // Group base chains by their hook names
  const hookStartingPoints = new Map<string, string[]>();
  for (const [key, chain] of chains.entries()) {
    if (chain.hook) {
      const hookName = getHookName(chain);
      const keys = hookStartingPoints.get(hookName) || [];
      keys.push(key);
      hookStartingPoints.set(hookName, keys);
    }
  }

  // For each hook, discover all reachable chains via jumps
  for (const [hookName, startKeys] of hookStartingPoints.entries()) {
    result.set(
      hookName,
      findReachableChains(startKeys, chains, chainRules, chainsByName)
    );
  }

  return result;
}

/**
 * Initial collection of all chains and rules from the raw NFT response.
 * Indexes chains by their unique key (family|table|name) and also by name.
 */
function collectNftElements(root: NftResponse) {
  const chains = new Map<string, ChainDef>();
  const chainRules = new Map<string, RuleDef[]>();
  const chainsByName = new Map<string, string[]>();

  for (const item of root.nftables) {
    if (item.chain) {
      const chain = item.chain;
      const key = `${chain.family}|${chain.table}|${chain.name}`;
      chains.set(key, chain);

      const keys = chainsByName.get(chain.name) || [];
      keys.push(key);
      chainsByName.set(chain.name, keys);
    } else if (item.rule) {
      const rule = item.rule;
      const key = `${rule.family}|${rule.table}|${rule.chain}`;

      // Identify jump target if present
      for (const ex of rule.expr) {
        if ('jump' in ex && ex.jump?.target) {
          rule.jumpsTo = ex.jump.target;
          break;
        }
      }

      const ruleVec = chainRules.get(key) || [];
      ruleVec.push(rule);
      chainRules.set(key, ruleVec);
    }
  }

  return { chains, chainRules, chainsByName };
}

/**
 * Discovers all reachable chains from a set of starting hook chains using BFS/DFS.
 */
function findReachableChains(
  startEntryKeys: string[],
  chains: Map<string, ChainDef>,
  chainRules: Map<string, RuleDef[]>,
  chainsByName: Map<string, string[]>
) {
  const reachable = new Map<string, { chain: ChainDef; rules: RuleDef[] }>();
  const worklist = [...startEntryKeys];
  const visited = new Set<string>();

  while (worklist.length > 0) {
    const key = worklist.pop()!;
    if (visited.has(key)) continue;
    visited.add(key);

    const chain = chains.get(key);
    if (!chain) continue;

    const rules = chainRules.get(key) || [];
    reachable.set(chain.name, { chain, rules });

    // Add jump targets to worklist
    for (const rule of rules) {
      if (rule.jumpsTo) {
        const targetKeys = chainsByName.get(rule.jumpsTo) || [];
        for (const targetKey of targetKeys) {
          worklist.push(targetKey);
        }
      }
    }
  }

  return reachable;
}
