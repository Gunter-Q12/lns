import { ElementDefinition } from 'cytoscape';
import { ProcessedIp, ProcessedRouteItem } from '../preprocess/ipPreprocess';
import { Packet, Change } from '../../types/packet';
import { TraceResult } from '../trace/ipTrace';

const getRuleId = (priority: number, index: number) => `rule-${priority}-${index}`;
const getTableId = (tableName: string) => `table-${tableName}`;
const getRouteId = (tableName: string, index: number) => `route-${tableName}-${index}`;

/**
 * Converts ProcessedIp (rules and routes) into Cytoscape ElementDefinitions.
 *
 * Rules: Each rule is a node. Name includes src and dst (if present).
 * Tables: Each referenced table is a node.
 * Routes: Each route is a node with the corresponding table as its parent.
 *         Name includes dst and dev.
 * Edges: From rules to the tables they point to.
 */
export const ipToGraph = (data: ProcessedIp): ElementDefinition[] => {
  const elements: ElementDefinition[] = [];
  const tables = new Set<string>();

  // 1. Process Rules (already sorted in data.rules)
  data.rules.forEach((rule, index) => {
    const ruleId = getRuleId(rule.priority, index);
    const src = rule.src ? `${rule.src.label}` : ''
    const dst = rule.dst ? ` to ${rule.dst.label}` : '';
    const name = `${src}${dst}`;

    elements.push({
      data: {
        id: ruleId,
        name: name,
        type: 'rule',
        priority: rule.priority
      }
    });

    // Track table for node creation
    tables.add(rule.table);

    // Edge from Rule to Table (create table node later)
    elements.push({
      data: {
        id: `edge-${ruleId}-to-${rule.table}`,
        source: ruleId,
        target: getTableId(rule.table)
      }
    });
  });

  // 2. Process Routes and create Table nodes
  Object.entries(data.routes).forEach(([tableName, routes]) => {
    const tableId = getTableId(tableName);

    elements.push({
      data: {
        id: tableId,
        name: `${tableName}`,
        type: 'table'
      }
    });

    routes.forEach((route, index) => {
      const routeId = getRouteId(tableName, index);
      const name = `${route.dst.label} via ${route.dev}`;

      elements.push({
        data: {
          id: routeId,
          name: name,
          parent: tableId,
          type: 'route'
        }
      });
    });
  });

  return elements;
};

/**
 * Translates TraceResult into a final Packet and a list of path changes.
 */
export const translateTraceResult = (
  result: TraceResult,
  data: ProcessedIp
): [Packet, Change[]] => {
  const changes: Change[] = [];

  // Map applied rules to change records
  result.appliedRules.forEach((rule) => {
    // Find the original index of the rule in data.rules to reconstruct the ID
    const index = data.rules.indexOf(rule);
    if (index !== -1) {
      changes.push({
        namespace: result.packet.srcNamespace, // Best guess for namespace
        hook: 'ip-rule',
        id: getRuleId(rule.priority, index),
        decision: 'MATCH'
      });
    }
  });

  // Map applied route to change record
  if (result.appliedRoute) {
    const route = result.appliedRoute;
    const tableName = route.table || 'main';
    const tableRoutes = data.routes[tableName] || [];
    const index = tableRoutes.indexOf(route);

    if (index !== -1) {
      changes.push({
        namespace: result.packet.srcNamespace,
        hook: 'ip-route',
        id: getRouteId(tableName, index),
        decision: 'MATCH',
        description: `Routed via ${route.dev}`
      });
    }
  }

  return [result.packet, changes];
};
