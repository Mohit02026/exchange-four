// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { testDb, clearDatabase, seedHRUser, seedEmployee } from '../db-helpers'
import { NextRequest } from 'next/server'

vi.mock('next/headers', () => ({
  headers: vi.fn(() => ({ get: (_: string) => null })),
}))

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))

vi.mock('@/lib/integrations/email', () => ({
  sendSurveyHandlingAlert: vi.fn().mockResolvedValue(undefined),
  sendCheckinSummary: vi.fn().mockResolvedValue(undefined),
}))

import { GET as getSurveys, POST as postSurvey } from '@/app/api/onboarding/survey/route'
import { POST as postCheckin } from '@/app/api/onboarding/checkin/route'
import { auth } from '@/lib/auth'

const mockAuth = auth as ReturnType<typeof vi.fn>

function makePost(url: string, body: Record<string, unknown>) {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const validNewHire = {
  type: 'NEW_HIRE',
  weekNumber: 1,
  q1: 'Making progress on my tasks',
  q2: 'Nothing feels unclear so far',
  q3: 'No barriers at this time',
  q4: 'No one is making work difficult',
  q5: 'Good communication with team',
  q6: 'Feeling confident in my role',
  q7: 'Optional extra note',
  q8: 'Another optional note',
}

const validSenior = {
  type: 'SENIOR',
  weekNumber: 3,
  q1: 'Completed training modules',
  q2: 'Feeling independent now',
  q3: 'No barriers this week',
  q4: 'No conflicts with anyone',
  q5: 'Contributing to team output',
  q6: 'Ready to take more responsibility',
  q7: 'Enjoying the work culture',
  ratingScore: 8,
}

const validCheckin = {
  completedToday: 'Processed 10 invoices',
  studiedToday: 'Read OPS-01 policy document',
  productProduced: 'Invoice batch report',
  whatWasUnclear: 'Nothing unclear today',
  anyBlocks: 'No blockers',
  needsHelp: 'No help needed',
}

beforeEach(async () => {
  await clearDatabase()
  vi.clearAllMocks()
})

// ── POST /api/onboarding/survey ───────────────────────────────────────────────

describe('POST /api/onboarding/survey', () => {
  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await postSurvey(makePost('http://localhost:3001/api/onboarding/survey', validNewHire))
    expect(res.status).toBe(401)
  })

  it('returns 403 when user has no employee record', async () => {
    const user = await seedHRUser()
    mockAuth.mockResolvedValue({ user: { id: user.id, role: 'HR' } })
    // HR user has no Employee row linked to their userId
    const res = await postSurvey(makePost('http://localhost:3001/api/onboarding/survey', validNewHire))
    expect(res.status).toBe(403)
  })

  it('creates a NEW_HIRE survey and returns 201', async () => {
    const user = await seedHRUser()
    const employee = await seedEmployee(user.id)
    mockAuth.mockResolvedValue({ user: { id: user.id, role: 'APPLICANT' } })

    // Link employee to user
    await testDb.employee.update({ where: { id: employee.id }, data: { userId: user.id } })

    const res = await postSurvey(makePost('http://localhost:3001/api/onboarding/survey', validNewHire))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.type).toBe('NEW_HIRE')
    expect(body.weekNumber).toBe(1)
    expect(body.employeeId).toBe(employee.id)
    expect(typeof body.handlingNeeded).toBe('boolean')
  })

  it('creates a SENIOR survey and returns 201', async () => {
    const user = await seedHRUser()
    const employee = await seedEmployee(user.id)
    mockAuth.mockResolvedValue({ user: { id: user.id, role: 'APPLICANT' } })
    await testDb.employee.update({ where: { id: employee.id }, data: { userId: user.id } })

    const res = await postSurvey(makePost('http://localhost:3001/api/onboarding/survey', validSenior))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.type).toBe('SENIOR')
    expect(body.ratingScore).toBe(8)
  })

  it('returns 400 when SENIOR survey is missing ratingScore', async () => {
    const user = await seedHRUser()
    const employee = await seedEmployee(user.id)
    mockAuth.mockResolvedValue({ user: { id: user.id, role: 'APPLICANT' } })
    await testDb.employee.update({ where: { id: employee.id }, data: { userId: user.id } })

    const { ratingScore: _, ...noScore } = validSenior
    const res = await postSurvey(makePost('http://localhost:3001/api/onboarding/survey', noScore))
    expect(res.status).toBe(400)
  })

  it('returns 400 when required fields are missing', async () => {
    const user = await seedHRUser()
    const employee = await seedEmployee(user.id)
    mockAuth.mockResolvedValue({ user: { id: user.id, role: 'APPLICANT' } })
    await testDb.employee.update({ where: { id: employee.id }, data: { userId: user.id } })

    const res = await postSurvey(makePost('http://localhost:3001/api/onboarding/survey', { type: 'NEW_HIRE' }))
    expect(res.status).toBe(400)
  })

  it('sets handlingNeeded=true when q3 or q4 contains substantive content', async () => {
    const user = await seedHRUser()
    const employee = await seedEmployee(user.id)
    mockAuth.mockResolvedValue({ user: { id: user.id, role: 'APPLICANT' } })
    await testDb.employee.update({ where: { id: employee.id }, data: { userId: user.id } })

    const res = await postSurvey(makePost('http://localhost:3001/api/onboarding/survey', {
      ...validNewHire,
      q3: 'My manager keeps interrupting my work and creating confusion about priorities',
      q4: 'No',
    }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.handlingNeeded).toBe(true)
  })
})

