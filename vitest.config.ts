import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    include: ['packages/*/src/**/*.test.{ts,tsx}', 'apps/playground/src/**/*.test.ts'],
    environment: 'node',
  },
});
