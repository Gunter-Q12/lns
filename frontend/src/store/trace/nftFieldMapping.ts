import { Packet } from '../../types/packet';

/**
 * Type definition for a function that extracts a field value from a Packet.
 * Returns string, number, or boolean for comparison with nftables rules.
 */
export type FieldExtractor = (packet: Packet) => string | number | boolean | undefined;

/**
 * The Mapping Layer for nftables payload and meta fields.
 * Translates nftables protocol/field strings into actual Packet data accessors.
 */
export const NFT_FIELD_MAP: Record<string, Record<string, FieldExtractor>> = {
  ip: {
    saddr: (p) => p.internet.srcIp?.address,
    daddr: (p) => p.internet.dstIp?.address,
  },
};

/**
 * Resolves a value from a packet based on nftables identifiers.
 *
 * @param packet The packet to inspect
 * @param protocol The nftables protocol (e.g., 'ip', 'tcp', 'meta')
 * @param field The specific field (e.g., 'saddr', 'dport', 'iifname')
 * @returns The extracted value or undefined if not found/applicable
 */
export function getPacketFieldValue(packet: Packet, protocol: string, field: string): string | number | boolean | undefined {
  const extractor = NFT_FIELD_MAP[protocol]?.[field];
  if (!extractor) {
    return undefined;
  }
  return extractor(packet);
}
