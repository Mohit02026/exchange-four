/**
 * Raw-SQL database helpers for Playwright E2E tests.
 *
 * Why not Prisma?  The generated client (lib/generated/prisma/client.ts) uses
 * `import.meta.url` which causes Playwright's esbuild bundler to emit an ESM
 * bundle.  CJS modules inside that bundle then fail with "exports is not defined
 * in ES module scope".  The `pg` package is plain CJS — zero interop issues.
 */

import { Pool } from 'pg'
import bcrypt from 'bcryptjs'

function getPool(): Pool {
  return new Pool({ connectionString: process.env.DATABASE_URL })
}

/** Short unique ID for test rows — not a real cuid, just needs to be unique. */
function uid(): string {
  return `e2e${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

/**
 * Convert a JS Date to a UTC string with no timezone offset.
 *
 * pg.prepareValue(Date) sends the LOCAL time with +HH:MM offset.
 * PostgreSQL IGNORES that offset for TIMESTAMP WITHOUT TIME ZONE columns
 * and stores the bare local-time digits — which Prisma later misinterprets
 * as UTC (normalize_timestamp appends +00:00 unconditionally).
 *
 * Sending a plain UTC string like '2026-05-27 10:00:00' avoids the mismatch:
 * PostgreSQL stores the UTC digits as-is, and Prisma reads them back correctly.
 */
function toUtcString(date: Date): string {
  return date.toISOString().replace('T', ' ').replace('Z', '')
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface CreatedUser     { id: string; email: string }
export interface CreatedApplicant { id: string; email: string; applicantId: string }
export interface CreatedApp      { id: string; reference: string }
export interface CreatedApproval { id: string; token: string }
export interface CreatedEmployee { id: string; planId: string }

// ── Seed helpers ─────────────────────────────────────────────────────────────

export async function createHRUser(
  email: string,
  password: string,
  name = 'HR Tester',
): Promise<CreatedUser> {
  const pool = getPool()
  const id     = uid()
  const hashed = await bcrypt.hash(password, 10)
  await pool.query(
    `INSERT INTO "User" (id, email, password, role, name, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, 'HR'::"Role", $4, now(), now())`,
    [id, email, hashed, name],
  )
  await pool.end()
  return { id, email }
}

export async function createApplicantUser(
  email: string,
  password: string,
  firstName = 'Test',
  lastName  = 'Applicant',
): Promise<CreatedApplicant> {
  const pool       = getPool()
  const userId     = uid()
  const applicantId = uid()
  const hashed     = await bcrypt.hash(password, 10)

  await pool.query(
    `INSERT INTO "User" (id, email, password, role, name, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, 'APPLICANT'::"Role", $4, now(), now())`,
    [userId, email, hashed, `${firstName} ${lastName}`],
  )
  await pool.query(
    `INSERT INTO "Applicant" (id, "userId", "firstName", "lastName", "correspondenceEmail", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, now(), now())`,
    [applicantId, userId, firstName, lastName, email],
  )
  await pool.end()
  return { id: userId, email, applicantId }
}

export async function createApplication(
  applicantId: string,
  opts: {
    reference       : string
    status         ?: string
    reviewToken    ?: string
    reviewTokenExpiry?: Date
  },
): Promise<CreatedApp> {
  const pool = getPool()
  const id   = uid()
  await pool.query(
    `INSERT INTO "Application"
       (id, reference, "applicantId", "isGeneralApplication", status,
        bio, skills, hobbies, "careerGoals", "whyExchangeFour",
        "submittedAt", "updatedAt", "reviewToken", "reviewTokenExpiry")
     VALUES ($1,$2,$3,true,$4::"ApplicationStatus",'bio','skills','hobbies','goals','why',now(),now(),$5,$6)`,
    [id, opts.reference, applicantId,
     opts.status ?? 'SUBMITTED',
     opts.reviewToken ?? null,
     opts.reviewTokenExpiry ? toUtcString(opts.reviewTokenExpiry) : null],
  )
  await pool.end()
  return { id, reference: opts.reference }
}

export async function createApprovalRequest(
  applicationId: string,
  token: string,
  opts?: {
    tokenExpiry?: Date
    tokenUsed  ?: boolean
    withDecision?: 'APPROVED' | 'DISAPPROVED'
  },
): Promise<CreatedApproval> {
  const pool   = getPool()
  const id     = uid()
  const expiry = opts?.tokenExpiry ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  await pool.query(
    `INSERT INTO "ApprovalRequest" (id, "applicationId", token, "tokenExpiry", "tokenUsed", "sentAt")
     VALUES ($1, $2, $3, $4, $5, now())`,
    [id, applicationId, token, toUtcString(expiry), opts?.tokenUsed ?? false],
  )
  if (opts?.withDecision) {
    const decId = uid()
    await pool.query(
      `INSERT INTO "ApprovalDecision" (id, "approvalRequestId", decision, "decidedAt")
       VALUES ($1, $2, $3::"Decision", now())`,
      [decId, id, opts.withDecision],
    )
  }
  await pool.end()
  return { id, token }
}

export async function createEmployee(
  userId: string,
  applicationId: string,
  opts?: { firstName?: string; lastName?: string },
): Promise<CreatedEmployee> {
  const pool  = getPool()
  const empId = uid()
  const planId = uid()
  await pool.query(
    `INSERT INTO "Employee" (id, "userId", "applicationId", "firstName", "lastName", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, now(), now())`,
    [empId, userId, applicationId, opts?.firstName ?? 'Test', opts?.lastName ?? 'Employee'],
  )
  await pool.query(
    `INSERT INTO "OnboardingPlan" (id, "employeeId", "ndaSigned", "contractSigned", "policiesRead", "createdAt", "updatedAt")
     VALUES ($1, $2, false, false, false, now(), now())`,
    [planId, empId],
  )
  await pool.end()
  return { id: empId, planId }
}

// ── Query helpers ─────────────────────────────────────────────────────────────

export async function getApplicationStatus(applicationId: string): Promise<string | null> {
  const pool = getPool()
  const res  = await pool.query(`SELECT status FROM "Application" WHERE id = $1`, [applicationId])
  await pool.end()
  return res.rows[0]?.status ?? null
}

export async function getOnboardingPlan(employeeId: string) {
  const pool = getPool()
  const res  = await pool.query(
    `SELECT "ndaSigned", "contractSigned", "policiesRead" FROM "OnboardingPlan" WHERE "employeeId" = $1`,
    [employeeId],
  )
  await pool.end()
  return res.rows[0] ?? null
}

export async function updateApplicationStatus(applicationId: string, status: string): Promise<void> {
  const pool = getPool()
  await pool.query(
    `UPDATE "Application" SET status = $1::"ApplicationStatus", "updatedAt" = now() WHERE id = $2`,
    [status, applicationId],
  )
  await pool.end()
}

// ── Cleanup helpers ───────────────────────────────────────────────────────────

async function _cleanupApplication(pool: Pool, applicationId: string): Promise<void> {
  await pool.query(`DELETE FROM "AuditLog"     WHERE "entityId" = $1`, [applicationId])
  await pool.query(`DELETE FROM "EmailEvent"   WHERE "applicationId" = $1`, [applicationId])
  // Approval decision first (FK: decision → request)
  const reqs = await pool.query(`SELECT id FROM "ApprovalRequest" WHERE "applicationId" = $1`, [applicationId])
  for (const r of reqs.rows) {
    await pool.query(`DELETE FROM "ApprovalDecision" WHERE "approvalRequestId" = $1`, [r.id])
  }
  await pool.query(`DELETE FROM "ApprovalRequest"  WHERE "applicationId" = $1`, [applicationId])
  await pool.query(
    `DELETE FROM "ReviewSection" WHERE "reviewId" IN (SELECT id FROM "ApplicantReview" WHERE "applicationId" = $1)`,
    [applicationId],
  )
  await pool.query(`DELETE FROM "ApplicantReview"  WHERE "applicationId" = $1`, [applicationId])
  await pool.query(`DELETE FROM "ApplicationFile"  WHERE "applicationId" = $1`, [applicationId])
  await pool.query(`DELETE FROM "ApplicantVideo"   WHERE "applicationId" = $1`, [applicationId])
  await pool.query(
    `DELETE FROM "InterviewSurvey" WHERE "interviewEventId" IN (SELECT id FROM "InterviewEvent" WHERE "applicationId" = $1)`,
    [applicationId],
  )
  await pool.query(`DELETE FROM "InterviewEvent"   WHERE "applicationId" = $1`, [applicationId])
  await pool.query(`DELETE FROM "PerformiaTest"    WHERE "applicationId" = $1`, [applicationId])
  await pool.query(`DELETE FROM "CSWReport"        WHERE "applicationId" = $1`, [applicationId])
  await pool.query(`DELETE FROM "DriveFolder"      WHERE "applicationId" = $1`, [applicationId])
  await pool.query(`DELETE FROM "Application"      WHERE id = $1`, [applicationId])
}

export async function cleanupApplicationById(applicationId: string): Promise<void> {
  const pool = getPool()
  await _cleanupApplication(pool, applicationId)
  await pool.end()
}

/** Delete everything created for a set of user emails (FK-safe order). */
export async function cleanupByEmails(emails: string[]): Promise<void> {
  const pool = getPool()
  for (const email of emails) {
    const userRes = await pool.query(`SELECT id FROM "User" WHERE email = $1`, [email])
    if (!userRes.rows.length) continue
    const userId = userRes.rows[0].id as string

    // Applicant → Applications
    const appRes = await pool.query(`SELECT id FROM "Applicant" WHERE "userId" = $1`, [userId])
    if (appRes.rows.length) {
      const applicantId = appRes.rows[0].id as string
      const apps = await pool.query(`SELECT id FROM "Application" WHERE "applicantId" = $1`, [applicantId])
      for (const app of apps.rows) {
        await _cleanupApplication(pool, app.id as string)
      }
      await pool.query(`DELETE FROM "Applicant" WHERE id = $1`, [applicantId])
    }

    // Employee → OnboardingPlan → OnboardingTask
    const empRes = await pool.query(`SELECT id FROM "Employee" WHERE "userId" = $1`, [userId])
    if (empRes.rows.length) {
      const empId = empRes.rows[0].id as string
      await pool.query(
        `DELETE FROM "OnboardingTask" WHERE "planId" IN (SELECT id FROM "OnboardingPlan" WHERE "employeeId" = $1)`,
        [empId],
      )
      await pool.query(`DELETE FROM "OnboardingPlan" WHERE "employeeId" = $1`, [empId])
      await pool.query(`DELETE FROM "Employee"       WHERE id = $1`, [empId])
    }

    await pool.query(`DELETE FROM "AuditLog" WHERE "userId" = $1`, [userId])
    await pool.query(`DELETE FROM "User"     WHERE id = $1`, [userId])
  }
  await pool.end()
}
