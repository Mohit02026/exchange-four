import { test, expect, type Page } from '@playwright/test'
import { createHRUser, createApplicantUser, createApplication, createEmployee, cleanupByEmails } from './helpers/db'
import { Pool } from 'pg'

const HR_EMAIL    = `e2e-hr-stats-${Date.now()}@exchangefour.com`
const HR_PASSWORD = 'Admin1234!'
const EMP_EMAIL   = `e2e-emp-stats-${Date.now()}@example.com`

let employeeId: string

test.beforeAll(async () => {
  await createHRUser(HR_EMAIL, HR_PASSWORD, 'Stats HR Tester')
  const emp = await createApplicantUser(EMP_EMAIL, 'test1234', 'Stats', 'Employee')
  const app = await createApplication(emp.applicantId, {
    reference: `EF-HR-APP-2026-STATS${Date.now().toString(36)}`,
    status: 'HIRED',
  })
  const created = await createEmployee(emp.id, app.id, { firstName: 'Stats', lastName: 'Employee' })
  employeeId = created.id
})

test.afterAll(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  await pool.query(
    `DELETE FROM "StatisticEntry" WHERE "statisticId" IN (SELECT id FROM "Statistic" WHERE "employeeId" = $1)`,
    [employeeId],
  )
  await pool.query(`DELETE FROM "Statistic" WHERE "employeeId" = $1`, [employeeId])
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

test('HR can navigate to Statistics dashboard', async ({ page }) => {
  await login(page)
  await page.goto('/hr/statistics')
  await expect(page.getByRole('heading', { name: /Statistics/i })).toBeVisible({ timeout: 10000 })
})

test('HR can navigate to employee statistics page', async ({ page }) => {
  await login(page)
  await page.goto(`/hr/employees/${employeeId}/statistics`)
  await expect(page.getByText(/Statistics Overview/i)).toBeVisible({ timeout: 10000 })
})

test('HR can create a statistic for an employee', async ({ page }) => {
  await login(page)

  const res = await page.request.post(`/api/statistics/${employeeId}`, {
    data: {
      postTitle: 'Sales Associate',
      name: 'Calls Made Per Day',
      definition: 'Number of outbound sales calls completed each working day',
      unit: 'calls',
      frequency: 'DAILY',
      target: 20,
    },
  })
  expect(res.status()).toBe(201)
  const body = await res.json() as { id: string; name: string; unit: string }
  expect(body.name).toBe('Calls Made Per Day')
  expect(body.unit).toBe('calls')
})

test('Created statistic is stored in the database', async ({ page }) => {
  await login(page)

  const res = await page.request.post(`/api/statistics/${employeeId}`, {
    data: {
      postTitle: 'Sales Associate',
      name: 'Proposals Sent Per Week',
      definition: 'Count of formal proposals submitted to prospective clients each week',
      unit: 'proposals',
      frequency: 'WEEKLY',
      target: 5,
    },
  })
  expect(res.status()).toBe(201)
  const body = await res.json() as { id: string }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const row = await pool.query(`SELECT id, name FROM "Statistic" WHERE id = $1`, [body.id])
  await pool.end()
  expect(row.rows).toHaveLength(1)
  expect(row.rows[0].name).toBe('Proposals Sent Per Week')
})

test('HR can record a statistic entry', async ({ page }) => {
  await login(page)

  // Create stat
  const statRes = await page.request.post(`/api/statistics/${employeeId}`, {
    data: {
      postTitle: 'Sales Associate',
      name: 'Revenue Closed This Month',
      definition: 'Total deal value closed in the current calendar month',
      unit: 'USD',
      frequency: 'MONTHLY',
      target: 50000,
    },
  })
  expect(statRes.status()).toBe(201)
  const stat = await statRes.json() as { id: string }

  // Record an entry
  const entryRes = await page.request.post(`/api/statistics/${employeeId}/entry`, {
    data: {
      statisticId: stat.id,
      value: 32500,
      period: '2026-06',
    },
  })
  expect(entryRes.status()).toBe(201)
  const entry = await entryRes.json() as { id: string; value: number; period: string }
  expect(entry.value).toBe(32500)
  expect(entry.period).toBe('2026-06')
})

test('Recorded statistic entry appears in DB', async ({ page }) => {
  await login(page)

  const statRes = await page.request.post(`/api/statistics/${employeeId}`, {
    data: {
      postTitle: 'Sales Associate',
      name: 'Client Meetings Per Week',
      definition: 'Number of face-to-face or virtual client meetings held each week',
      unit: 'meetings',
      frequency: 'WEEKLY',
    },
  })
  expect(statRes.status()).toBe(201)
  const stat = await statRes.json() as { id: string }

  await page.request.post(`/api/statistics/${employeeId}/entry`, {
    data: { statisticId: stat.id, value: 7, period: '2026-W24' },
  })

  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const rows = await pool.query(
    `SELECT value, period FROM "StatisticEntry" WHERE "statisticId" = $1`,
    [stat.id],
  )
  await pool.end()
  expect(rows.rows).toHaveLength(1)
  expect(Number(rows.rows[0].value)).toBe(7)
  expect(rows.rows[0].period).toBe('2026-W24')
})

test('Employee statistics page shows created statistics', async ({ page }) => {
  await login(page)

  await page.request.post(`/api/statistics/${employeeId}`, {
    data: {
      postTitle: 'Sales Associate',
      name: 'Support Tickets Resolved',
      definition: 'Number of customer support tickets resolved each day',
      unit: 'tickets',
      frequency: 'DAILY',
    },
  })

  await page.goto(`/hr/employees/${employeeId}/statistics`)
  await expect(page.getByText(/Support Tickets Resolved/i)).toBeVisible({ timeout: 10000 })
})
