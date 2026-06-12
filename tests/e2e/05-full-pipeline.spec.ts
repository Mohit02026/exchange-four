import { test, expect } from '@playwright/test'
import {
  createHRUser,
  createApplicantUser,
  createApplication,
  createApprovalRequest,
  getApplicationStatus,
  updateApplicationStatus,
  cleanupApplicationById,
  cleanupByEmails,
} from './helpers/db'

// We seed a full HR + applicant scenario, then drive the full pipeline in the browser.
// The pipeline ends at Nicola's final decision page.

const HR_EMAIL        = `e2e-hr-${Date.now()}@exchangefour.com`
const HR_PASSWORD     = 'Admin1234!'
const APPLICANT_EMAIL = `e2e-pipeline-${Date.now()}@example.com`
const APPLICANT_PASSWORD = 'password123'

let applicationId: string
let approvalToken: string

test.beforeAll(async () => {
  await createHRUser(HR_EMAIL, HR_PASSWORD, 'HR Tester')

  const applicant = await createApplicantUser(APPLICANT_EMAIL, APPLICANT_PASSWORD, 'Pipeline', 'Applicant')

  const app = await createApplication(applicant.applicantId, {
    reference: `EF-HR-APP-${new Date().getFullYear()}-PIPE${Date.now().toString(36)}`,
    status: 'SUBMITTED',
    reviewToken: 'E2E-REVIEW-TOKEN-PIPELINE',
    reviewTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  })
  applicationId = app.id
})

test.afterAll(async () => {
  await cleanupApplicationById(applicationId)
  await cleanupByEmails([HR_EMAIL, APPLICANT_EMAIL])
})

test('HR can log in and see the application in the review queue', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill(HR_EMAIL)
  await page.getByLabel('Password').fill(HR_PASSWORD)
  await page.getByRole('button', { name: 'Sign In' }).click()

  // HR lands on dashboard — first login on cold server can take up to 60s
  // (includes bcrypt verification + first-time /hr/dashboard compilation in dev mode)
  await expect(page).toHaveURL(/\/hr\/dashboard/, { timeout: 60000 })
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

  // Navigate to applications queue — table may take time to render after SSR
  await page.goto('/hr/applications')
  await expect(page.getByText(/EF-HR-APP/).first()).toBeVisible({ timeout: 15000 })
})

test('HR can open the application detail page via review token', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill(HR_EMAIL)
  await page.getByLabel('Password').fill(HR_PASSWORD)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await page.waitForURL(/\/hr\/dashboard/, { timeout: 15000 })

  // Open the review page directly via token (as Nicola would click from email)
  await page.goto('/hr/review/E2E-REVIEW-TOKEN-PIPELINE')
  await expect(page.getByRole('heading', { name: /Pipeline Applicant/i })).toBeVisible()
})

test('HR application detail page shows profile tabs', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill(HR_EMAIL)
  await page.getByLabel('Password').fill(HR_PASSWORD)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await page.waitForURL(/\/hr\/dashboard/, { timeout: 20000 })

  await page.goto(`/hr/applications/${applicationId}`)
  await expect(page.getByRole('heading', { name: /Pipeline Applicant/i })).toBeVisible({ timeout: 20000 })

  // Application detail page renders profile tabs
  await expect(page.getByRole('button', { name: /Review Notes/i })).toBeVisible({ timeout: 10000 })
  await expect(page.getByRole('button', { name: /Application/i })).toBeVisible({ timeout: 5000 })
})

test('Nicola final decision page is accessible for EXECUTIVE_APPROVED applications', async ({ page }) => {
  // Force the application to EXECUTIVE_APPROVED state so the final decision page renders
  approvalToken = `EX4-APPROVE-pipeline-${Date.now()}`
  await createApprovalRequest(applicationId, approvalToken, {
    tokenUsed: true,
    withDecision: 'APPROVED',
  })
  await updateApplicationStatus(applicationId, 'EXECUTIVE_APPROVED')

  // Log in as HR and open the final decision page
  await page.goto('/login')
  await page.getByLabel('Email').fill(HR_EMAIL)
  await page.getByLabel('Password').fill(HR_PASSWORD)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await page.waitForURL(/\/hr\/dashboard/)

  await page.goto(`/hr/applications/${applicationId}/final`)
  await expect(page.getByRole('heading', { name: /Final Decision/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /Fully Approved/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /Keep Warm/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /Rejected/i })).toBeVisible()
})

test('HR clicking "Fully Approved" sets status to START_DATE_REQUESTED', async ({ page }) => {
  // Ensure application is in EXECUTIVE_APPROVED state
  await updateApplicationStatus(applicationId, 'EXECUTIVE_APPROVED')

  await page.goto('/login')
  await page.getByLabel('Email').fill(HR_EMAIL)
  await page.getByLabel('Password').fill(HR_PASSWORD)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await page.waitForURL(/\/hr\/dashboard/)

  await page.goto(`/hr/applications/${applicationId}/final`)
  await page.getByRole('button', { name: /Fully Approved/i }).click()

  // Decision recorded message should appear
  await expect(page.getByText(/Decision recorded/i)).toBeVisible({ timeout: 10000 })
  // Badge appears in both header and decided-section — use first()
  await expect(page.getByText(/Approved.*Awaiting Start Date/i).first()).toBeVisible()

  // DB should reflect the change
  const status = await getApplicationStatus(applicationId)
  expect(status).toBe('START_DATE_REQUESTED')
})
