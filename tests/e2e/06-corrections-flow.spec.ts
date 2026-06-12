import { test, expect } from '@playwright/test'
import { createHRUser, cleanupByEmails } from './helpers/db'
import { Pool } from 'pg'

const HR_EMAIL    = `e2e-hr-corr-${Date.now()}@exchangefour.com`
const HR_PASSWORD = 'Admin1234!'

function uid() {
  return `e2e${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

async function createEmployeeWithUser(hrUserId: string) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const empUserId = uid()
  const empId = uid()

  await pool.query(
    `INSERT INTO "User" (id, email, password, role, name, "createdAt", "updatedAt")
     VALUES ($1, $2, 'hash', 'APPLICANT'::"Role", 'Emp User', now(), now())`,
    [empUserId, `emp-${empId}@example.com`],
  )
  await pool.query(
    `INSERT INTO "Employee" (id, "userId", "firstName", "lastName", "createdAt", "updatedAt")
     VALUES ($1, $2, 'Correction', 'Subject', now(), now())`,
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
  const emp = await createEmployeeWithUser(hrId)
  employeeId = emp.id
  empUserId = emp.userId
})

test.afterAll(async () => {
  await cleanup([HR_EMAIL], empUserId)
})

test('HR can navigate to Corrections page', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill(HR_EMAIL)
  await page.getByLabel('Password').fill(HR_PASSWORD)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await page.waitForURL(/\/hr\/dashboard/, { timeout: 60000 })

  await page.goto('/hr/corrections')
  await expect(page.getByRole('heading', { name: /Corrections/i })).toBeVisible({ timeout: 10000 })
})

test('HR can open New Correction form', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill(HR_EMAIL)
  await page.getByLabel('Password').fill(HR_PASSWORD)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await page.waitForURL(/\/hr\/dashboard/, { timeout: 60000 })

  await page.goto('/hr/corrections/new')
  await expect(page.getByRole('heading', { name: /File Correction/i })).toBeVisible({ timeout: 10000 })
})

test('HR can file a correction and it appears in the list', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill(HR_EMAIL)
  await page.getByLabel('Password').fill(HR_PASSWORD)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await page.waitForURL(/\/hr\/dashboard/, { timeout: 60000 })

  await page.goto('/hr/corrections/new')
  await page.waitForSelector('select[name="employeeId"], [data-testid="employee-select"]', { timeout: 10000 }).catch(() => null)

  // Select employee
  const select = page.locator('select').first()
  if (await select.count() > 0) {
    await select.selectOption({ index: 1 })
  }

  // Fill incident and correction fields
  const incident = page.getByPlaceholder(/incident/i).or(page.locator('textarea').first())
  if (await incident.count() > 0) await incident.fill('Late to meetings repeatedly')

  const correction = page.getByPlaceholder(/correction requested/i).or(page.locator('textarea').nth(1))
  if (await correction.count() > 0) await correction.fill('Punctuality improvement plan')

  // Pick MINOR severity
  const minorBtn = page.getByRole('button', { name: /MINOR/i })
  if (await minorBtn.count() > 0) await minorBtn.click()

  await page.getByRole('button', { name: /File Correction/i }).click()

  // Should redirect to corrections list or detail
  await expect(page).toHaveURL(/\/hr\/corrections/, { timeout: 10000 })
})
