import { Address4, Address6 } from 'ip-address';
import { AddressMac } from './mac';

export type Packet = {
    transport?: Tcp | Udp;
    internet?: Ipv4 | Ipv6 | Arp | Icmp;
    network: Ethernet;

    transportProtocol: string;
    internetProtocol: string;

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

    srcIp: Address4;
    dstIp: Address4;
}

export type Ipv6 = {
    trafficClass?: number;
    hopLimit?: number;

    srcIp: Address6;
    dstIp: Address6;
}

export type Ethernet = {
    srcMac: AddressMac;
    dstMac: AddressMac;
}

export type Change = {
    namespace: string;
    hook: string;
    id: string;
    decision: string;  // TODO: probably convert to enum
    description?: string;
}


export const isIpValid = (ip: string) => {
  return Address4.isValid(ip) || Address6.isValid(ip);
};
