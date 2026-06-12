import { test, expect } from '@playwright/test'
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
  await pool.query(`DELETE FROM "StatisticEntry" WHERE "statisticId" IN (SELECT id FROM "Statistic" WHERE "employeeId" = $1)`, [employeeId])
  await pool.query(`DELETE FROM "Statistic" WHERE "employeeId" = $1`, [employeeId])
  await pool.end()
  await cleanupByEmails([HR_EMAIL, EMP_EMAIL])
})

test('HR can navigate to Statistics dashboard', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill(HR_EMAIL)
  await page.getByLabel('Password').fill(HR_PASSWORD)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await page.waitForURL(/\/hr\/dashboard/, { timeout: 60000 })

  await page.goto('/hr/statistics')
  await expect(page.getByRole('heading', { name: /Statistics/i })).toBeVisible({ timeout: 10000 })
})

test('HR can navigate to employee statistics page', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill(HR_EMAIL)
  await page.getByLabel('Password').fill(HR_PASSWORD)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await page.waitForURL(/\/hr\/dashboard/, { timeout: 60000 })

  await page.goto(`/hr/employees/${employeeId}/statistics`)
  // Page h1 shows employee name; check the back-link text instead
  await expect(page.getByText(/Statistics Overview/i)).toBeVisible({ timeout: 10000 })
})
