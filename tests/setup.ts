import '@testing-library/jest-dom'
import dotenv from 'dotenv'
import { beforeAll, afterAll, afterEach } from 'vitest'
import { server } from './msw-handlers'

// Load .env.test before anything touches process.env
// override: true ensures test values win over any already-set vars
dotenv.config({ path: '.env.test', override: true })

// Start MSW intercepts before all tests, reset per-test, close at end
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
