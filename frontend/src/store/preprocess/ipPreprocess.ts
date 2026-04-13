import { z } from 'zod';
import { IpResponse, RouteResponseSchema, RuleResponseSchema, RouteResponse } from '../../types/ip';

export const ProcessedIpSchema = z.object({
  rules: RuleResponseSchema,
  routes: z.record(z.string(), RouteResponseSchema),
});

export type ProcessedIp = z.infer<typeof ProcessedIpSchema>;

export const preprocessIp = (data: IpResponse): ProcessedIp => {
  // Sort rules by priority
  const rules = [...data.rules].sort((a, b) => a.priority - b.priority);

  // Group routes by table
  const routes: Record<string, RouteResponse> = {};

  data.routes.forEach((route) => {
    const table = route.table || 'main';
    if (!routes[table]) {
      routes[table] = [];
    }
    routes[table].push(route);
  });

  return {
    rules,
    routes,
  };
};
