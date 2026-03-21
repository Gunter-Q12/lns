import { z } from 'zod';

export enum Hook {
  IpPrerouting = "ip_prerouting",
}

export const MetainfoSchema = z.object({
  version: z.string(),
  release_name: z.string(),
  json_schema_version: z.number(),
});
export type Metainfo = z.infer<typeof MetainfoSchema>;

export const TableSchema = z.object({
  family: z.string(),
  name: z.string(),
  handle: z.number(),
});
export type Table = z.infer<typeof TableSchema>;

export const ChainDefSchema = z.object({
  handle: z.number(),
  family: z.string(),
  table: z.string(),
  name: z.string(),
  type: z.string().optional(),
  hook: z.string().optional(),
  prio: z.number().optional(),
  policy: z.string().optional(),
});
export type ChainDef = z.infer<typeof ChainDefSchema>;

export const RuleDefSchema = z.object({
  handle: z.number(),
  family: z.string(),
  table: z.string(),
  chain: z.string(),
  expr: z.array(z.any()),
});
export type RuleDef = z.infer<typeof RuleDefSchema>;

export const NftItemSchema = z.object({
  metainfo: MetainfoSchema.optional(),
  table: TableSchema.optional(),
  chain: ChainDefSchema.optional(),
  rule: RuleDefSchema.optional(),
});
export type NftItem = z.infer<typeof NftItemSchema>;

export const NftResponseSchema = z.object({
  nftables: z.array(NftItemSchema),
});
export type NftResponse = z.infer<typeof NftResponseSchema>;
