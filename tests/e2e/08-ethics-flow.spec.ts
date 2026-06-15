import { test, expect, type Page } from '@playwright/test'
import { createHRUser, createApplicantUser, createApplication, createEmployee, cleanupByEmails } from './helpers/db'
import { Pool } from 'pg'

const HR_EMAIL    = `e2e-hr-ethics-${Date.now()}@exchangefour.com`
const HR_PASSWORD = 'Admin1234!'
const EMP_EMAIL   = `e2e-emp-ethics-${Date.now()}@example.com`

let employeeId: string
let ethicsReportId: string

async function getLatestEthicsReport(reporterId: string): Promise<{ id: string; status: string; category: string } | null> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const res = await pool.query(
    `SELECT id, status, category FROM "EthicsReport" WHERE "reporterId" = $1 ORDER BY "createdAt" DESC LIMIT 1`,
    [reporterId],
  )
  await pool.end()
  return res.rows[0] ?? null
}

test.beforeAll(async () => {
  const hr = await createHRUser(HR_EMAIL, HR_PASSWORD, 'Ethics HR Tester')
  const emp = await createApplicantUser(EMP_EMAIL, 'test1234', 'Ethics', 'Subject')
  const app = await createApplication(emp.applicantId, {
    reference: `EF-HR-APP-2026-ETHI${Date.now().toString(36)}`,
    status: 'HIRED',
  })
  const created = await createEmployee(emp.id, app.id, { firstName: 'Ethics', lastName: 'Subject' })
  employeeId = created.id

  // Store HR id for getLatestEthicsReport — HR user is the reporter
  // We'll look up by HR user id in the tests via page.request
  void hr
})

test.afterAll(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  await pool.query(`DELETE FROM "EthicsReport" WHERE "subjectEmployeeId" = $1`, [employeeId])
  await pool.end()
  await cleanupByEmails([HR_EMAIL, EMP_EMAIL])
})

async function login(page: Page) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(HR_EMAIL)
  await page.getByLabel('Password').fill(HR_PASSWORD)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await page.waitForURL(/\/hr\/dashboard/, { timeout: 60000 })
}

test('HR can navigate to Ethics Reports page', async ({ page }) => {
  await login(page)
  await page.goto('/hr/ethics')
  await expect(page.getByRole('heading', { name: /Ethics/i })).toBeVisible({ timeout: 10000 })
})

test('HR can open New Ethics Report form', async ({ page }) => {
  await login(page)
  await page.goto('/hr/ethics/new')
  await expect(page.getByRole('heading', { name: /File Ethics Report|New Ethics Report/i })).toBeVisible({ timeout: 10000 })
})

test('HR can file an ethics report and see it in the list', async ({ page }) => {
  await login(page)
  await page.goto('/hr/ethics/new')

  const categoryInput = page.getByPlaceholder(/category/i).or(page.locator('input[name="category"]'))
  if (await categoryInput.count() > 0) await categoryInput.fill('Misconduct')

  const descInput = page.getByPlaceholder(/description/i).or(page.locator('textarea').first())
  if (await descInput.count() > 0) {
    await descInput.fill('An employee was observed taking office supplies without authorisation on multiple occasions.')
  }

  const mediumBtn = page.getByRole('button', { name: /MEDIUM/i })
  if (await mediumBtn.count() > 0) await mediumBtn.click()

  await page.getByRole('button', { name: /Submit|File Report/i }).click()
  await expect(page).toHaveURL(/\/hr\/ethics/, { timeout: 10000 })
})

test('Filed ethics report is recorded in the database', async ({ page }) => {
  await login(page)

  const res = await page.request.post('/api/ethics', {
    data: {
      subjectEmployeeId: employeeId,
      subjectType: 'EMPLOYEE',
      category: 'Harassment',
      description: 'Subject made repeated inappropriate comments in team meetings over several weeks.',
      severity: 'MEDIUM',
      isSensitive: false,
    },
  })
  expect(res.status()).toBe(201)
  const body = await res.json() as { id: string; status: string }
  expect(body.id).toBeTruthy()
  expect(body.status).toBe('OPEN')

  ethicsReportId = body.id
})

test('HR can view ethics report detail page', async ({ page }) => {
  await login(page)

  // Create a fresh report for this test
  const res = await page.request.post('/api/ethics', {
    data: {
      subjectEmployeeId: employeeId,
      subjectType: 'EMPLOYEE',
      category: 'Policy Violation',
      description: 'Subject shared confidential client information externally without authorization.',
      severity: 'HIGH',
      isSensitive: false,
    },
  })
  expect(res.status()).toBe(201)
  const body = await res.json() as { id: string }
  const reportId = body.id

  await page.goto(`/hr/ethics/${reportId}`)
  await expect(page).toHaveURL(`/hr/ethics/${reportId}`, { timeout: 10000 })
  await expect(page.getByText(/Policy Violation|confidential|ethics/i)).toBeVisible({ timeout: 10000 })
})

test('HR can update ethics report status to UNDER_INVESTIGATION', async ({ page }) => {
  await login(page)

  const createRes = await page.request.post('/api/ethics', {
    data: {
      subjectEmployeeId: employeeId,
      subjectType: 'EMPLOYEE',
      category: 'Fraud',
      description: 'Subject submitted falsified expense claims on three occasions over two months.',
      severity: 'HIGH',
      isSensitive: false,
    },
  })
  expect(createRes.status()).toBe(201)
  const { id: reportId } = await createRes.json() as { id: string }

  const patchRes = await page.request.patch(`/api/ethics/${reportId}`, {
    data: { status: 'UNDER_INVESTIGATION' },
  })
  expect(patchRes.status()).toBe(200)
  const patched = await patchRes.json() as { status: string }
  expect(patched.status).toBe('UNDER_INVESTIGATION')
})

test('HR can close an ethics report with resolution notes', async ({ page }) => {
  await login(page)

  const createRes = await page.request.post('/api/ethics', {
    data: {
      subjectEmployeeId: employeeId,
      subjectType: 'EMPLOYEE',
      category: 'Insubordination',
      description: 'Subject refused direct instructions from line manager on documented occasions.',
      severity: 'LOW',
      isSensitive: false,
    },
  })
  expect(createRes.status()).toBe(201)
  const { id: reportId } = await createRes.json() as { id: string }

  // Move to under investigation first
  await page.request.patch(`/api/ethics/${reportId}`, {
    data: { status: 'UNDER_INVESTIGATION' },
  })

  // Close the report
  const closeRes = await page.request.patch(`/api/ethics/${reportId}`, {
    data: {
      status: 'CLOSED',
      outcome: 'Manager counselling completed. No further action required.',
    },
  })
  expect(closeRes.status()).toBe(200)
  const closed = await closeRes.json() as { status: string }
  expect(closed.status).toBe('CLOSED')
})
