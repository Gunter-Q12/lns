import { Packet } from "@/types/packet";
import { toAddress, toNumber } from "./packetMatch";
import { Address4, Address6 } from "ip-address";

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
  arp: {
    saddr: (p) => p.internet.srcIp?.address,
    daddr: (p) => p.internet.dstIp?.address,
    operation: (p) => 'operation' in p.internet ? p.internet.operation : "",
  },
};

function handleAnd(leftObj: any, mask: any, packet: Packet): any {
  const val = getLeft(leftObj, packet);
  if (val === undefined) return undefined;

  // Handle bitwise AND for IP addresses
  const addr = toAddress(val);
  const maskAddr = toAddress(mask);
  if (addr && maskAddr && addr.v4 === maskAddr.v4) {
    const result = addr.bigInt() & maskAddr.bigInt();
    return addr.v4 ? Address4.fromBigInt(result).address : Address6.fromBigInt(result).address;
  }

  // Handle bitwise AND for numbers
  const num = toNumber(val);
  const maskNum = toNumber(mask);
  if (num !== null && maskNum !== null) {
    return num & maskNum;
  }

  return val;
}

export function getLeft(left: any, packet: Packet): any {
  if (typeof left !== "object" || left === null) return undefined;

  if ("payload" in left) {
    const extractor = NFT_FIELD_MAP[left.payload.protocol]?.[left.payload.field];
    if (!extractor) {
      return undefined;
    }
    return extractor(packet);
  }

  if ("&" in left && Array.isArray(left["&"]) && left["&"].length === 2) {
    return handleAnd(left["&"][0], left["&"][1], packet);
  }

  return undefined;
}
