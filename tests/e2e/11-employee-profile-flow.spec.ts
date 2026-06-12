import { test, expect } from '@playwright/test'
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

test('HR can view employee profile page', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill(HR_EMAIL)
  await page.getByLabel('Password').fill(HR_PASSWORD)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await page.waitForURL(/\/hr\/dashboard/, { timeout: 60000 })

  await page.goto(`/hr/employees/${employeeId}`)
  await expect(page).toHaveURL(/\/hr\/employees\//, { timeout: 10000 })
  // Employee name should appear somewhere on the profile
  await expect(page.getByText(/Profile Employee/i)).toBeVisible({ timeout: 10000 })
})

test('HR can view applicant profile page', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill(HR_EMAIL)
  await page.getByLabel('Password').fill(HR_PASSWORD)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await page.waitForURL(/\/hr\/dashboard/, { timeout: 60000 })

  await page.goto(`/hr/applications/${applicationId}`)
  await expect(page).toHaveURL(/\/hr\/applications\//, { timeout: 10000 })
  await expect(page.getByText(/Profile Applicant|Profile Employee/i)).toBeVisible({ timeout: 10000 })
})
