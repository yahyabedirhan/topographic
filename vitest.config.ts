import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    include: ['packages/*/src/**/*.test.{ts,tsx}', 'apps/playground/src/region/**/*.test.ts'],
    environment: 'node',
  },
});
