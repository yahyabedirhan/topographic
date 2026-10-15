import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    include: ['packages/*/src/**/*.test.{ts,tsx}', 'apps/playground/src/prototype/region/**/*.test.ts'],
    environment: 'node',
  },
});
