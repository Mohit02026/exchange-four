import { PrismaClient } from '@/lib/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

// Dedicated test client — created lazily on first access so
// DATABASE_URL is always read after .env.test has been loaded
let _client: PrismaClient | null = null

export function createTestDb() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
  return new PrismaClient({ adapter })
}

export const testDb = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (!_client) _client = createTestDb()
    return (_client as unknown as Record<string | symbol, unknown>)[prop]
  },
})

// Delete all rows in FK-safe dependency order.
// Uses DELETE (row locks) instead of TRUNCATE (table locks) to avoid
// deadlocks against the app's lib/db connection pool.
export async function clearDatabase() {
  const tables = [
    '"AuditLog"', '"EmailEvent"', '"SlackEvent"',
    '"InterviewSurvey"', '"InterviewEvent"', '"PerformiaTest"',
    '"OnboardingTask"', '"OnboardingPlan"', '"DriveFolder"',
    '"Employee"', '"ApprovalDecision"', '"ApprovalRequest"',
    '"CSWReport"', '"ReviewSection"', '"ApplicantReview"',
    '"ApplicationFile"', '"ApplicantVideo"', '"Application"',
    '"Applicant"', '"Note"', '"User"', '"Position"', '"OrgBoardUnit"',
  ]
  for (const table of tables) {
    await testDb.$executeRawUnsafe(`DELETE FROM ${table}`)
  }
}

// ── Seed helpers ─────────────────────────────────────────────────────────────

import bcrypt from 'bcryptjs'

export async function seedHRUser() {
  return testDb.user.create({
    data: {
      email: 'nicola@exchangefour.com',
      password: await bcrypt.hash('test1234', 10),
      name: 'Nicola Test',
      role: 'HR',
    },
  })
}

export async function seedApplicantUser(email = 'applicant@example.com') {
  return testDb.user.create({
    data: {
      email,
      password: await bcrypt.hash('password123', 10),
      name: 'Test Applicant',
      role: 'APPLICANT',
      applicant: {
        create: {
          firstName: 'Test',
          lastName: 'Applicant',
          correspondenceEmail: email,
        },
      },
    },
    include: { applicant: true },
  })
}

export async function seedPosition(title = 'Operations Coordinator') {
  const org = await testDb.orgBoardUnit.create({ data: { name: 'Operations' } })
  return testDb.position.create({
    data: { title, orgBoardUnitId: org.id, isOpen: true, description: 'Test position' },
  })
}

let _refCounter = 0
export async function seedApplication(applicantId: string, positionId?: string) {
  _refCounter++
  const ref = `EF-HR-APP-${new Date().getFullYear()}-${String(_refCounter).padStart(6, '0')}`
  return testDb.application.create({
    data: {
      reference: ref,
      applicantId,
      positionId: positionId ?? null,
      isGeneralApplication: !positionId,
      bio: 'Test bio',
      skills: 'Test skills',
      hobbies: 'Test hobbies',
      careerGoals: 'Test goals',
      whyExchangeFour: 'Test why',
      status: 'SUBMITTED',
      files: {
        create: [
          { type: 'CV', fileName: 'cv.pdf', fileUrl: '/uploads/test/cv.pdf' },
          { type: 'PHOTO', fileName: 'photo.jpg', fileUrl: '/uploads/test/photo.jpg' },
        ],
      },
    },
    include: { applicant: true },
  })
}

export async function seedApprovalRequest(applicationId: string) {
  const token = 'EX4-APPROVE-test-token-' + Date.now()
  const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  return testDb.approvalRequest.create({
    data: { applicationId, token, tokenExpiry: expiry },
  })
}
