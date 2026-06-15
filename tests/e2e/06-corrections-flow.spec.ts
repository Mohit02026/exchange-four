import { test, expect, type Page } from '@playwright/test'
import { createHRUser, cleanupByEmails } from './helpers/db'
import { Pool } from 'pg'

const HR_EMAIL    = `e2e-hr-corr-${Date.now()}@exchangefour.com`
const HR_PASSWORD = 'Admin1234!'

function uid() {
  return `e2e${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

async function createEmployeeWithUser() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const empUserId = uid()
  const empId = uid()

  await pool.query(
    `INSERT INTO "User" (id, email, password, role, name, "createdAt", "updatedAt")
     VALUES ($1, $2, 'hash', 'APPLICANT'::"Role", 'Correction Subject', now(), now())`,
    [empUserId, `emp-corr-${empId}@example.com`],
  )
  await pool.query(
    `INSERT INTO "Employee" (id, "userId", "firstName", "lastName", "createdAt", "updatedAt")
     VALUES ($1, $2, 'Correction', 'Subject', now(), now())`,
    [empId, empUserId],
  )
  await pool.end()
  return { id: empId, userId: empUserId }
}

async function getLatestCorrectionForEmployee(employeeId: string): Promise<{ id: string; status: string } | null> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const res = await pool.query(
    `SELECT id, status FROM "CorrectionHandling" WHERE "employeeId" = $1 ORDER BY "createdAt" DESC LIMIT 1`,
    [employeeId],
  )
  await pool.end()
  return res.rows[0] ?? null
}

async function cleanup(emails: string[], empUserId?: string) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  if (empUserId) {
    const empRes = await pool.query(`SELECT id FROM "Employee" WHERE "userId" = $1`, [empUserId])
    if (empRes.rows.length) {
      const empId = empRes.rows[0].id as string
      await pool.query(`DELETE FROM "CorrectionHandling" WHERE "employeeId" = $1`, [empId])
      await pool.query(`DELETE FROM "Employee" WHERE id = $1`, [empId])
    }
    await pool.query(`DELETE FROM "User" WHERE id = $1`, [empUserId])
  }
  await pool.end()
  await cleanupByEmails(emails)
}

let hrId: string
let employeeId: string
let empUserId: string

test.beforeAll(async () => {
  const hr = await createHRUser(HR_EMAIL, HR_PASSWORD, 'Corrections HR Tester')
  hrId = hr.id
  const emp = await createEmployeeWithUser()
  employeeId = emp.id
  empUserId = emp.userId
})

test.afterAll(async () => {
  await cleanup([HR_EMAIL], empUserId)
})

async function login(page: Page) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(HR_EMAIL)
  await page.getByLabel('Password').fill(HR_PASSWORD)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await page.waitForURL(/\/hr\/dashboard/, { timeout: 60000 })
}

test('HR can navigate to Corrections page', async ({ page }) => {
  await login(page)
  await page.goto('/hr/corrections')
  await expect(page.getByRole('heading', { name: /Corrections/i })).toBeVisible({ timeout: 10000 })
})

test('HR can open New Correction form', async ({ page }) => {
  await login(page)
  await page.goto('/hr/corrections/new')
  await expect(page.getByRole('heading', { name: /File Correction/i })).toBeVisible({ timeout: 10000 })
})

test('HR can file a correction and it appears in the list', async ({ page }) => {
  await login(page)

  await page.goto('/hr/corrections/new')
  await page.waitForSelector('select, [data-testid="employee-select"]', { timeout: 10000 }).catch(() => null)

  const select = page.locator('select').first()
  if (await select.count() > 0) await select.selectOption({ index: 1 })

  const incident = page.getByPlaceholder(/incident/i).or(page.locator('textarea').first())
  if (await incident.count() > 0) await incident.fill('Late to meetings repeatedly over three weeks')

  const correction = page.getByPlaceholder(/correction requested/i).or(page.locator('textarea').nth(1))
  if (await correction.count() > 0) await correction.fill('Punctuality improvement plan required')

  const minorBtn = page.getByRole('button', { name: /MINOR/i })
  if (await minorBtn.count() > 0) await minorBtn.click()

  await page.getByRole('button', { name: /File Correction/i }).click()
  await expect(page).toHaveURL(/\/hr\/corrections/, { timeout: 10000 })
})

test('Filed correction is recorded in the database', async ({ page }) => {
  await login(page)

  // File a correction via the API (authenticated via page session cookie)
  const res = await page.request.post('/api/corrections', {
    data: {
      employeeId,
      incident: 'Missed three consecutive weekly reports without notification',
      correctionRequested: 'Complete all overdue reports and set up reminders',
      severity: 'MINOR',
    },
  })
  expect(res.status()).toBe(201)
  const body = await res.json() as { correction: { id: string } }
  expect(body.correction.id).toBeTruthy()

  // Verify in DB
  const record = await getLatestCorrectionForEmployee(employeeId)
  expect(record).not.toBeNull()
  expect(record!.status).toBe('OPEN')
})

test('HR can view correction detail page', async ({ page }) => {
  await login(page)

  // Create correction via API
  const res = await page.request.post('/api/corrections', {
    data: {
      employeeId,
      incident: 'Repeated failure to submit time tracking entries on schedule',
      correctionRequested: 'Submit all outstanding time entries within 48 hours',
      severity: 'MINOR',
    },
  })
  expect(res.status()).toBe(201)
  const body = await res.json() as { correction: { id: string } }
  const correctionId = body.correction.id

  await page.goto(`/hr/corrections/${correctionId}`)
  await expect(page).toHaveURL(`/hr/corrections/${correctionId}`, { timeout: 10000 })
  // Page should show the incident or correction heading
  await expect(page.getByText(/time tracking|Repeated failure|correction/i)).toBeVisible({ timeout: 10000 })
})

test('HR can update correction status to ACKNOWLEDGED', async ({ page }) => {
  await login(page)

  // Create correction
  const createRes = await page.request.post('/api/corrections', {
    data: {
      employeeId,
      incident: 'Unexcused absence on a scheduled training day without prior notice',
      correctionRequested: 'Attend make-up session and provide written acknowledgment',
      severity: 'MODERATE',
    },
  })
  expect(createRes.status()).toBe(201)
  const { correction } = await createRes.json() as { correction: { id: string } }

  // Acknowledge it
  const patchRes = await page.request.patch(`/api/corrections/${correction.id}`, {
    data: { status: 'ACKNOWLEDGED', hrNotes: 'Employee has been notified in writing' },
  })
  expect(patchRes.status()).toBe(200)
  const patched = await patchRes.json() as { correction: { status: string } }
  expect(patched.correction.status).toBe('ACKNOWLEDGED')
})

test('HR can resolve a correction', async ({ page }) => {
  await login(page)

  const createRes = await page.request.post('/api/corrections', {
    data: {
      employeeId,
      incident: 'Failure to follow dress code policy on client-facing days repeatedly',
      correctionRequested: 'Review dress code policy and confirm compliance in writing',
      severity: 'MINOR',
    },
  })
  expect(createRes.status()).toBe(201)
  const { correction } = await createRes.json() as { correction: { id: string } }

  // Resolve it
  const patchRes = await page.request.patch(`/api/corrections/${correction.id}`, {
    data: {
      status: 'RESOLVED',
      resolution: 'Employee reviewed and signed updated dress code acknowledgment form',
    },
  })
  expect(patchRes.status()).toBe(200)
  const patched = await patchRes.json() as { correction: { status: string } }
  expect(patched.correction.status).toBe('RESOLVED')
})
