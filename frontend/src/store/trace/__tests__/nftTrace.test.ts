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
    hook: string;
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
        hook: "arp_input",
        expected: [
            { isChain: false, name: 'input-rule-2', decision: 'drop' },
        ],
    },
    {
        inputFilePath: 'filter_drop.json',
        packet: {
            ...defaultPacket,
            internet: {
                ...defaultPacket.internet,
                srcIp: new Address4('1.1.1.1'),
            } as any,
        },
        hook: "ip_input",
        expected: [
            { isChain: false, name: 'input-rule-2', decision: 'drop' },
        ],
    },
];

describe('nftTrace testing setup', () => {
    testData.forEach(({ inputFilePath, packet, hook, expected, expectedPacket }) => {
        it(`should trace packet correctly for ${inputFilePath}`, () => {
            const fullPath = path.resolve(__dirname, '../../../testdata/nft', inputFilePath);
            const fileContent = fs.readFileSync(fullPath, 'utf-8');
            const nftData: NftResponse = NftResponseSchema.parse(JSON.parse(fileContent));

            const processedNft = restructureNft(nftData);
            const hookData = processedNft.get(hook);
            if (!hookData) {
                const keys = Array.from(processedNft.keys()).join(', ');
                throw new Error(`Test data ${inputFilePath} missing ${hook} hook. Available hooks: ${keys}`);
            }

            const result = traceNftPacket(packet, hookData);

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
