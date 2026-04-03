import { z } from 'zod';

export const LsnsItemSchema = z.object({
  ns: z.number(),
  nsfs: z.string().nullable(),
  command: z.string(),
});

export type LsnsItem = z.infer<typeof LsnsItemSchema>;

export const LsnsResponseSchema = z.object({
  namespaces: z.array(LsnsItemSchema),
});

export type LsnsResponse = z.infer<typeof LsnsResponseSchema>;
