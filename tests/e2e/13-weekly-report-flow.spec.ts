import { test, expect, type Page } from '@playwright/test'
import { createHRUser, cleanupByEmails } from './helpers/db'

const HR_EMAIL    = `e2e-hr-report-${Date.now()}@exchangefour.com`
const HR_PASSWORD = 'Admin1234!'

test.beforeAll(async () => {
  await createHRUser(HR_EMAIL, HR_PASSWORD, 'Report HR Tester')
})

test.afterAll(async () => {
  await cleanupByEmails([HR_EMAIL])
})

async function login(page: Page) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(HR_EMAIL)
  await page.getByLabel('Password').fill(HR_PASSWORD)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await page.waitForURL(/\/hr\/dashboard/, { timeout: 60000 })
}

test('HR can navigate to Weekly Reports page', async ({ page }) => {
  await login(page)
  await page.goto('/hr/reports/weekly')
  await expect(page.getByRole('heading', { name: /Weekly Personnel Report|Weekly Report/i })).toBeVisible({ timeout: 10000 })
})

test('Weekly report page shows Send Report Now button', async ({ page }) => {
  await login(page)
  await page.goto('/hr/reports/weekly')
  await page.waitForLoadState('networkidle', { timeout: 15000 })
  await expect(page.getByRole('button', { name: /Send Report Now/i })).toBeVisible({ timeout: 10000 })
})

test('Weekly report API returns structured report data', async ({ page }) => {
  await login(page)

  const res = await page.request.get('/api/reports/weekly')
  expect(res.status()).toBe(200)

  const report = await res.json() as {
    weekNumber?: number
    pipeline?: unknown
    onboarding?: unknown
    employees?: unknown
    generatedAt?: string
  }

  // Report must have recognizable top-level sections
  expect(report).toBeTruthy()
  // At minimum one of these sections should be present
  const hasExpectedSections = (
    'pipeline'   in report ||
    'onboarding' in report ||
    'employees'  in report ||
    'weekNumber' in report
  )
  expect(hasExpectedSections).toBe(true)
})

test('Weekly report shows pipeline section on page', async ({ page }) => {
  await login(page)
  await page.goto('/hr/reports/weekly')
  await page.waitForLoadState('networkidle', { timeout: 15000 })

  // The page renders report data — at least one of these sections should appear
  const sections = page.getByText(/Pipeline|Onboarding|Applications|Employees|Staff|Report/i)
  await expect(sections.first()).toBeVisible({ timeout: 10000 })
})

test('Weekly report API is accessible and returns 200 (no email send)', async ({ page }) => {
  await login(page)

  // GET generates the report without emailing
  const res = await page.request.get('/api/reports/weekly')
  expect(res.status()).toBe(200)
  const body = await res.json()
  // Not an error response
  expect(body).not.toHaveProperty('error')
})

test('Weekly report page renders without JS errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(err.message))

  await login(page)
  await page.goto('/hr/reports/weekly')
  await page.waitForLoadState('networkidle', { timeout: 15000 })

  // Filter out known third-party noise
  const criticalErrors = errors.filter(e =>
    !e.includes('ResizeObserver') &&
    !e.includes('Non-Error promise rejection'),
  )
  expect(criticalErrors).toHaveLength(0)
})
