import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'

// Load test env so DATABASE_URL is set for getDb() calls inside spec files
dotenv.config({ path: '.env.test', override: true })

export default defineConfig({
  testDir: './tests/e2e',
  // Order enforced by numeric filename prefixes (01-..05-).
  // role-isolation runs 3rd so the server is still fresh;
  // full-pipeline runs last because it stresses the dev server most.
  testMatch: [
    '**/01-acknowledge-flow.spec.ts',
    '**/02-applicant-applies.spec.ts',
    '**/03-role-isolation.spec.ts',
    '**/04-token-single-use.spec.ts',
    '**/05-full-pipeline.spec.ts',
  ],
  fullyParallel: false, // sequential — tests share a DB
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: 1,
  timeout: 60000, // cold dev-server + NextAuth session fetch can be slow
  reporter: 'html',

  use: {
    // Port 3002 keeps E2E isolated from the dev server on 3001
    baseURL: 'http://localhost:3002',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Start a dedicated E2E server on port 3002 with the test database.
  // Using a separate port means the regular dev server (3001) is unaffected.
  webServer: {
    command: 'npx next dev --webpack --port 3002',
    url: 'http://localhost:3002',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      DATABASE_URL: 'postgresql://ef_user:ef_secure_2026@localhost:5433/exchange_four_test',
      SKIP_STORAGE_UPLOAD: 'true',
      NEXTAUTH_URL: 'http://localhost:3002',
    },
  },
})
