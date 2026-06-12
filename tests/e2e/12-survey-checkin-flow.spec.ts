import { test, expect } from '@playwright/test'
import { createHRUser, createApplicantUser, createApplication, createEmployee, cleanupByEmails } from './helpers/db'
import { Pool } from 'pg'

const HR_EMAIL    = `e2e-hr-survey-${Date.now()}@exchangefour.com`
const HR_PASSWORD = 'Admin1234!'
const EMP_EMAIL   = `e2e-emp-survey-${Date.now()}@example.com`
const EMP_PASSWORD = 'test1234'

let employeeId: string
let planId: string

test.beforeAll(async () => {
  await createHRUser(HR_EMAIL, HR_PASSWORD, 'Survey HR Tester')
  const emp = await createApplicantUser(EMP_EMAIL, EMP_PASSWORD, 'Survey', 'Employee')
  const app = await createApplication(emp.applicantId, {
    reference: `EF-HR-APP-2026-SURV${Date.now().toString(36)}`,
    status: 'HIRED',
  })
  const created = await createEmployee(emp.id, app.id, { firstName: 'Survey', lastName: 'Employee' })
  employeeId = created.id
  planId = created.planId
})

test.afterAll(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  await pool.query(`DELETE FROM "NewHireSurvey" WHERE "employeeId" = $1`, [employeeId])
  await pool.query(`DELETE FROM "DailyCheckin" WHERE "employeeId" = $1`, [employeeId])
  await pool.end()
  await cleanupByEmails([HR_EMAIL, EMP_EMAIL])
})

test('HR can view employee surveys page', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill(HR_EMAIL)
  await page.getByLabel('Password').fill(HR_PASSWORD)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await page.waitForURL(/\/hr\/dashboard/, { timeout: 60000 })

  await page.goto(`/hr/onboarding/${employeeId}/surveys`)
  await expect(page.getByRole('heading', { name: /Survey|Check-in/i })).toBeVisible({ timeout: 10000 })
})

test('Employee can navigate to survey page', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill(EMP_EMAIL)
  await page.getByLabel('Password').fill(EMP_PASSWORD)
  await page.getByRole('button', { name: 'Sign In' }).click()
  // Login sends APPLICANT to /status; navigate directly to onboarding pages
  await page.waitForURL(/\/status/, { timeout: 60000 })

  await page.goto('/onboarding/survey')
  await expect(page.getByRole('heading', { name: /Survey|Weekly/i })).toBeVisible({ timeout: 10000 })
})

test('Employee can navigate to daily check-in page', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill(EMP_EMAIL)
  await page.getByLabel('Password').fill(EMP_PASSWORD)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await page.waitForURL(/\/status/, { timeout: 60000 })

  await page.goto('/onboarding/checkin')
  await expect(page.getByRole('heading', { name: /Check.in|Daily/i })).toBeVisible({ timeout: 10000 })
})
