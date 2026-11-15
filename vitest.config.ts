import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    testTimeout: 120_000,
    hookTimeout: 120_000,
    // Las pruebas de extremo a extremo comparten un navegador y un servidor local.
    fileParallelism: false,
  },
});
