import { test, expect } from '@playwright/test'
import { createApplicantUser, cleanupByEmails } from './helpers/db'

// These tests verify that route protection (proxy.ts) blocks APPLICANT users
// from reaching HR-only routes, and that unauthenticated users are redirected.
// They do not require any specific DB state — just a logged-in APPLICANT session.
//
// Tests use the `request` fixture (Node.js HTTP) instead of page.goto for
// proxy-matched routes (/hr/*, /status, /apply) to avoid Chromium's Edge
// Runtime connection issue that surfaces after heavy tests in 02-applicant-applies.

const APPLICANT_EMAIL = `e2e-isolation-${Date.now()}@example.com`
const APPLICANT_PASSWORD = 'password123'

test.beforeAll(async () => {
  await createApplicantUser(APPLICANT_EMAIL, APPLICANT_PASSWORD, 'Isolation', 'Tester')
  // Wait for the server to be ready (non-proxy route — always reachable)
  for (let i = 0; i < 15; i++) {
    try {
      const res = await fetch('http://localhost:3002/api/auth/session')
      if (res.status < 500) break
    } catch {
      await new Promise((r) => setTimeout(r, 2000))
    }
  }
})

test.afterAll(async () => {
  await cleanupByEmails([APPLICANT_EMAIL])
})

async function loginAsApplicant(page: import('@playwright/test').Page) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(APPLICANT_EMAIL)
  await page.getByLabel('Password').fill(APPLICANT_PASSWORD)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await page.waitForURL(/\/status/, { timeout: 20000 })
}

// Unauthenticated redirect tests — use request fixture with maxRedirects: 0 to inspect the
// 307 redirect directly. Without this, Playwright follows the redirect to localhost:3001
// (NextAuth's default NEXTAUTH_URL) which isn't running during E2E tests.
test('unauthenticated user is redirected from /hr/dashboard to /login', async ({ request }) => {
  const res = await request.get('/hr/dashboard', { maxRedirects: 0 })
  expect(res.status()).toBe(307)
  expect(res.headers()['location']).toContain('/login')
})

test('unauthenticated user is redirected from /hr/applications to /login', async ({ request }) => {
  const res = await request.get('/hr/applications', { maxRedirects: 0 })
  expect(res.status()).toBe(307)
  expect(res.headers()['location']).toContain('/login')
})

test('unauthenticated user is redirected from /status to /login', async ({ request }) => {
  const res = await request.get('/status', { maxRedirects: 0 })
  expect(res.status()).toBe(307)
  expect(res.headers()['location']).toContain('/login')
})

test('unauthenticated user is redirected from /apply to /login', async ({ request }) => {
  const res = await request.get('/apply', { maxRedirects: 0 })
  expect(res.status()).toBe(307)
  expect(res.headers()['location']).toContain('/login')
})

// APPLICANT redirect tests — login via browser, then use request fixture with session cookies.
// maxRedirects: 0 prevents following the redirect to the wrong port.
test('APPLICANT user is redirected away from /hr/dashboard', async ({ page, request }) => {
  await loginAsApplicant(page)
  const cookies = await page.context().cookies()
  const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ')
  const res = await request.get('/hr/dashboard', {
    headers: { Cookie: cookieHeader },
    maxRedirects: 0,
  })
  expect(res.status()).toBe(307)
  expect(res.headers()['location']).not.toContain('/hr/dashboard')
})

test('APPLICANT user cannot access /hr/applications', async ({ page, request }) => {
  await loginAsApplicant(page)
  const cookies = await page.context().cookies()
  const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ')
  const res = await request.get('/hr/applications', {
    headers: { Cookie: cookieHeader },
    maxRedirects: 0,
  })
  expect(res.status()).toBe(307)
  expect(res.headers()['location']).not.toContain('/hr/applications')
})

// /api/reviews only has a POST handler — test auth protection via POST
test('POST /api/reviews returns 401 without auth', async ({ request }) => {
  const res = await request.post('/api/reviews', {
    data: { applicationId: 'test', sections: [], notesForAvi: null, privateNotes: null },
  })
  expect(res.status()).toBe(401)
})

test('POST /api/reviews returns 403 for APPLICANT session', async ({ page, request }) => {
  await loginAsApplicant(page)
  // Extract session cookie and use it in the API request
  const cookies = await page.context().cookies()
  const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ')
  const res = await request.post('/api/reviews', {
    headers: { Cookie: cookieHeader, 'Content-Type': 'application/json' },
    data: { applicationId: 'test', sections: [], notesForAvi: null, privateNotes: null },
  })
  expect(res.status()).toBe(403)
})

test('POST /api/approvals/final returns 403 for APPLICANT session', async ({ page, request }) => {
  await loginAsApplicant(page)
  const cookies = await page.context().cookies()
  const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ')
  const res = await request.post('/api/approvals/final', {
    headers: { Cookie: cookieHeader, 'Content-Type': 'application/json' },
    data: { applicationId: 'test', decision: 'approved' },
  })
  expect(res.status()).toBe(403)
})
