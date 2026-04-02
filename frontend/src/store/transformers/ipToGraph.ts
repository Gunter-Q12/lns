import { ElementDefinition } from 'cytoscape';
import { IpResponse } from '@/types/ip';

/**
 * Converts IpResponse (rules and routes) into Cytoscape ElementDefinitions.
 *
 * Rules: Each rule is a node. Name includes src and dst (if present).
 * Tables: Each referenced table is a node.
 * Routes: Each route is a node with the corresponding table as its parent.
 *         Name includes dst and dev.
 * Edges: From rules to the tables they point to.
 */
export const ipToGraph = (data: IpResponse): ElementDefinition[] => {
  const elements: ElementDefinition[] = [];
  const tables = new Set<string>();

  // 1. Process Rules
  data.rules.forEach((rule, index) => {
    const ruleId = `rule-${rule.priority}-${index}`;
    const src = rule.src;
    const dst = rule.dst ? ` to ${rule.dst}` : '';
    const name = `Rule: ${src}${dst} (prio: ${rule.priority})`;

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

    // Edge from Rule to Table
    elements.push({
      data: {
        id: `edge-${ruleId}-to-${rule.table}`,
        source: ruleId,
        target: `table-${rule.table}`
      }
    });
  });

  // 2. Process Tables (as parent nodes for routes)
  tables.forEach(tableName => {
    elements.push({
      data: {
        id: `table-${tableName}`,
        name: `Table: ${tableName}`,
        type: 'table'
      }
    });
  });

  // 3. Process Routes
  data.routes.forEach((route, index) => {
    const tableId = `table-${route.table || 'main'}`; // Default to main if not specified
    const routeId = `route-${index}`;
    const name = `${route.dst} via ${route.dev}`;

    // Ensure the table node exists if a route references it but no rule did
    if (!tables.has(route.table || 'main')) {
        tables.add(route.table || 'main');
        elements.push({
            data: {
                id: tableId,
                name: `Table: ${route.table || 'main'}`,
                type: 'table'
            }
        });
    }

    elements.push({
      data: {
        id: routeId,
        name: name,
        parent: tableId,
        type: 'route'
      }
    });
  });

  return elements;
};
