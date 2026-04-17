import { Packet } from '../../types/packet';
import { ChainDef, RuleDef, Expr } from '../../types/nft';

export interface TraceResult {
  packet: Packet;
  applied: (RuleDef | ChainDef)[];
}


// type Matcher = (
//   packet: Packet,
//   rule: RuleDef,
//   chainsMap: Map<string, { chain: ChainDef; rules: RuleDef[] }>
// ) => { terminate: boolean; result: TraceResult };

function matchPacket(packet: Packet, expr: Expr): boolean {
  return true;  // TODO: implement
}

function combineTraceResults(left: TraceResult, right: TraceResult): TraceResult {
  return {
    packet: { ...right.packet },
    applied: [...left.applied, ...right.applied],
  };
}

/**
 * Applies all rules within a single chain to a packet.
 *
 * @returns An object indicating if execution should terminate or skip to the next chain.
 */
function applyChain(
  packet: Packet,
  chain: ChainDef,
  rules: RuleDef[],
  chainsMap: Map<string, { chain: ChainDef; rules: RuleDef[] }>,
): { terminate: boolean; result: TraceResult } {
  let result: TraceResult = {
    packet: { ...packet },
    applied: [],
  };

  for (const rule of rules) {
    result.applied.push(rule);

    // Check for terminal actions in expressions
    for (const expr of rule.expr) {
      if ('match' in expr && !matchPacket(packet, expr)) {
        break;
      }
      if ('jump' in expr) {
        const { chain: targetChain, rules: targetRules } = chainsMap.get(expr.jump.target) ?? {
          chain,
          rules: [],
        };
        const jumpResult = applyChain(packet, targetChain, targetRules, chainsMap);
        result = combineTraceResults(result, jumpResult.result);

        if (jumpResult.terminate) {
          return { terminate: true, result };
        }
      }
      if ('goto' in expr) {
        const { chain: targetChain, rules: targetRules } = chainsMap.get(expr.jump.target) ?? {
          chain,
          rules: [],
        };
        return applyChain(packet, targetChain, targetRules, chainsMap);
      }
      if ('drop' in expr) {
        return { terminate: true, result };
      }
      if ('accept' in expr) {
        // Skip all other rules in this chain and go to next chain.
        return { terminate: false, result };
      }
    }
  }

  result.applied.push(chain);
  if (chain.policy === "drop") {
    return { terminate: true, result };
  }
  return { terminate: false, result };
}

/**
 * Basic packet tracer for nftables.
 *
 * @param packet The initial packet to trace.
 * @param chainsMap Map of chain names to their definitions and associated rules.
 * @returns The trace result containing the final packet and history of applied chains/rules.
 */
export function traceNftPacket(
  packet: Packet,
  chainsMap: Map<string, { chain: ChainDef; rules: RuleDef[] }>
): TraceResult {
  let fullTrace: TraceResult = {
    packet: { ...packet },
    applied: [],
  };

  // 1. Get all base chains (those with a 'prio' field) and sort them by priority.
  const baseChains = Array.from(chainsMap.values())
    .filter((entry) => entry.chain.prio !== undefined)
    .sort((a, b) => (a.chain.prio ?? 0) - (b.chain.prio ?? 0));

  // 2. Iterate over chains in order of "prio"
  for (const { chain, rules } of baseChains) {
    const { terminate, result } = applyChain(fullTrace.packet, chain, rules, chainsMap);

    fullTrace = combineTraceResults(fullTrace, result);

    if (terminate) {
      break;
    }
  }

  return fullTrace;
}
