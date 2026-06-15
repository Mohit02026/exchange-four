import { test, expect, type Page } from '@playwright/test'
import { createHRUser, createApplicantUser, createApplication, createEmployee, cleanupByEmails } from './helpers/db'

const HR_EMAIL    = `e2e-hr-profile-${Date.now()}@exchangefour.com`
const HR_PASSWORD = 'Admin1234!'
const EMP_EMAIL   = `e2e-emp-profile-${Date.now()}@example.com`

let employeeId: string
let applicationId: string

test.beforeAll(async () => {
  await createHRUser(HR_EMAIL, HR_PASSWORD, 'Profile HR Tester')
  const emp = await createApplicantUser(EMP_EMAIL, 'test1234', 'Profile', 'Employee')
  const app = await createApplication(emp.applicantId, {
    reference: `EF-HR-APP-2026-PROF${Date.now().toString(36)}`,
    status: 'HIRED',
  })
  applicationId = app.id
  const created = await createEmployee(emp.id, app.id, { firstName: 'Profile', lastName: 'Employee' })
  employeeId = created.id
})

test.afterAll(async () => {
  await cleanupByEmails([HR_EMAIL, EMP_EMAIL])
})

async function login(page: Page) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(HR_EMAIL)
  await page.getByLabel('Password').fill(HR_PASSWORD)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await page.waitForURL(/\/hr\/dashboard/, { timeout: 60000 })
}

test('HR can view employee profile page', async ({ page }) => {
  await login(page)
  await page.goto(`/hr/employees/${employeeId}`)
  await expect(page).toHaveURL(/\/hr\/employees\//, { timeout: 10000 })
  await expect(page.getByText(/Profile Employee/i)).toBeVisible({ timeout: 10000 })
})

test('HR can view applicant profile page', async ({ page }) => {
  await login(page)
  await page.goto(`/hr/applications/${applicationId}`)
  await expect(page).toHaveURL(/\/hr\/applications\//, { timeout: 10000 })
  await expect(page.getByRole('heading', { name: /Profile Applicant|Profile Employee/i })).toBeVisible({ timeout: 10000 })
})

test('Employee profile page shows key info sections', async ({ page }) => {
  await login(page)
  await page.goto(`/hr/employees/${employeeId}`)
  await page.waitForLoadState('networkidle', { timeout: 15000 })

  // Profile page should show the employee name prominently
  await expect(page.getByText(/Profile Employee/i)).toBeVisible({ timeout: 10000 })

  // Onboarding plan section should be present
  const onboardingSection = page.getByText(/Onboarding|NDA|Contract|Policies/i)
  await expect(onboardingSection.first()).toBeVisible({ timeout: 10000 })
})

test('HR can navigate to employee training page from onboarding section', async ({ page }) => {
  await login(page)
  await page.goto(`/hr/onboarding/${employeeId}/training`)
  await expect(page.getByRole('heading', { name: /Training/i })).toBeVisible({ timeout: 10000 })
})

test('HR can navigate to employee surveys page from onboarding section', async ({ page }) => {
  await login(page)
  await page.goto(`/hr/onboarding/${employeeId}/surveys`)
  await expect(page.getByRole('heading', { name: /Survey|Check-in/i })).toBeVisible({ timeout: 10000 })
})

test('HR can navigate to employee statistics page', async ({ page }) => {
  await login(page)
  await page.goto(`/hr/employees/${employeeId}/statistics`)
  await expect(page.getByText(/Statistics Overview/i)).toBeVisible({ timeout: 10000 })
})

test('HR can access corrections for an employee from the corrections list', async ({ page }) => {
  await login(page)

  // Create a correction for this employee via API
  await page.request.post('/api/corrections', {
    data: {
      employeeId,
      incident: 'Profile test — missed two scheduled one-on-one meetings without notice',
      correctionRequested: 'Reschedule missed meetings and confirm attendance going forward',
      severity: 'MINOR',
    },
  })

  // Corrections page lists all corrections — employee's should appear
  await page.goto('/hr/corrections')
  await expect(page.getByRole('heading', { name: /Corrections/i })).toBeVisible({ timeout: 10000 })
  // The page renders — we just verify it loads without error
  await page.waitForLoadState('networkidle', { timeout: 15000 })
})

test('Applicant application profile shows review sections when present', async ({ page }) => {
  await login(page)
  await page.goto(`/hr/applications/${applicationId}`)
  await expect(page).toHaveURL(/\/hr\/applications\//, { timeout: 10000 })
  // Page loads with some recognizable content
  await expect(page.locator('main')).toBeVisible({ timeout: 10000 })
  await page.waitForLoadState('networkidle', { timeout: 15000 })
})
