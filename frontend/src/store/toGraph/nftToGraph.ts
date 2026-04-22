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

  for (const [_hookName, chains] of restructured) {
    for (const [chainName, { chain: chainDef, rules }] of chains) {
      // Only include chains where hook and family fields match the requested hook metadata
      const familyMatch = metadata.families.includes(chainDef.family);
      const hookMatch = metadata.hook === chainDef.hook;

      if (!familyMatch || !hookMatch) {
        continue;
      }

      const chainId = getChainId(chainDef);

      // 1. Add Chain Node
      elements.push({
        data: {
          id: chainId,
          name: chainName,
        },
      });

      // 2. Add Rule Nodes (as children of the chain)
      for (const rule of rules) {
        const ruleId = getRuleId(rule);
        const { matcher, action } = formatRuleExpressions(rule.expr);

        elements.push({
          data: {
            id: ruleId,
            name: `${matcher} -> ${action}`,
            parent: chainId,
            matcher,
            action,
          },
        });
      }
    }
  }

  return elements;
}

/**
 * Helper to process expressions into human-readable strings
 */
function formatRuleExpressions(expressions: any[]): { matcher: string; action: string } {
  const matchers: string[] = [];
  let action = 'Unknown';

  for (const expr of expressions) {
    if (expr.match) {
      const m = expr.match;
      const protocol = m.left?.payload?.protocol || 'unknown';
      const field = m.left?.payload?.field || 'unknown';
      const op = m.op || 'unknown';

      let rightVal = '';
      if (typeof m.right === 'object' && m.right !== null) {
        rightVal = JSON.stringify(m.right);
      } else {
        rightVal = String(m.right);
      }

      matchers.push(`${protocol}.${field} ${op} ${rightVal}`);
    } else if (expr.drop !== undefined) {
      action = 'Drop';
    } else if (expr.accept !== undefined) {
      action = 'Accept';
    }
  }

  return {
    matcher: matchers.join(' && '),
    action,
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
      // It's a RuleDef
      changes.push({
        namespace,
        hook,
        id: getRuleId(item as RuleDef),
        decision: appliedItem.decision,
      });
    } else if ('handle' in item && 'name' in item) {
      // It's a ChainDef
      changes.push({
        namespace,
        hook,
        id: getChainId(item as ChainDef),
        decision: appliedItem.decision,
      });
    }
  });

  return [result.packet, changes];
}
