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
});
export type RouteItem = z.infer<typeof RouteItemSchema>;

export const RouteResponseSchema = z.array(RouteItemSchema);
export type RouteResponse = z.infer<typeof RouteResponseSchema>;
