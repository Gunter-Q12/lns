export type Packet = {
    senderMac?: string;
    targetMac?: string;
    srcPort?: string;
    dstPort?: string;
    srcIp?: string;
    dstIp?: string;
}

export type Change = {
    namespace: string;
    hook: string;
    id: string;
    decision: string;  // TODO: probably convert to enum
    description?: string;
}
