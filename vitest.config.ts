import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'
import dotenv from 'dotenv'

// Load test env at config-parse time so DATABASE_URL is set
// before any worker thread initialises Prisma
dotenv.config({ path: '.env.test', override: true })

export default defineConfig({
  plugins: [react()],
  test: {
    // Unit + component tests run in jsdom
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    // Integration tests override to node environment per-file via
    // @vitest-environment node at the top of the file
    environmentMatchGlobs: [
      ['tests/integration/**', 'node'],
    ],
    // Playwright E2E specs live in tests/e2e — exclude them from Vitest
    exclude: ['**/node_modules/**', '**/tests/e2e/**', '**/.claude/**'],
    globalSetup: ['./tests/global-setup.ts'],
    // All test files run sequentially — integration tests share a real DB
    // and concurrent TRUNCATE calls cause lock contention across env pools
    fileParallelism: false,
    maxWorkers: 1,
    minWorkers: 1,
    hookTimeout: 60000,
    testTimeout: 30000,
    coverage: {
      reporter: ['text', 'html'],
      exclude: ['node_modules/', '.next/', 'lib/generated/', 'tests/'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
