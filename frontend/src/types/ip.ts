import { z } from 'zod';

export const RouteItemSchema = z.object({
  dst: z.string(),
  gateway: z.string().optional(),
  dev: z.string(),
  flags: z.array(z.string()),
  protocol: z.string().optional(),
  scope: z.string().optional(),
  prefsrc: z.string().optional(),
  type: z.string().optional(),
  table: z.string().optional(),
  metric: z.number().optional(),
  pref: z.string().optional(),

  isV6: z.boolean().optional()
});
export type RouteItem = z.infer<typeof RouteItemSchema>;

export const RuleItemSchema = z.object({
  priority: z.number(),
  src: z.string(),
  dst: z.string().optional(),
  table: z.string(),

  isV6: z.boolean().optional()
});
export type RuleItem = z.infer<typeof RuleItemSchema>;


export const RouteResponseSchema = z.array(RouteItemSchema);
export type RouteResponse = z.infer<typeof RouteResponseSchema>;

export const RuleResponseSchema = z.array(RuleItemSchema);
export type RuleResponse = z.infer<typeof RuleResponseSchema>;

export const RouteAndRuleResponseSchema = z.object({
  routes: RouteResponseSchema,
  rules: RuleResponseSchema,
});

export type IpResponse = z.infer<typeof RouteAndRuleResponseSchema>;
