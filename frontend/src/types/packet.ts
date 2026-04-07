export type Packet = {
    senderMac?: string;
    targetMac?: string;
    srcPort?: string;
    dstPort?: string;
    srcIp?: string;
    dstIp?: string;
    srcNamespace?: string;
    srcInterface?: string;
    dstNamespace?: string;
    dstInterface?: string;
}

export type Change = {
    namespace: string;
    hook: string;
    id: string;
    decision: string;  // TODO: probably convert to enum
    description?: string;
}
