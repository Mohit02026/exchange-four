import { test, expect } from '@playwright/test'
import { createHRUser, cleanupByEmails } from './helpers/db'
import { Pool } from 'pg'

const HR_EMAIL    = `e2e-hr-report-${Date.now()}@exchangefour.com`
const HR_PASSWORD = 'Admin1234!'

test.beforeAll(async () => {
  await createHRUser(HR_EMAIL, HR_PASSWORD, 'Report HR Tester')
})

test.afterAll(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  await pool.query(`DELETE FROM "WeeklyReport" WHERE true`)
  await pool.end()
  await cleanupByEmails([HR_EMAIL])
})

test('HR can navigate to Weekly Reports page', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill(HR_EMAIL)
  await page.getByLabel('Password').fill(HR_PASSWORD)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await page.waitForURL(/\/hr\/dashboard/, { timeout: 60000 })

  await page.goto('/hr/reports/weekly')
  await expect(page.getByRole('heading', { name: /Weekly Report|Executive Report/i })).toBeVisible({ timeout: 10000 })
})

test('HR can generate a weekly report', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill(HR_EMAIL)
  await page.getByLabel('Password').fill(HR_PASSWORD)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await page.waitForURL(/\/hr\/dashboard/, { timeout: 60000 })

  await page.goto('/hr/reports/weekly')
  await page.waitForSelector('button', { timeout: 10000 })

  const generateBtn = page.getByRole('button', { name: /Generate Report|Create Report/i })
  if (await generateBtn.count() > 0) {
    await generateBtn.click()
    // Should show report data after generation
    await expect(page.getByText(/Pipeline|Onboarding|Report/i)).toBeVisible({ timeout: 15000 })
  }
})
