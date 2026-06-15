import { test, expect, type Page } from '@playwright/test'
import { createHRUser, createApplicantUser, createApplication, createEmployee, cleanupByEmails } from './helpers/db'
import { Pool } from 'pg'

const HR_EMAIL    = `e2e-hr-training-${Date.now()}@exchangefour.com`
const HR_PASSWORD = 'Admin1234!'
const EMP_EMAIL   = `e2e-emp-training-${Date.now()}@example.com`

let employeeId: string

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
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  await pool.query(
    `DELETE FROM "TrainingTask" WHERE "planId" IN (SELECT id FROM "TrainingPlan" WHERE "employeeId" = $1)`,
    [employeeId],
  )
  await pool.query(`DELETE FROM "TrainingPlan" WHERE "employeeId" = $1`, [employeeId])
  await pool.query(`DELETE FROM "HatPack" WHERE true`)
  await pool.end()
  await cleanupByEmails([HR_EMAIL, EMP_EMAIL])
})

async function login(page: Page) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(HR_EMAIL)
  await page.getByLabel('Password').fill(HR_PASSWORD)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await page.waitForURL(/\/hr\/dashboard/, { timeout: 60000 })
}

test('HR can navigate to Training Hat Packs page', async ({ page }) => {
  await login(page)
  await page.goto('/hr/training')
  await expect(page.getByRole('heading', { name: /Training|Hat Pack/i })).toBeVisible({ timeout: 10000 })
})

test('HR can navigate to employee training plan page', async ({ page }) => {
  await login(page)
  await page.goto(`/hr/onboarding/${employeeId}/training`)
  await expect(page.getByRole('heading', { name: /Training/i })).toBeVisible({ timeout: 10000 })
})

test('HR can create a hat pack via API', async ({ page }) => {
  await login(page)

  const res = await page.request.post('/api/training/hatpack', {
    data: {
      postTitle: 'E2E Test Role',
      functions: ['Write daily status report', 'Review team submissions', 'Attend weekly standup'],
    },
  })
  expect(res.status()).toBe(200)
  const body = await res.json() as { pack: { postTitle: string; functions: string[] } }
  expect(body.pack.postTitle).toBe('E2E Test Role')
  expect(body.pack.functions).toHaveLength(3)
})

test('Created hat pack appears in the training list', async ({ page }) => {
  await login(page)

  // Upsert the hat pack
  await page.request.post('/api/training/hatpack', {
    data: {
      postTitle: 'E2E List Test Role',
      functions: ['Handle client onboarding calls', 'Maintain CRM records'],
    },
  })

  await page.goto('/hr/training')
  await expect(page.getByText(/E2E List Test Role/i)).toBeVisible({ timeout: 10000 })
})

test('HR can create a training plan for an employee', async ({ page }) => {
  await login(page)

  const res = await page.request.post(`/api/training/${employeeId}`, {
    data: { postTitle: 'E2E Test Role' },
  })
  // 200 if plan already exists (idempotent), 201 if new
  expect([200, 201]).toContain(res.status())
  const body = await res.json() as { plan: { id: string; postTitle: string } }
  expect(body.plan.id).toBeTruthy()
})

test('HR can add a training task to an employee plan', async ({ page }) => {
  await login(page)

  // Ensure training plan exists
  await page.request.post(`/api/training/${employeeId}`, {
    data: { postTitle: 'E2E Test Role' },
  })

  const res = await page.request.post(`/api/training/${employeeId}/task`, {
    data: { functionName: 'Write daily status report' },
  })
  expect(res.status()).toBe(200)
  const body = await res.json() as { task: { id: string; functionName: string; status: string } }
  expect(body.task.functionName).toBe('Write daily status report')
  expect(body.task.status).toBe('NOT_STARTED')
})

test('HR can mark a training task as PASSED', async ({ page }) => {
  await login(page)

  // Ensure plan and task exist
  await page.request.post(`/api/training/${employeeId}`, {
    data: { postTitle: 'E2E Test Role' },
  })
  const taskRes = await page.request.post(`/api/training/${employeeId}/task`, {
    data: { functionName: 'Attend weekly standup' },
  })
  expect(taskRes.status()).toBe(200)
  const { task } = await taskRes.json() as { task: { id: string } }

  const patchRes = await page.request.patch(`/api/training/${employeeId}/task/${task.id}`, {
    data: { status: 'PASSED', qualityCheckNotes: 'Completed all three standups this week' },
  })
  expect(patchRes.status()).toBe(200)
  const patched = await patchRes.json() as { task: { status: string } }
  expect(patched.task.status).toBe('PASSED')
})

test('HR can mark a training task as NEEDS_CORRECTION', async ({ page }) => {
  await login(page)

  await page.request.post(`/api/training/${employeeId}`, {
    data: { postTitle: 'E2E Test Role' },
  })
  const taskRes = await page.request.post(`/api/training/${employeeId}/task`, {
    data: { functionName: 'Review team submissions' },
  })
  expect(taskRes.status()).toBe(200)
  const { task } = await taskRes.json() as { task: { id: string } }

  const patchRes = await page.request.patch(`/api/training/${employeeId}/task/${task.id}`, {
    data: {
      status: 'NEEDS_CORRECTION',
      correctionNotes: 'Submissions were not reviewed by the Friday deadline on two occasions',
    },
  })
  expect(patchRes.status()).toBe(200)
  const patched = await patchRes.json() as { task: { status: string } }
  expect(patched.task.status).toBe('NEEDS_CORRECTION')
})

test('Employee training plan page reflects added tasks', async ({ page }) => {
  await login(page)

  // Ensure plan exists
  await page.request.post(`/api/training/${employeeId}`, {
    data: { postTitle: 'E2E Test Role' },
  })
  // Add a visible task
  await page.request.post(`/api/training/${employeeId}/task`, {
    data: { functionName: 'Maintain CRM records' },
  })

  await page.goto(`/hr/onboarding/${employeeId}/training`)
  await expect(page.getByText(/Maintain CRM records/i)).toBeVisible({ timeout: 10000 })
})
