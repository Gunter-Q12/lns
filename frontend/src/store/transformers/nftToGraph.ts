import { ElementDefinition } from 'cytoscape';
import { RestructuredNft } from './nftTransformer';

/**
 * Converts restructured NFT data into Cytoscape elements.
 */
export function nftToGraph(restructured: RestructuredNft): ElementDefinition[] {
  const elements: ElementDefinition[] = [];

  for (const [_hook, chains] of restructured) {
    for (const [chainName, [chainDef, rules]] of chains) {
      const chainId = `${chainDef.handle}_chain`;

      // 1. Add Chain Node
      elements.push({
        data: {
          id: chainId,
          name: chainName,
        },
      });

      // 2. Add Rule Nodes (as children of the chain)
      for (const rule of rules) {
        const ruleId = `${rule.handle}_rule`;
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
