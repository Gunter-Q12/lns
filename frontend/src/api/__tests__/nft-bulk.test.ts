import { describe, it, expect } from 'vitest';
import { NftResponseSchema } from '../nftTypes';
import * as fs from 'fs';
import * as path from 'path';

describe('NftResponseSchema Bulk Validation', () => {
  const fixturesDir = path.resolve(__dirname, 'fixtures');
  const files = fs.readdirSync(fixturesDir);

  files.forEach((file) => {
    it(`should successfully parse ${file}`, () => {
      const filePath = path.join(fixturesDir, file);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(fileContent);

      const result = NftResponseSchema.safeParse(data);
      expect(result.success, `Schema validation failed for ${file}, error: ${result.error}`).toBe(true);
    });
  });
});
