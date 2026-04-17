import { describe, it, expect } from 'vitest';
import { NftResponseSchema } from '@/types/nft';
import longChainData from '../../../testdata/nft/long_chain.json';

describe('NftResponseSchema Validation', () => {
  it('should successfully parse long_chain.json', () => {
    const result = NftResponseSchema.safeParse(longChainData);

    expect(result.success).toBe(true);

    if (result.success) {

      const data = result.data;
      const dataJson = JSON.stringify(result.data.nftables, null, 2);
      // Basic checks based on the content of long_chain.json
      expect(data.nftables).toBeDefined();
      expect(data.nftables, dataJson).toHaveLength(6);

      // Check if a chain exists
      const chainItem = data.nftables.find(item => item.chain !== undefined);
      expect(chainItem).toBeDefined();
      expect(chainItem?.chain?.name).toBe('arp_rules');

      // Check if rules exist
      const ruleItems = data.nftables.filter(item => item.rule !== undefined);
      expect(ruleItems.length).toBe(3);
    }
  });
});
