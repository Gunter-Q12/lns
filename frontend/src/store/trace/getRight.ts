import { Expr } from "@/types/nft";
import { Packet } from "@/types/packet";
import { Address4, Address6 } from "ip-address";

interface Matcher {
  equal(left: any): boolean;
  less(left: any): boolean;
}

function toAddress(value: any): Address4 | Address6 | null {
  if (typeof value !== "string") return null;
  try {
    if (value.includes(":")) {
      return new Address6(value);
    }
    return new Address4(value);
  } catch {
    return null;
  }
}

function toNumber(value: any): bigint | null {
  if (typeof value === "number") return BigInt(value);
  if (typeof value === "string") {
    try {
      if (value.startsWith("0x")) {
        return BigInt(value);
      }
      const n = Number(value);
      if (!isNaN(n)) return BigInt(n);
    } catch {
      return null;
    }
  }
  return null;
}

function compare(left: any, right: any): number | null {
  const leftAddr = toAddress(left);
  const rightAddr = toAddress(right);
  if (leftAddr && rightAddr && leftAddr.v4 === rightAddr.v4) {
    const l = leftAddr.bigInt();
    const r = rightAddr.bigInt();
    return l === r ? 0 : l < r ? -1 : 1;
  }

  const leftNum = toNumber(left);
  const rightNum = toNumber(right);
  if (leftNum !== null && rightNum !== null) {
    return leftNum === rightNum ? 0 : leftNum < rightNum ? -1 : 1;
  }

  if (typeof left === "string" && typeof right === "string") {
    return left === right ? 0 : left < right ? -1 : 1;
  }

  return null;
}

class ValueMatcher implements Matcher {
  constructor(private right: any) {}

  equal(left: any): boolean {
    return compare(left, this.right) === 0;
  }

  less(left: any): boolean {
    const res = compare(left, this.right);
    return res !== null && res < 0;
  }
}

class RangeMatcher implements Matcher {
  constructor(private range: [any, any]) {}

  equal(left: any): boolean {
    const startRes = compare(left, this.range[0]);
    const endRes = compare(left, this.range[1]);
    return startRes !== null && endRes !== null && startRes >= 0 && endRes <= 0;
  }

  less(_left: any): boolean {
    return false;
  }
}


class SetMatcher implements Matcher {
  private matchers: Matcher[] = [];

  constructor(set: any[]) {
    for (const val of set) {
      if (typeof val === "object" && val !== null && "range" in val) {
        this.matchers.push(new RangeMatcher(val.range));
      } else {
        this.matchers.push(new ValueMatcher(val));
      }
    }
  }

  equal(left: any): boolean {
    return this.matchers.some((m) => m.equal(left));
  }

  less(_left: any): boolean {
    return false;
  }
}

export function getRight(right: any): Matcher {
  if (typeof right === "object" && right !== null) {
    if ("set" in right && Array.isArray(right.set)) {
      return new SetMatcher(right.set);
    }
    if ("range" in right && Array.isArray(right.range) && right.range.length === 2) {
      return new RangeMatcher(right.range);
    }
  }
  return new ValueMatcher(right);
}
