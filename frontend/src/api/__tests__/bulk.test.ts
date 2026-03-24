import { describe, it, expect } from 'vitest';
import { NftResponseSchema } from '@/types/nft';
import { AddrResponseSchema } from '@/types/addr';
import { RouteResponseSchema } from '@/types/route';
import * as fs from 'fs';
import * as path from 'path';

describe('Schema Bulk Validation', () => {
  const fixturesBaseDir = path.resolve(__dirname, 'fixtures');

  const testSuites = [
    { name: 'NftResponseSchema', dir: 'nft', schema: NftResponseSchema },
    { name: 'AddrResponseSchema', dir: 'addr', schema: AddrResponseSchema },
    { name: 'RouteResponseSchema', dir: 'route', schema: RouteResponseSchema },
  ];

  testSuites.forEach(({ name, dir, schema }) => {
    describe(`${name} validation`, () => {
      const fixturesDir = path.join(fixturesBaseDir, dir);
      const files = fs.readdirSync(fixturesDir);

      files.forEach((file) => {
        it(`should successfully parse ${dir}/${file}`, () => {
          const filePath = path.join(fixturesDir, file);
          const fileContent = fs.readFileSync(filePath, 'utf-8');
          const data = JSON.parse(fileContent);

          const result = schema.safeParse(data);
          expect(result.success, `Schema validation failed for ${dir}/${file}, error: ${result.error}`).toBe(true);
        });
      });
    });
  });
});
