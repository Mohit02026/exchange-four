import { PrismaClient } from '@/lib/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// Store pool + client on globalThis so they survive Vitest's per-file module
// isolation. With maxWorkers:1 + fileParallelism:false all integration files
// run in the same worker fork — the pool is created once, stays warm.
const g = globalThis as unknown as {
  _testPool: Pool | undefined
  _testClient: PrismaClient | undefined
}

function getPool(): Pool {
  if (!g._testPool) {
    g._testPool = new Pool({ connectionString: process.env.DATABASE_URL!, max: 3 })
  }
  return g._testPool
}

function getClient(): PrismaClient {
  if (!g._testClient) {
    const adapter = new PrismaPg(getPool())
    g._testClient = new PrismaClient({ adapter })
  }
  return g._testClient
}

export const testDb = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return (getClient() as unknown as Record<string | symbol, unknown>)[prop]
  },
})

export async function clearDatabase() {
  const tables = [
    'AuditLog', 'EmailEvent', 'SlackEvent',
    'InterviewSurvey', 'InterviewEvent', 'PerformiaTest', 'HatPack',
    'OffboardingChecklistItem', 'OffboardingCase',
    'CorrectionHandling', 'EthicsReport',
    'NewHireSurvey', 'DailyCheckin',
    'TrainingTask', 'TrainingPlan',
    'StatisticEntry', 'Statistic',
    'OnboardingTask', 'OnboardingPlan', 'DriveFolder',
    'Employee', 'ApprovalDecision', 'ApprovalRequest',
    'CSWReport', 'ReviewSection', 'ApplicantReview',
    'ApplicationFile', 'ApplicantVideo', 'Application',
    'Applicant', 'Note', 'User', 'Position', 'OrgBoardUnit',
  ]
  const list = tables.map(t => `"${t}"`).join(', ')
  // Raw pool.query() — bypasses Prisma adapter overhead, no sequence reset
  // (all IDs are UUID/cuid, RESTART IDENTITY is unnecessary and slow)
  await getPool().query(`TRUNCATE ${list} CASCADE`)
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
  const org = await testDb.orgBoardUnit.create({ data: { name: 'Operations', type: 'DEPARTMENT' } })
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

export async function seedEmployee(hrUserId: string, overrides: Record<string, unknown> = {}) {
  return testDb.employee.create({
    data: {
      firstName: 'Test',
      lastName: 'Employee',
      userId: hrUserId,
      ...overrides,
    },
  })
}

export async function seedApprovalRequest(applicationId: string) {
  const token = 'EX4-APPROVE-test-token-' + Date.now()
  const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  return testDb.approvalRequest.create({
    data: { applicationId, token, tokenExpiry: expiry },
  })
}
