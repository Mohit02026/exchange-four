import { test, expect } from '@playwright/test'
import { cleanupByEmails } from './helpers/db'
import path from 'path'
import fs from 'fs'

const TEST_EMAIL = `e2e-applicant-${Date.now()}@example.com`

test.beforeEach(async () => {
  await cleanupByEmails([TEST_EMAIL])
})

test.afterEach(async () => {
  await cleanupByEmails([TEST_EMAIL])
})

test('applicant can register, log in, and see status page', async ({ page }) => {
  // ── Register ──────────────────────────────────────────────────────────────
  await page.goto('/register')
  await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible()

  await page.getByLabel('First Name').fill('E2E')
  await page.getByLabel('Last Name').fill('Applicant')
  await page.getByLabel('Login Email').fill(TEST_EMAIL)
  await page.getByLabel('Correspondence Email').fill(TEST_EMAIL)
  await page.getByLabel('Password').fill('password123')

  await page.getByRole('button', { name: 'Create Account' }).click()

  // Should redirect to login with ?registered=true
  await expect(page).toHaveURL(/\/login/, { timeout: 15000 })
  await expect(page.getByText('Account created')).toBeVisible()

  // ── Log in ────────────────────────────────────────────────────────────────
  // Navigate explicitly to /login so the form is fully loaded before interaction.
  // The registration redirect (login?registered=true) can race with router.refresh()
  // in the login page's handleSubmit, causing the URL to stick at the redirect target.
  await page.goto('/login')
  await page.getByLabel('Email').fill(TEST_EMAIL)
  await page.getByLabel('Password').fill('password123')
  await page.getByRole('button', { name: 'Sign In' }).click()

  // Applicant should land on /status — allow 20s for NextAuth session fetch + redirect
  await expect(page).toHaveURL(/\/status/, { timeout: 20000 })
  await expect(page.getByRole('heading', { name: 'Application Status' })).toBeVisible()
  await expect(page.getByText('No application on file')).toBeVisible()
})

test('applicant sees "Apply now" link on empty status page', async ({ page }) => {
  // Register
  await page.goto('/register')
  await page.getByLabel('First Name').fill('E2E')
  await page.getByLabel('Last Name').fill('Applicant')
  await page.getByLabel('Login Email').fill(TEST_EMAIL)
  await page.getByLabel('Correspondence Email').fill(TEST_EMAIL)
  await page.getByLabel('Password').fill('password123')
  await page.getByRole('button', { name: 'Create Account' }).click()

  // Log in
  await page.goto('/login')
  await page.getByLabel('Email').fill(TEST_EMAIL)
  await page.getByLabel('Password').fill('password123')
  await page.getByRole('button', { name: 'Sign In' }).click()
  await expect(page).toHaveURL(/\/status/, { timeout: 20000 })

  // "Apply now" link is present
  const applyLink = page.getByRole('link', { name: /Apply now/i })
  await expect(applyLink).toBeVisible()
  await expect(applyLink).toHaveAttribute('href', '/apply')
})

test('applicant can submit an application and see it on status page', async ({ page }) => {
  // This test pre-warms the /api/applications route (cold compilation can take 30s+)
  // then submits the form — budget 120s total to cover worst-case compilation.
  test.setTimeout(120000)

  // Register + log in
  await page.goto('/register')
  await page.getByLabel('First Name').fill('E2E')
  await page.getByLabel('Last Name').fill('Applicant')
  await page.getByLabel('Login Email').fill(TEST_EMAIL)
  await page.getByLabel('Correspondence Email').fill(TEST_EMAIL)
  await page.getByLabel('Password').fill('password123')
  await page.getByRole('button', { name: 'Create Account' }).click()

  await page.goto('/login')
  await page.getByLabel('Email').fill(TEST_EMAIL)
  await page.getByLabel('Password').fill('password123')
  await page.getByRole('button', { name: 'Sign In' }).click()
  await expect(page).toHaveURL(/\/status/, { timeout: 20000 })

  // Navigate to apply
  await page.goto('/apply')
  await expect(page.getByRole('heading', { name: 'Submit Application' })).toBeVisible()

  // Pre-warm /api/applications route — first access in the suite triggers cold compilation
  // which can take 15-30s. The warmup request blocks until the route responds (403 for
  // APPLICANT role), guaranteeing the module is compiled before the real form POST.
  try {
    await page.request.get('/api/applications', { timeout: 45000 })
  } catch { /* 403 expected for APPLICANT — we only need the compilation side-effect */ }

  // Create minimal temp files for upload
  const tmpDir = path.join(process.cwd(), 'tmp-e2e-uploads')
  fs.mkdirSync(tmpDir, { recursive: true })
  const cvPath    = path.join(tmpDir, 'cv.pdf')
  const photoPath = path.join(tmpDir, 'photo.jpg')
  const videoPath = path.join(tmpDir, 'video.mp4')
  fs.writeFileSync(cvPath,    '%PDF-1.4 test cv content')
  fs.writeFileSync(photoPath, Buffer.from([0xff, 0xd8, 0xff, 0xe0])) // minimal JPEG header
  fs.writeFileSync(videoPath, Buffer.from([0x00, 0x00, 0x00, 0x18])) // minimal MP4-ish

  // Upload files
  await page.locator('input[name="cv"]').setInputFiles(cvPath)
  await page.locator('input[name="photo"]').setInputFiles(photoPath)
  await page.locator('input[name="video"]').setInputFiles(videoPath)

  // Fill text fields
  await page.locator('textarea[name="bio"]').fill('I am a dedicated professional with 5 years of experience.')
  await page.locator('textarea[name="skills"]').fill('Project management, Excel, communication')
  await page.locator('textarea[name="hobbies"]').fill('Reading, cycling, cooking')
  await page.locator('textarea[name="careerGoals"]').fill('To lead a high-performance operations team')
  await page.locator('textarea[name="whyExchangeFour"]').fill('The company values align with mine')

  // Submit
  await page.getByRole('button', { name: 'Submit Application' }).click()

  // Should land on /status with application visible
  await expect(page).toHaveURL(/\/status/, { timeout: 30000 })
  await expect(page.getByText('Application Received')).toBeVisible()
  await expect(page.getByText(/EF-HR-APP-\d{4}-\d{6}/)).toBeVisible()

  // Cleanup temp files — ignore EPERM on Windows (file still open by browser process)
  try { fs.rmSync(tmpDir, { recursive: true, force: true }) } catch { /* ignore */ }
})
