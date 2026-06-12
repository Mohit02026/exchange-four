import { test, expect } from '@playwright/test'
import { createHRUser, createApplicantUser, createApplication, createEmployee, cleanupByEmails } from './helpers/db'
import { Pool } from 'pg'

const HR_EMAIL    = `e2e-hr-training-${Date.now()}@exchangefour.com`
const HR_PASSWORD = 'Admin1234!'
const EMP_EMAIL   = `e2e-emp-training-${Date.now()}@example.com`

let employeeId: string

function uid() {
  return `e2e${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

test.beforeAll(async () => {
  await createHRUser(HR_EMAIL, HR_PASSWORD, 'Training HR Tester')
  const emp = await createApplicantUser(EMP_EMAIL, 'test1234', 'Training', 'Employee')
  const app = await createApplication(emp.applicantId, {
    reference: `EF-HR-APP-2026-TRAIN${Date.now().toString(36)}`,
    status: 'HIRED',
  })
  const created = await createEmployee(emp.id, app.id, { firstName: 'Training', lastName: 'Employee' })
  employeeId = created.id
})

test.afterAll(async () => {
  // Clean up training data before user cleanup
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  await pool.query(`DELETE FROM "TrainingTask" WHERE "planId" IN (SELECT id FROM "TrainingPlan" WHERE "employeeId" = $1)`, [employeeId])
  await pool.query(`DELETE FROM "TrainingPlan" WHERE "employeeId" = $1`, [employeeId])
  await pool.query(`DELETE FROM "HatPack" WHERE true`)
  await pool.end()
  await cleanupByEmails([HR_EMAIL, EMP_EMAIL])
})

test('HR can navigate to Training Hat Packs page', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill(HR_EMAIL)
  await page.getByLabel('Password').fill(HR_PASSWORD)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await page.waitForURL(/\/hr\/dashboard/, { timeout: 60000 })

  await page.goto('/hr/training')
  await expect(page.getByRole('heading', { name: /Training|Hat Pack/i })).toBeVisible({ timeout: 10000 })
})

test('HR can navigate to employee training plan page', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill(HR_EMAIL)
  await page.getByLabel('Password').fill(HR_PASSWORD)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await page.waitForURL(/\/hr\/dashboard/, { timeout: 60000 })

  await page.goto(`/hr/onboarding/${employeeId}/training`)
  await expect(page.getByRole('heading', { name: /Training/i })).toBeVisible({ timeout: 10000 })
})
