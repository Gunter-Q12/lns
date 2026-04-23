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

class ValueMatcher implements Matcher {
  private rightAddr: Address4 | Address6 | null;
  constructor(private right: any) {
    this.rightAddr = toAddress(right);
  }

  equal(left: any): boolean {
    const leftAddr = toAddress(left);
    if (leftAddr && this.rightAddr) {
      if (leftAddr.v4 === this.rightAddr.v4) {
        return leftAddr.bigInt() === this.rightAddr.bigInt();
      }
      return false;
    }
    return false;
  }

  less(left: any): boolean {
    const leftAddr = toAddress(left);
    if (leftAddr && this.rightAddr) {
      if (leftAddr.v4 === this.rightAddr.v4) {
        return leftAddr.bigInt() < this.rightAddr.bigInt();
      }
      return false;
    }
    return false;
  }
}

class RangeMatcher implements Matcher {
  private startAddr: Address4 | Address6 | null;
  private endAddr: Address4 | Address6 | null;

  constructor(private range: [any, any]) {
    this.startAddr = toAddress(range[0]);
    this.endAddr = toAddress(range[1]);
  }

  equal(left: any): boolean {
    const leftAddr = toAddress(left);
    if (
      leftAddr && this.startAddr && this.endAddr &&
      leftAddr.v4 === this.startAddr.v4 &&
      leftAddr.v4 === this.endAddr.v4
    ) {
      const leftInt = leftAddr.bigInt();
      return leftInt >= this.startAddr.bigInt() && leftInt <= this.endAddr.bigInt();
    }
    return false;
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

function getRight(right: any): Matcher {
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

function matchPacket(packet: Packet, expr: Expr): boolean {
    if (!('match' in expr)) return true;
    const { match } = expr;

    if (!('right' in match)) return true;
    const { right } = match;

    return false;
}