// ── GET /api/onboarding/survey ────────────────────────────────────────────────

describe('GET /api/onboarding/survey', () => {
  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await getSurveys(new NextRequest('http://localhost:3001/api/onboarding/survey?employeeId=abc'))
    expect(res.status).toBe(401)
  })

  it('returns 403 for non-HR role', async () => {
    const user = await seedHRUser()
    mockAuth.mockResolvedValue({ user: { id: user.id, role: 'APPLICANT' } })
    const res = await getSurveys(new NextRequest('http://localhost:3001/api/onboarding/survey?employeeId=abc'))
    expect(res.status).toBe(403)
  })

  it('returns 400 when employeeId param is missing', async () => {
    const user = await seedHRUser()
    mockAuth.mockResolvedValue({ user: { id: user.id, role: 'HR' } })
    const res = await getSurveys(new NextRequest('http://localhost:3001/api/onboarding/survey'))
    expect(res.status).toBe(400)
  })

  it('returns empty array when employee has no surveys', async () => {
    const user = await seedHRUser()
    const employee = await seedEmployee(user.id)
    mockAuth.mockResolvedValue({ user: { id: user.id, role: 'HR' } })

    const res = await getSurveys(
      new NextRequest(`http://localhost:3001/api/onboarding/survey?employeeId=${employee.id}`)
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    expect(body).toHaveLength(0)
  })

  it('returns surveys for the employee ordered by weekNumber', async () => {
    const user = await seedHRUser()
    const employee = await seedEmployee(user.id)
    mockAuth.mockResolvedValue({ user: { id: user.id, role: 'HR' } })

    await testDb.newHireSurvey.create({
      data: { employeeId: employee.id, type: 'NEW_HIRE', weekNumber: 2, q1: 'a', q2: 'b', q3: 'c', q4: 'd', q5: 'e', q6: 'f' },
    })
    await testDb.newHireSurvey.create({
      data: { employeeId: employee.id, type: 'NEW_HIRE', weekNumber: 1, q1: 'a', q2: 'b', q3: 'c', q4: 'd', q5: 'e', q6: 'f' },
    })

    const res = await getSurveys(
      new NextRequest(`http://localhost:3001/api/onboarding/survey?employeeId=${employee.id}`)
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveLength(2)
    expect(body[0].weekNumber).toBe(1)
    expect(body[1].weekNumber).toBe(2)
  })
})

// ── POST /api/onboarding/checkin ──────────────────────────────────────────────

describe('POST /api/onboarding/checkin', () => {
  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await postCheckin(makePost('http://localhost:3001/api/onboarding/checkin', validCheckin))
    expect(res.status).toBe(401)
  })

  it('returns 404 when user has no employee record', async () => {
    const user = await seedHRUser()
    mockAuth.mockResolvedValue({ user: { id: user.id, role: 'HR' } })
    // seedHRUser creates a User but no Employee row with onboardingPlan
    const res = await postCheckin(makePost('http://localhost:3001/api/onboarding/checkin', validCheckin))
    expect(res.status).toBe(404)
  })

  it('creates a daily check-in and returns 201', async () => {
    const user = await seedHRUser()
    const employee = await seedEmployee(user.id)
    // checkin service calls getEmployeeByUserId which needs onboardingPlan
    await testDb.onboardingPlan.create({ data: { employeeId: employee.id } })
    mockAuth.mockResolvedValue({ user: { id: user.id, role: 'APPLICANT' } })

    const res = await postCheckin(makePost('http://localhost:3001/api/onboarding/checkin', validCheckin))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.completedToday).toBe('Processed 10 invoices')
    expect(body.employeeId).toBe(employee.id)
  })

  it('returns 400 when required fields are missing', async () => {
    const user = await seedHRUser()
    const employee = await seedEmployee(user.id)
    await testDb.onboardingPlan.create({ data: { employeeId: employee.id } })
    mockAuth.mockResolvedValue({ user: { id: user.id, role: 'APPLICANT' } })

    const res = await postCheckin(makePost('http://localhost:3001/api/onboarding/checkin', { completedToday: 'only this' }))
    expect(res.status).toBe(400)
  })
})
