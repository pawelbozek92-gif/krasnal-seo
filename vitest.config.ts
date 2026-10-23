import { defineConfig } from 'vitest/config';

// Unit tests cover pure TypeScript (pricing logic, formatting, data integrity).
// Browser behaviour is covered by Playwright in tests/e2e.
export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
});
