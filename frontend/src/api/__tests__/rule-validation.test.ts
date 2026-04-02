import { describe, it, expect } from 'vitest';
import { RuleResponseSchema } from '@/types/ip';
import ruleData from './fixtures/rule/rule4.json';

describe('RuleResponseSchema Validation', () => {
  it('should successfully parse rule4.json', () => {
    const result = RuleResponseSchema.safeParse(ruleData);

    expect(result.success, `Schema validation failed, error: ${result.error}`).toBe(true);

    if (result.success) {
      const data = result.data;

      // Basic checks based on the content of rule4.json
      expect(data).toBeDefined();
      expect(data.length).toBe(5);

      // Check for first rule (local table)
      const localRule = data.find(item => item.priority === 0);
      expect(localRule).toBeDefined();
      expect(localRule?.src).toBe('all');
      expect(localRule?.table).toBe('local');

      // Check for the rule with a specific destination
      const dstRule = data.find(item => item.dst === '1.1.1.1');
      expect(dstRule).toBeDefined();
      expect(dstRule?.priority).toBe(32764);
      expect(dstRule?.table).toBe('ipv4_demo');

      // Check for the rule with a specific source
      const srcRule = data.find(item => item.src === '172.17.0.2');
      expect(srcRule).toBeDefined();
      expect(srcRule?.priority).toBe(32765);
      expect(srcRule?.table).toBe('ipv4_demo');

      // Check for main table rule
      const mainRule = data.find(item => item.priority === 32766);
      expect(mainRule).toBeDefined();
      expect(mainRule?.src).toBe('all');
      expect(mainRule?.table).toBe('main');

      // Check for default table rule
      const defaultRule = data.find(item => item.priority === 32767);
      expect(defaultRule).toBeDefined();
      expect(defaultRule?.src).toBe('all');
      expect(defaultRule?.table).toBe('default');
    }
  });
});
