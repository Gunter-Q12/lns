import { describe, it, expect } from 'vitest';
import { AddrResponseSchema } from '@/types/addr';
import addrData from '../../../testdata/addr/addr.json';

describe('AddrResponseSchema Validation', () => {
  it('should successfully parse addr.json and validate ifname and local addresses', () => {
    const result = AddrResponseSchema.safeParse(addrData);

    expect(result.success).toBe(true);

    if (result.success) {
      const data = result.data;

      // Basic checks based on the content of addr.json
      expect(data).toBeDefined();
      expect(data.length).toBeGreaterThan(0);

      // Validate eth0
      const eth0 = data.find(item => item.ifname === 'eth0');
      expect(eth0).toBeDefined();
      expect(eth0?.ifname).toBe('eth0');

      const eth0Local = eth0?.addr_info.find(info => info.family === 'inet');
      expect(eth0Local?.local).toBe('172.17.0.2');

      // Validate lo
      const lo = data.find(item => item.ifname === 'lo');
      expect(lo).toBeDefined();
      expect(lo?.ifname).toBe('lo');

      const loLocal = lo?.addr_info.find(info => info.family === 'inet');
      expect(loLocal?.local).toBe('127.0.0.1');

      const loLocalV6 = lo?.addr_info.find(info => info.family === 'inet6');
      expect(loLocalV6?.local).toBe('::1');
    }
  });
});
