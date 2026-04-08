export type Packet = {
    transport?: Tcp | Udp;
    internet?: Ipv4 | Ipv6 | Arp | Icmp;
    network: Ethernet;

    isBridge?: boolean;
    srcNamespace: string;
    srcInterface: string;
    dstNamespace: string;
    dstInterface: string;
}

export type Tcp = {
    srcPort: number;
    dstPort: number;
};

export type Udp = {
    srcPort: number;
    dstPort: number;
};

export type Arp = {
    operation: string;
    senderHaradwareAddr: string
    senderProtocolAddr: string
    targetHaradwareAddr: string
    targetProtocolAddr: string
};

export type Icmp = {
    type: string;
};

export type Ipv4 = {
    typeOfService?: number;
    timeToLive?: number;

    srcIp: string;
    dstIp: string;
}

export type Ipv6 = {
    trafficClass?: number;
    hopLimit?: number;

    srcIp: string;
    dstIp: string;
}

export type Ethernet = {
    srcMac: string;
    dstMac: string;
}

export type Change = {
    namespace: string;
    hook: string;
    id: string;
    decision: string;  // TODO: probably convert to enum
    description?: string;
}
