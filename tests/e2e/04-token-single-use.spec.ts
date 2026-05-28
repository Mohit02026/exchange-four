import { test, expect } from '@playwright/test'
import {
  createApplicantUser,
  createApplication,
  createApprovalRequest,
  cleanupByEmails,
} from './helpers/db'

const APPLICANT_EMAIL = `e2e-token-${Date.now()}@example.com`
let approvalToken: string
let applicationId: string
let expiredApp1Id: string
let expiredApp2Id: string

test.beforeAll(async () => {
  const ts = Date.now()
  const user = await createApplicantUser(APPLICANT_EMAIL, 'test1234', 'Token', 'Test')

  // Primary application — used for single-use token tests
  const app = await createApplication(user.applicantId, {
    reference: `EF-HR-APP-${new Date().getFullYear()}-TKTEST${ts.toString(36)}`,
    status: 'SENT_TO_AVI',
  })
  applicationId = app.id

  const expiry = new Date(ts + 7 * 24 * 60 * 60 * 1000)
  approvalToken = `EX4-APPROVE-e2e-single-use-${ts}`
  await createApprovalRequest(applicationId, approvalToken, { tokenExpiry: expiry })

  // Extra applications for expired-token tests — ApprovalRequest.applicationId is @unique
  // so each test that inserts an ApprovalRequest needs its own application
  const app2 = await createApplication(user.applicantId, {
    reference: `EF-HR-APP-${new Date().getFullYear()}-TKEXP1${ts.toString(36)}`,
    status: 'SENT_TO_AVI',
  })
  expiredApp1Id = app2.id

  const app3 = await createApplication(user.applicantId, {
    reference: `EF-HR-APP-${new Date().getFullYear()}-TKEXP2${ts.toString(36)}`,
    status: 'SENT_TO_AVI',
  })
  expiredApp2Id = app3.id
})

test.afterAll(async () => {
  await cleanupByEmails([APPLICANT_EMAIL])
})

test('approval page renders with application data for a valid token', async ({ page }) => {
  await page.goto(`/approve/${approvalToken}`)
  // ApprovalView renders the applicant name and reference
  await expect(page.getByText(/Token Test/i)).toBeVisible()
})

test('submitting a decision marks the token as used', async ({ request }) => {
  const res = await request.post(`/api/approvals/${approvalToken}`, {
    data: { decision: 'APPROVED', reason: null },
  })
  expect(res.status()).toBe(200)
})

test('second submission with the same token returns 409', async ({ request }) => {
  // Token was used in the previous test
  const res = await request.post(`/api/approvals/${approvalToken}`, {
    data: { decision: 'APPROVED', reason: null },
  })
  expect(res.status()).toBe(409)
})

test('expired token returns 410 from the API', async ({ request }) => {
  const expiredToken = `EX4-APPROVE-expired-${Date.now()}`
  await createApprovalRequest(expiredApp1Id, expiredToken, {
    // 1 hour in the past — avoids any clock-skew between test runner and Next.js server
    tokenExpiry: new Date(Date.now() - 60 * 60 * 1000),
  })
  const res = await request.get(`/api/approvals/${expiredToken}`)
  expect(res.status()).toBe(410)
})

test('expired approval page shows "Link Expired" heading', async ({ page }) => {
  const expiredToken2 = `EX4-APPROVE-expired2-${Date.now()}`
  await createApprovalRequest(expiredApp2Id, expiredToken2, {
    tokenExpiry: new Date(Date.now() - 60 * 60 * 1000),
  })
  await page.goto(`/approve/${expiredToken2}`)
  await expect(page.getByRole('heading', { name: 'Link Expired' })).toBeVisible()
})
