import { ElementDefinition } from 'cytoscape';
import { ProcessedNft } from '../preprocess/nftPreprocess';
import { RuleDef, ChainDef } from '@/types/nft';
import { TraceResult } from '../trace/nftTrace';
import { Packet, Change } from '@/types/packet';

const getChainId = (chain: ChainDef) => `${chain.handle}_chain`;
const getRuleId = (rule: RuleDef) => `${rule.handle}_rule`;

/**
 * Converts restructured NFT data into Cytoscape elements.
 */
export function nftToGraph(restructured: ProcessedNft, hook: string): ElementDefinition[] {
  const elements: ElementDefinition[] = [];
  const chainsMap = restructured.get(hook);

  if (!chainsMap) {
    return elements;
  }

  // Generate graph elements for all reachable chains and their rules
  for (const [chainName, data] of chainsMap) {
    const chainId = getChainId(data.chain);

    // Add Chain Node
    elements.push({
      data: {
        id: chainId,
        name: chainName,
        noninteractive: true,
      },
    });

    // Add Rule Nodes and edges
    for (const rule of data.rules) {
      const ruleId = getRuleId(rule);
      const { matcher, action } = formatRuleExpressions(rule.expr);

      elements.push({
        data: {
          id: ruleId,
          name: `${matcher} -> ${action}`,
          parent: chainId,
          matcher,
          action,
          noninteractive: true,
        },
      });

      if (rule.jumpsTo) {
        const targetData = chainsMap.get(rule.jumpsTo);
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
): { matcher: string; action: string } {
  const matchers: string[] = [];
  let action = 'Unknown';

  for (const expr of expressions) {
    if (expr.match) {
      const m = expr.match;
      const protocol = m.left?.payload?.protocol;
      const meta = m.left?.meta?.key;
      const field = m.left?.payload?.field;
      const op = m.op;

      let leftStr = '';
      if (protocol && field) {
        leftStr = `${protocol}.${field}`;
      } else if (meta) {
        leftStr = `${meta}`;
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
      action = `Jump`;
    } else if (expr.return !== undefined) {
      action = `Return`
    }
  }

  return {
    matcher: matchers.length > 0 ? matchers.join(' && ') : 'always',
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
