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
    exclude: ['**/node_modules/**', '**/tests/e2e/**'],
    // Integration tests share a real DB — run one worker at a time
    // to avoid TRUNCATE lock contention (Vitest 4 top-level API)
    maxWorkers: 1,
    minWorkers: 1,
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
