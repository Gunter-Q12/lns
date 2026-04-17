import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { traceNftPacket } from '../nftTrace';
import { restructureNft } from '../../preprocess/nftPreprocess';
import { Packet } from '../../../types/packet';
import { ChainDef, RuleDef, NftResponse, NftResponseSchema } from '../../../types/nft';
import { Address4 } from 'ip-address';
import { AddressMac } from '../../../types/mac';

interface ExpectedResult {
    isChain: boolean;
    name: string;
    decision: string;
}

interface TestEntry {
    inputFilePath: string;
    packet: Packet;
    expected: ExpectedResult[];
    expectedPacket?: Partial<Packet>;
}

const defaultPacket: Packet = {
    internet: {
        srcIp: new Address4('10.0.0.1'),
        dstIp: new Address4('10.0.0.2'),
    },
    network: {
        srcMac: new AddressMac('00:00:00:00:00:01'),
        dstMac: new AddressMac('00:00:00:00:00:02'),
    },
    isArp: true,
    isV6: false,
    srcNamespace: 'host',
    srcInterface: 'eth0',
    dstNamespace: '',
    dstInterface: '',
}

const testData: TestEntry[] = [
    {
        inputFilePath: 'arp_drop.json',
        packet: defaultPacket,
        expected: [
            { isChain: false, name: 'input-rule-2', decision: 'drop' },
        ],
    },
];

describe('nftTrace testing setup', () => {
    testData.forEach(({ inputFilePath, packet, expected, expectedPacket }) => {
        it(`should trace packet correctly for ${inputFilePath}`, () => {
            const fullPath = path.resolve(__dirname, '../../../testdata/nft', inputFilePath);
            const fileContent = fs.readFileSync(fullPath, 'utf-8');
            const nftData: NftResponse = NftResponseSchema.parse(JSON.parse(fileContent));

            const processedNft = restructureNft(nftData);

            // traceNftPacket expects a Map<string, { chain: ChainDef; rules: RuleDef[] }>
            // restructureNft returns: Map<hookName, Map<chainName, [ChainDef, RuleDef[]]>>
            // For testing, we might need to decide which hook to trace or flatten them.
            // Based on traceNftPacket implementation, it iterates over all base chains in the map.

            const flatChainsMap = new Map<string, { chain: ChainDef; rules: RuleDef[] }>();
            for (const hookMap of processedNft.values()) {
                for (const [chainName, [chain, rules]] of hookMap.entries()) {
                    flatChainsMap.set(chainName, { chain, rules });
                }
            }

            const result = traceNftPacket(packet, flatChainsMap);

            const actualProcessed = result.applied.map((applied) => {
                const item = applied.item;
                let name = '';
                let isChain = false;

                if ('expr' in item) {
                    // It's a RuleDef
                    isChain = false;
                    name = `${item.chain}-rule-${item.handle}`;
                } else {
                    // It's a ChainDef
                    isChain = true;
                    name = item.name;
                }

                return {
                    isChain,
                    name,
                    decision: applied.decision,
                };
            });

            expect(actualProcessed).toEqual(expected);

            if (expectedPacket) {
                expect(result.packet).toMatchObject(expectedPacket);
            }
        });
    });
});
