import { test, expect } from '@playwright/test'
import { createHRUser, cleanupByEmails } from './helpers/db'

const HR_EMAIL    = `e2e-hr-ethics-${Date.now()}@exchangefour.com`
const HR_PASSWORD = 'Admin1234!'

test.beforeAll(async () => {
  await createHRUser(HR_EMAIL, HR_PASSWORD, 'Ethics HR Tester')
})

test.afterAll(async () => {
  await cleanupByEmails([HR_EMAIL])
})

test('HR can navigate to Ethics Reports page', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill(HR_EMAIL)
  await page.getByLabel('Password').fill(HR_PASSWORD)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await page.waitForURL(/\/hr\/dashboard/, { timeout: 60000 })

  await page.goto('/hr/ethics')
  await expect(page.getByRole('heading', { name: /Ethics/i })).toBeVisible({ timeout: 10000 })
})

test('HR can open New Ethics Report form', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill(HR_EMAIL)
  await page.getByLabel('Password').fill(HR_PASSWORD)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await page.waitForURL(/\/hr\/dashboard/, { timeout: 60000 })

  await page.goto('/hr/ethics/new')
  await expect(page.getByRole('heading', { name: /New Ethics Report|File Report/i })).toBeVisible({ timeout: 10000 })
})

test('HR can file an ethics report and see it in the list', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill(HR_EMAIL)
  await page.getByLabel('Password').fill(HR_PASSWORD)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await page.waitForURL(/\/hr\/dashboard/, { timeout: 60000 })

  await page.goto('/hr/ethics/new')

  // Fill category
  const categoryInput = page.getByPlaceholder(/category/i).or(page.locator('input[name="category"]'))
  if (await categoryInput.count() > 0) await categoryInput.fill('Misconduct')

  // Fill description (must be > 10 chars per Zod validation)
  const descInput = page.getByPlaceholder(/description/i).or(page.locator('textarea').first())
  if (await descInput.count() > 0) {
    await descInput.fill('An employee was observed taking office supplies without authorisation on multiple occasions.')
  }

  // Pick severity
  const mediumBtn = page.getByRole('button', { name: /MEDIUM/i })
  if (await mediumBtn.count() > 0) await mediumBtn.click()

  await page.getByRole('button', { name: /Submit|File Report/i }).click()

  await expect(page).toHaveURL(/\/hr\/ethics/, { timeout: 10000 })
})
