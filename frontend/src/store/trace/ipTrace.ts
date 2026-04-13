import { Packet } from '../../types/packet';
import { ProcessedIp, ProcessedRuleItem, ProcessedRouteItem, Address } from '../preprocess/ipPreprocess';
import { Address4, Address6 } from 'ip-address';

export interface TraceResult {
    packet: Packet;
    appliedRules: ProcessedRuleItem[];
    appliedRoute?: ProcessedRouteItem;
    error?: string;
}

/**
 * Checks if an IP address belongs to a pre-parsed Address object.
 */
const ipInParsedAddress = (ip: Address4 | Address6, range: Address | undefined): boolean => {
    if (range === undefined) return true;
    return ip.isInSubnet(range.parsed);
};

// TODO: this kind of works but we need to create matchers to make it extensible
const lookupRoute = (
    dstIp: Address4 | Address6,
    isV6: boolean,
    routes: ProcessedRouteItem[]
): ProcessedRouteItem | undefined => {
    // Find matching routes
    const matchingRoutes = routes.filter(route =>
        route.isV6 === isV6 && ipInParsedAddress(dstIp, route.dst)
    );

    if (matchingRoutes.length === 0) return undefined;

    // Best route: Longest prefix match -> Lowest metric -> First in list
    matchingRoutes.sort((a, b) => {
        const diffMask = b.dst.parsed.subnetMask - a.dst.parsed.subnetMask;
        if (diffMask !== 0) return diffMask;

        const metricA = a.metric ?? 1024;
        const metricB = b.metric ?? 1024;
        return metricA - metricB;
    });

    return matchingRoutes[0];
};

export const traceIp = (packet: Packet, data: ProcessedIp): TraceResult => {
    const appliedRules: ProcessedRuleItem[] = [];

    // Extract IP objects from the packet
    const internet = packet.internet;
    if (!internet || !('srcIp' in internet) || !('dstIp' in internet)) {
        return { packet, appliedRules, error: "Packet has no IP addresses" };
    }

    const srcIp = internet.srcIp;
    const dstIp = internet.dstIp;
    const isV6 = packet.isV6;

    // 1. Evaluate rules in order of priority (already sorted)
    for (const rule of data.rules) {
        // Only consider rules for the correct IP version
        if (rule.isV6 !== isV6) continue;

        const srcMatch = ipInParsedAddress(srcIp, rule.src);
        const dstMatch = ipInParsedAddress(dstIp, rule.dst);

        if (srcMatch && dstMatch) {
            appliedRules.push(rule);

            // 2. Perform table lookup
            const tableRoutes = data.routes[rule.table] || [];
            const bestRoute = lookupRoute(dstIp, isV6, tableRoutes);

            if (bestRoute) {
                const updatedPacket = { ...packet };
                if (bestRoute.dev) {
                    updatedPacket.srcInterface = bestRoute.dev;
                }

                return {
                    packet: updatedPacket,
                    appliedRules,
                    appliedRoute: bestRoute
                };
            }

            // If lookup fails in this table, the kernel continues to the next rule
        }
    }

    return {
        packet,
        appliedRules,
        error: "No matching route found in any rule table"
    };
};
