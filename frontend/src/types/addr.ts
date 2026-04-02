import { z } from 'zod';

export const AddrInfoSchema = z.object({
  family: z.string(),
  local: z.string(),
  prefixlen: z.number(),
  scope: z.string(),
  label: z.string().optional(),
  broadcast: z.string().optional(),
  valid_life_time: z.number(),
  preferred_life_time: z.number(),
});
export type AddrInfo = z.infer<typeof AddrInfoSchema>;

export const AddrItemSchema = z.object({
  ifindex: z.number(),
  ifname: z.string(),
  flags: z.array(z.string()),
  mtu: z.number(),
  qdisc: z.string(),
  master: z.string(),
  operstate: z.string(),
  group: z.string(),
  txqlen: z.number().optional(),
  link_type: z.string(),
  address: z.string().optional(),
  broadcast: z.string().optional(),
  link_index: z.number().optional(),
  link_netnsid: z.number().optional(),
  master: z.string().optional(),
  addr_info: z.array(AddrInfoSchema),
});
export type AddrItem = z.infer<typeof AddrItemSchema>;

export const AddrResponseSchema = z.array(AddrItemSchema);
export type AddrResponse = z.infer<typeof AddrResponseSchema>;
