import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/tests/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    setupFiles: ['src/tests/setup.ts'],
    // El test de integración levanta una base MongoDB; la primera vez puede tardar en descargarla
    hookTimeout: 120_000,
    testTimeout: 30_000,
  },
});
