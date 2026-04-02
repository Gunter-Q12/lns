import { describe, it, expect } from 'vitest';
import { RouteResponseSchema } from '@/types/ip';
import routeData from './fixtures/route/route.json';

describe('RouteResponseSchema Validation', () => {
  it('should successfully parse route.json', () => {
    const result = RouteResponseSchema.safeParse(routeData);

    expect(result.success).toBe(true);

    if (result.success) {
      const data = result.data;

      // Basic checks based on the content of route.json
      expect(data).toBeDefined();
      expect(data.length).toBeGreaterThan(0);

      // Check for default gateway
      const defaultRoute = data.find(item => item.dst === 'default');
      expect(defaultRoute).toBeDefined();
      expect(defaultRoute?.gateway).toBeDefined();
      expect(defaultRoute?.dev).toBe('eth0');

      // Check for a local route
      const localRoute = data.find(item => item.type === 'local' && item.dst === '127.0.0.1');
      expect(localRoute).toBeDefined();
      expect(localRoute?.dev).toBe('lo');
      expect(localRoute?.table).toBe('local');

      // Check for broadcast route
      const broadcastRoute = data.find(item => item.type === 'broadcast');
      expect(broadcastRoute).toBeDefined();
      expect(broadcastRoute?.scope).toBe('link');
    }
  });
});
