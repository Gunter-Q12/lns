import { Packet } from '../../types/packet';
import { ProcessedIp, ProcessedRuleItem, ProcessedRouteItem, Address } from '../preprocess/ipPreprocess';
import { Address4, Address6 } from 'ip-address';

export interface TraceResult {
    packet: Packet;
    appliedRules: ProcessedRuleItem[];
    appliedRoute?: ProcessedRouteItem;
    error?: string;
}

type Matcher = (packet: Packet, rule: ProcessedRuleItem) => boolean;

/**
 * Checks if an IP address belongs to a pre-parsed Address object.
 */
const ipInParsedAddress = (ip: Address4 | Address6, range: Address | undefined): boolean => {
    if (range === undefined) return true;
    return ip.isInSubnet(range.parsed);
};

function versionMatch(packet: Packet, rule: ProcessedRuleItem): boolean {
    return packet.isV6 === rule.isV6
}

function srcMatch(packet: Packet, rule: ProcessedRuleItem): boolean {
    return ipInParsedAddress(packet.internet.srcIp, rule.src)
}

function dstMatch(packet: Packet, rule: ProcessedRuleItem): boolean {
    return ipInParsedAddress(packet.internet.dstIp, rule.dst)
}


// TODO: add ToS support
function lookupRoute (
    packet: Packet, routes: ProcessedRouteItem[]
): ProcessedRouteItem | undefined {
    // Find matching routes
    const matchingRoutes = routes.filter(route =>
        route.isV6 === packet.isV6 && ipInParsedAddress(packet.internet.dstIp, route.dst)
    );

    // Best route: Longest prefix match -> Lowest metric -> First in list
    matchingRoutes.sort((a, b) => {
        const diffMask = b.dst.parsed.subnetMask - a.dst.parsed.subnetMask;
        if (diffMask !== 0) return diffMask;

        const metricA = a.metric ?? 1024;
        const metricB = b.metric ?? 1024;
        return metricA - metricB;
    });

    return matchingRoutes.at(0);
};

function updatePacket(packet: Packet, route: ProcessedRouteItem): Packet {
    const updatedPacket = { ...packet };
    if (route.dev) {
        updatedPacket.dstInterface = route.dev;
    }
    return updatedPacket;
}

export function traceIp (packet: Packet, data: ProcessedIp): TraceResult {
    const matchers: Matcher[] = [versionMatch, srcMatch, dstMatch]

    // 1. Evaluate rules in order of priority (already sorted)
    for (const rule of data.rules) {
        if (matchers.every(m => m(packet, rule))) {
            // 2. Perform table lookup
            const tableRoutes = data.routes[rule.table] || [];
            // TODO: add drop, nat, error options. Not just lookup
            const bestRoute = lookupRoute(packet, tableRoutes);

            if (bestRoute) {
                return {
                    packet: updatePacket(packet, bestRoute),
                    appliedRules: [rule],
                    appliedRoute: bestRoute
                };
            }

            // If lookup fails in this table, the kernel continues to the next rule
        }
    }

    return {
        packet,
        appliedRules: [],
        error: "No matching route found in any rule table"
    };
};
