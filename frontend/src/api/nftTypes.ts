import { z } from 'zod';

export const NftItemSchema = z.object({
  metainfo: z.object({
    version: z.string(),
    release_name: z.string(),
    json_schema_version: z.number(),
  }).optional(),
  table: z.object({
    family: z.string(),
    name: z.string(),
    handle: z.number(),
  }).optional(),
  chain: z.object({
    handle: z.number(),
    family: z.string(),
    table: z.string(),
    name: z.string(),
    type: z.string().optional(),
    hook: z.string().optional(),
    prio: z.number().optional(),
    policy: z.string().optional(),
  }).optional(),
  rule: z.object({
    handle: z.number(),
    family: z.string(),
    table: z.string(),
    chain: z.string(),
    expr: z.array(z.any()),
  }).optional(),
});
export type NftItem = z.infer<typeof NftItemSchema>;

export const NftResponseSchema = z.object({
  nftables: z.array(NftItemSchema),
});
export type NftResponse = z.infer<typeof NftResponseSchema>;
