import { ElementDefinition } from 'cytoscape';
import { ProcessedIp } from '../preprocess/ipPreprocess';

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
    const ruleId = `rule-${rule.priority}-${index}`;
    const src = rule.src;
    const dst = rule.dst ? ` to ${rule.dst}` : '';
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
        target: `table-${rule.table}`
      }
    });
  });

  // 2. Process Routes and create Table nodes
  Object.entries(data.routes).forEach(([tableName, routes]) => {
    const tableId = `table-${tableName}`;

    elements.push({
      data: {
        id: tableId,
        name: `${tableName}`,
        type: 'table'
      }
    });

    routes.forEach((route, index) => {
      const routeId = `route-${tableName}-${index}`;
      const name = `${route.dst} via ${route.dev}`;

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
