import { ElementDefinition } from 'cytoscape';
import { ProcessedNft } from '../preprocess/nftPreprocess';
import { HOOK_METADATA, RuleDef, ChainDef } from '@/types/nft';
import { TraceResult } from '../trace/nftTrace';
import { Packet, Change } from '@/types/packet';

const getChainId = (chain: ChainDef) => `${chain.handle}_chain`;
const getRuleId = (rule: RuleDef) => `${rule.handle}_rule`;

/**
 * Converts restructured NFT data into Cytoscape elements.
 */
export function nftToGraph(restructured: ProcessedNft, hook: string): ElementDefinition[] {
  const elements: ElementDefinition[] = [];
  const metadata = HOOK_METADATA[hook];

  if (!metadata) {
    return elements;
  }

  // 1. Get a flat map of ALL chains for lookup
  const allChains = new Map<string, { chain: ChainDef; rules: RuleDef[] }>();
  for (const [_hookName, chains] of restructured) {
    for (const [chainName, data] of chains) {
      allChains.set(chainName, data);
    }
  }

  // 2. Discover all reachable chains starting from the hook's base chains
  const reachableChainNames = new Set<string>();
  const worklist: string[] = [];

  // Initialize worklist with base chains for this hook using the decoupled 'restructured' map
  const hookChainsMap = restructured.get(hook) || new Map();
  for (const [chainName, _data] of hookChainsMap) {
    reachableChainNames.add(chainName);
    worklist.push(chainName);
  }

  // Breadth-first traversal to find all jumped-to chains
  let head = 0;
  while (head < worklist.length) {
    const currentName = worklist[head++];
    const data = allChains.get(currentName);
    if (!data) continue;

    for (const rule of data.rules) {
      const { jumpTarget } = formatRuleExpressions(rule.expr);
      if (jumpTarget && allChains.has(jumpTarget) && !reachableChainNames.has(jumpTarget)) {
        reachableChainNames.add(jumpTarget);
        worklist.push(jumpTarget);
      }
    }
  }

  // 3. Generate graph elements for all reachable chains and their rules
  for (const chainName of reachableChainNames) {
    const data = allChains.get(chainName);
    if (!data) continue;

    const chainId = getChainId(data.chain);

    // Add Chain Node
    elements.push({
      data: {
        id: chainId,
        name: chainName,
      },
    });

    // Add Rule Nodes and edges
    for (const rule of data.rules) {
      const ruleId = getRuleId(rule);
      const { matcher, action, jumpTarget } = formatRuleExpressions(rule.expr);

      elements.push({
        data: {
          id: ruleId,
          name: `${matcher} -> ${action}`,
          parent: chainId,
          matcher,
          action,
        },
      });

      if (jumpTarget) {
        const targetData = allChains.get(jumpTarget);
        if (targetData) {
          elements.push({
            data: {
              id: `${ruleId}_to_${getChainId(targetData.chain)}`,
              source: ruleId,
              target: getChainId(targetData.chain),
            },
          });
        }
      }
    }
  }

  return elements;
}

/**
 * Helper to process expressions into human-readable strings
 */
function formatRuleExpressions(
  expressions: any[]
): { matcher: string; action: string; jumpTarget?: string } {
  const matchers: string[] = [];
  let action = 'Unknown';
  let jumpTarget: string | undefined;

  for (const expr of expressions) {
    if (expr.match) {
      const m = expr.match;
      const protocol = m.left?.payload?.protocol;
      const field = m.left?.payload?.field;
      const op = m.op;

      let leftStr = '';
      if (protocol && field) {
        leftStr = `${protocol}.${field}`;
      } else {
        leftStr = JSON.stringify(m.left);
      }

      let rightVal = '';
      if (typeof m.right === 'object' && m.right !== null) {
        rightVal = JSON.stringify(m.right);
      } else {
        rightVal = String(m.right);
      }

      if (op) {
        matchers.push(`${leftStr} ${op} ${rightVal}`);
      } else {
        matchers.push(`${leftStr} == ${rightVal}`);
      }
    } else if (expr.drop !== undefined) {
      action = 'Drop';
    } else if (expr.accept !== undefined) {
      action = 'Accept';
    } else if (expr.jump !== undefined) {
      jumpTarget = expr.jump.target;
      action = `Jump: ${jumpTarget}`;
    }
  }

  return {
    matcher: matchers.length > 0 ? matchers.join(' && ') : 'always',
    action,
    jumpTarget,
  };
}

/**
 * Translates TraceResult into a final Packet and a list of path changes for Cytoscape.
 */
export function translateNftTraceResult(
  result: TraceResult,
  namespace: string,
  hook: string
): [Packet, Change[]] {
  const changes: Change[] = [];

  result.applied.forEach((appliedItem) => {
    const item = appliedItem.item;
    if ('handle' in item && 'expr' in item) {
      const { matcher } = formatRuleExpressions(item.expr);
      // It's a RuleDef
      changes.push({
        namespace,
        hook,
        id: getRuleId(item as RuleDef),
        name: matcher,
        description: `${JSON.stringify(item.expr, null, 2)}`,
        decision: appliedItem.decision,
      });
    } else if ('handle' in item && 'name' in item) {
      // It's a ChainDef
      changes.push({
        namespace,
        hook,
        id: getChainId(item as ChainDef),
        name: `Chain: ${item.name}`,
        decision: appliedItem.decision,
      });
    }
  });

  return [result.packet, changes];
}
