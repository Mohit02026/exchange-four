// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { testDb, clearDatabase, seedHRUser, seedEmployee, seedApplicantUser, seedApplication } from '../db-helpers'
import { NextRequest } from 'next/server'

vi.mock('next/headers', () => ({
  headers: vi.fn(() => ({ get: (_: string) => null })),
}))

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))

import { GET as getEmployee } from '@/app/api/employees/[id]/route'
import { GET as getApplicantProfile } from '@/app/api/applicants/[id]/profile/route'
import { auth } from '@/lib/auth'

const mockAuth = auth as ReturnType<typeof vi.fn>

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

beforeEach(async () => {
  await clearDatabase()
  vi.clearAllMocks()
})

// ── GET /api/employees/[id] ───────────────────────────────────────────────────

describe('GET /api/employees/[id]', () => {
  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await getEmployee(new NextRequest('http://localhost:3001/api/employees/abc'), makeParams('abc'))
    expect(res.status).toBe(401)
  })

  it('returns 403 for non-HR role', async () => {
    const user = await seedHRUser()
    mockAuth.mockResolvedValue({ user: { id: user.id, role: 'APPLICANT' } })
    const res = await getEmployee(new NextRequest('http://localhost:3001/api/employees/abc'), makeParams('abc'))
    expect(res.status).toBe(403)
  })

  it('returns 404 for non-existent employee', async () => {
    const user = await seedHRUser()
    mockAuth.mockResolvedValue({ user: { id: user.id, role: 'HR' } })
    const res = await getEmployee(new NextRequest('http://localhost:3001/api/employees/nonexistent'), makeParams('nonexistent'))
    expect(res.status).toBe(404)
  })

  it('returns employee with nested relations', async () => {
    const user = await seedHRUser()
    const employee = await seedEmployee(user.id)
    mockAuth.mockResolvedValue({ user: { id: user.id, role: 'HR' } })

    const res = await getEmployee(
      new NextRequest(`http://localhost:3001/api/employees/${employee.id}`),
      makeParams(employee.id),
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.employee.id).toBe(employee.id)
    expect(body.employee.firstName).toBe('Test')
    expect(body.employee.lastName).toBe('Employee')
    expect(Array.isArray(body.auditLogs)).toBe(true)
    // application is null because employee was seeded without one
    expect(body.application).toBeNull()
  })

  it('returns employee with onboardingPlan when plan exists', async () => {
    const user = await seedHRUser()
    const employee = await seedEmployee(user.id)
    mockAuth.mockResolvedValue({ user: { id: user.id, role: 'HR' } })

    await testDb.onboardingPlan.create({ data: { employeeId: employee.id } })

    const res = await getEmployee(
      new NextRequest(`http://localhost:3001/api/employees/${employee.id}`),
      makeParams(employee.id),
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.employee.onboardingPlan).not.toBeNull()
    expect(Array.isArray(body.employee.onboardingPlan.tasks)).toBe(true)
  })

  it('returns employee with statistics when assigned', async () => {
    const user = await seedHRUser()
    const employee = await seedEmployee(user.id)
    mockAuth.mockResolvedValue({ user: { id: user.id, role: 'HR' } })

    await testDb.statistic.create({
      data: {
        employeeId: employee.id,
        postTitle: 'Ops',
        name: 'Invoices',
        definition: 'Count of invoices',
        unit: 'count',
        frequency: 'WEEKLY',
      },
    })

    const res = await getEmployee(
      new NextRequest(`http://localhost:3001/api/employees/${employee.id}`),
      makeParams(employee.id),
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.employee.statistics).toHaveLength(1)
    expect(body.employee.statistics[0].name).toBe('Invoices')
  })
})

// ── GET /api/applicants/[id]/profile ─────────────────────────────────────────

describe('GET /api/applicants/[id]/profile', () => {
  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await getApplicantProfile(
      new NextRequest('http://localhost:3001/api/applicants/abc/profile'),
      makeParams('abc'),
    )
    expect(res.status).toBe(401)
  })

  it('returns 403 for non-HR role', async () => {
    const user = await seedHRUser()
    mockAuth.mockResolvedValue({ user: { id: user.id, role: 'APPLICANT' } })
    const res = await getApplicantProfile(
      new NextRequest('http://localhost:3001/api/applicants/abc/profile'),
      makeParams('abc'),
    )
    expect(res.status).toBe(403)
  })

  it('returns 404 for non-existent application', async () => {
    const user = await seedHRUser()
    mockAuth.mockResolvedValue({ user: { id: user.id, role: 'HR' } })
    const res = await getApplicantProfile(
      new NextRequest('http://localhost:3001/api/applicants/nonexistent/profile'),
      makeParams('nonexistent'),
    )
    expect(res.status).toBe(404)
  })

  it('returns application with applicant and audit logs', async () => {
    const hrUser = await seedHRUser()
    const applicantUser = await seedApplicantUser()
    // seedApplicantUser creates applicant record
    const applicant = await testDb.applicant.findUnique({ where: { userId: applicantUser.id } })
    const application = await seedApplication(applicant!.id)
    mockAuth.mockResolvedValue({ user: { id: hrUser.id, role: 'HR' } })

    const res = await getApplicantProfile(
      new NextRequest(`http://localhost:3001/api/applicants/${application.id}/profile`),
      makeParams(application.id),
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.application.id).toBe(application.id)
    expect(body.application.applicant).toBeDefined()
    expect(Array.isArray(body.auditLogs)).toBe(true)
    expect(Array.isArray(body.application.files)).toBe(true)
  })
})
