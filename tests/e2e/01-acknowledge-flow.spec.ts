import { test, expect } from '@playwright/test'
import {
  createApplicantUser,
  createApplication,
  createEmployee,
  getOnboardingPlan,
  cleanupByEmails,
} from './helpers/db'

const EMPLOYEE_EMAIL = `e2e-employee-${Date.now()}@example.com`
let employeeId: string

test.beforeAll(async () => {
  const user = await createApplicantUser(EMPLOYEE_EMAIL, 'test1234', 'E2E', 'Employee')
  const app  = await createApplication(user.applicantId, {
    reference: `EF-HR-APP-${new Date().getFullYear()}-EMPTEST${Date.now().toString(36)}`,
    status: 'HIRED',
  })
  const emp = await createEmployee(user.id, app.id, { firstName: 'E2E', lastName: 'Employee' })
  employeeId = emp.id
})

test.afterAll(async () => {
  await cleanupByEmails([EMPLOYEE_EMAIL])
})

test('acknowledge page loads and shows three unchecked boxes', async ({ page }) => {
  await page.goto(`/acknowledge/${employeeId}`)

  // exact: true prevents substring/case-insensitive match on description text
  await expect(page.getByText('Non-Disclosure Agreement (NDA)', { exact: true })).toBeVisible()
  await expect(page.getByText('Employment Contract', { exact: true })).toBeVisible()
  await expect(page.getByText('Company Policies & Employee Handbook', { exact: true })).toBeVisible()

  // All checkboxes are unchecked
  const checkboxes = page.getByRole('checkbox')
  await expect(checkboxes).toHaveCount(3)
  for (const cb of await checkboxes.all()) {
    await expect(cb).not.toBeChecked()
  }

  // Submit button is disabled
  await expect(page.getByRole('button', { name: /Submit Acknowledgment/i })).toBeDisabled()
})

test('submit button enables only when all three checkboxes are ticked', async ({ page }) => {
  await page.goto(`/acknowledge/${employeeId}`)
  const checkboxes = page.getByRole('checkbox')

  // Tick one — still disabled
  await checkboxes.nth(0).click()
  await expect(page.getByRole('button', { name: /Submit Acknowledgment/i })).toBeDisabled()

  // Tick two — still disabled
  await checkboxes.nth(1).click()
  await expect(page.getByRole('button', { name: /Submit Acknowledgment/i })).toBeDisabled()

  // Tick all three — enabled
  await checkboxes.nth(2).click()
  await expect(page.getByRole('button', { name: /Submit Acknowledgment/i })).toBeEnabled()
})

test('submitting acknowledgment shows success state', async ({ page }) => {
  await page.goto(`/acknowledge/${employeeId}`)
  const checkboxes = page.getByRole('checkbox')
  for (const cb of await checkboxes.all()) {
    await cb.click()
  }
  await page.getByRole('button', { name: /Submit Acknowledgment/i }).click()

  await expect(page.getByText(/Acknowledgment recorded/i)).toBeVisible({ timeout: 10000 })
})

test('after submission, flags are persisted in the DB', async () => {
  const plan = await getOnboardingPlan(employeeId)
  expect(plan?.ndaSigned).toBe(true)
  expect(plan?.contractSigned).toBe(true)
  expect(plan?.policiesRead).toBe(true)
})

test('reloading the page shows all items as "Already acknowledged"', async ({ page }) => {
  // Flags are all true from the previous test
  await page.goto(`/acknowledge/${employeeId}`)
  const badges = page.getByText(/Already acknowledged/i)
  await expect(badges).toHaveCount(3)

  // All checkboxes are disabled
  const checkboxes = page.getByRole('checkbox')
  for (const cb of await checkboxes.all()) {
    await expect(cb).toBeDisabled()
  }
})
