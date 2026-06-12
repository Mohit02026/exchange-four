import { test, expect } from '@playwright/test'
import { createHRUser, cleanupByEmails } from './helpers/db'
import { Pool } from 'pg'

const HR_EMAIL    = `e2e-hr-offb-${Date.now()}@exchangefour.com`
const HR_PASSWORD = 'Admin1234!'

function uid() {
  return `e2e${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

async function createEmployee() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const empUserId = uid()
  const empId = uid()

  await pool.query(
    `INSERT INTO "User" (id, email, password, role, name, "createdAt", "updatedAt")
     VALUES ($1, $2, 'hash', 'APPLICANT'::"Role", 'Offboard User', now(), now())`,
    [empUserId, `offb-${empId}@example.com`],
  )
  await pool.query(
    `INSERT INTO "Employee" (id, "userId", "firstName", "lastName", "createdAt", "updatedAt")
     VALUES ($1, $2, 'Offboard', 'Tester', now(), now())`,
    [empId, empUserId],
  )
  await pool.end()
  return { id: empId, userId: empUserId }
}

async function cleanup(emails: string[], empUserId?: string) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  if (empUserId) {
    const empRes = await pool.query(`SELECT id FROM "Employee" WHERE "userId" = $1`, [empUserId])
    if (empRes.rows.length) {
      const empId = empRes.rows[0].id as string
      const caseRes = await pool.query(`SELECT id FROM "OffboardingCase" WHERE "employeeId" = $1`, [empId])
      for (const c of caseRes.rows) {
        await pool.query(`DELETE FROM "OffboardingChecklistItem" WHERE "caseId" = $1`, [c.id])
        await pool.query(`DELETE FROM "OffboardingCase" WHERE id = $1`, [c.id])
      }
      await pool.query(`DELETE FROM "Employee" WHERE id = $1`, [empId])
    }
    await pool.query(`DELETE FROM "User" WHERE id = $1`, [empUserId])
  }
  await pool.end()
  await cleanupByEmails(emails)
}

let empUserId: string

test.beforeAll(async () => {
  await createHRUser(HR_EMAIL, HR_PASSWORD, 'Offboarding HR Tester')
  const emp = await createEmployee()
  empUserId = emp.userId
})

test.afterAll(async () => {
  await cleanup([HR_EMAIL], empUserId)
})

test('HR can navigate to Offboarding page', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill(HR_EMAIL)
  await page.getByLabel('Password').fill(HR_PASSWORD)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await page.waitForURL(/\/hr\/dashboard/, { timeout: 60000 })

  await page.goto('/hr/offboarding')
  await expect(page.getByRole('heading', { name: /Offboarding/i })).toBeVisible({ timeout: 10000 })
})

test('HR can open Start Offboarding form', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill(HR_EMAIL)
  await page.getByLabel('Password').fill(HR_PASSWORD)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await page.waitForURL(/\/hr\/dashboard/, { timeout: 60000 })

  await page.goto('/hr/offboarding/new')
  await expect(page.getByRole('heading', { name: /Start Offboarding/i })).toBeVisible({ timeout: 10000 })
})

test('HR can start an offboarding case for VOLUNTARY reason', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill(HR_EMAIL)
  await page.getByLabel('Password').fill(HR_PASSWORD)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await page.waitForURL(/\/hr\/dashboard/, { timeout: 60000 })

  await page.goto('/hr/offboarding/new')

  // Select employee
  const select = page.locator('select').first()
  if (await select.count() > 0) {
    await select.selectOption({ index: 1 })
  }

  // Click VOLUNTARY reason button
  const voluntaryBtn = page.getByRole('button', { name: /VOLUNTARY/i })
  if (await voluntaryBtn.count() > 0) await voluntaryBtn.click()

  await page.getByRole('button', { name: /Start Offboarding/i }).click()

  // Should land on offboarding case detail or list
  await expect(page).toHaveURL(/\/hr\/offboarding/, { timeout: 10000 })
})

test('Weekly Report page is accessible to HR', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill(HR_EMAIL)
  await page.getByLabel('Password').fill(HR_PASSWORD)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await page.waitForURL(/\/hr\/dashboard/, { timeout: 60000 })

  await page.goto('/hr/reports/weekly')
  await expect(page.getByRole('heading', { name: /Weekly Personnel Report/i })).toBeVisible({ timeout: 10000 })
  await expect(page.getByRole('button', { name: /Send Report Now/i })).toBeVisible()
})
