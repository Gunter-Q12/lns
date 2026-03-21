import { Hook } from "./nft"

export type Packet = {
}

export type Change = {
    hook: Hook;
    id: string;
    decision: string;
}
