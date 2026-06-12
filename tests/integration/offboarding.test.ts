// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { testDb, clearDatabase, seedHRUser, seedEmployee } from '../db-helpers'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/integrations/email', () => ({
  sendOffboardingStarted: vi.fn(() => Promise.resolve()),
  sendOffboardingCeoApproval: vi.fn(() => Promise.resolve()),
}))

import { GET, POST } from '@/app/api/offboarding/route'
import { GET as getOne, PATCH } from '@/app/api/offboarding/[id]/route'
import { auth } from '@/lib/auth'

const mockAuth = auth as ReturnType<typeof vi.fn>

beforeEach(async () => {
  await clearDatabase()
  vi.clearAllMocks()
})

function postRequest(body: unknown) {
  return new NextRequest('http://localhost:3001/api/offboarding', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// ── GET /api/offboarding ──────────────────────────────────────────────────────

describe('GET /api/offboarding', () => {
  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns 403 for non-HR role', async () => {
    const user = await seedHRUser()
    mockAuth.mockResolvedValue({ user: { id: user.id, role: 'APPLICANT' } })
    const res = await GET()
    expect(res.status).toBe(403)
  })

  it('returns empty array when no active cases', async () => {
    const hrUser = await seedHRUser()
    mockAuth.mockResolvedValue({ user: { id: hrUser.id, role: 'HR' } })
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.cases).toEqual([])
  })
})

// ── POST /api/offboarding ─────────────────────────────────────────────────────

describe('POST /api/offboarding', () => {
  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await POST(postRequest({}))
    expect(res.status).toBe(401)
  })

  it('creates offboarding case with 19 default checklist items', async () => {
    const hrUser = await seedHRUser()
    const employee = await seedEmployee(hrUser.id)
    mockAuth.mockResolvedValue({ user: { id: hrUser.id, role: 'HR' } })

    const res = await POST(postRequest({ employeeId: employee.id, reason: 'VOLUNTARY' }))
    expect(res.status).toBe(201)

    const { case: offboardingCase } = await res.json()
    expect(offboardingCase.employeeId).toBe(employee.id)
    expect(offboardingCase.reason).toBe('VOLUNTARY')
    expect(offboardingCase.requiresCeoApproval).toBe(false)
    expect(offboardingCase.items).toHaveLength(19)
  })

  it('sets requiresCeoApproval=true and generates token for TERMINATION', async () => {
    const hrUser = await seedHRUser()
    const employee = await seedEmployee(hrUser.id)
    mockAuth.mockResolvedValue({ user: { id: hrUser.id, role: 'HR' } })

    const res = await POST(postRequest({ employeeId: employee.id, reason: 'TERMINATION' }))
    expect(res.status).toBe(201)

    const { case: offboardingCase } = await res.json()
    expect(offboardingCase.requiresCeoApproval).toBe(true)
    expect(offboardingCase.ceoApprovalToken).toMatch(/^EX4-OFFBOARD-/)
  })

  it('sets requiresCeoApproval=true for TRANSFER', async () => {
    const hrUser = await seedHRUser()
    const employee = await seedEmployee(hrUser.id)
    mockAuth.mockResolvedValue({ user: { id: hrUser.id, role: 'HR' } })

    const res = await POST(postRequest({ employeeId: employee.id, reason: 'TRANSFER' }))
    const { case: offboardingCase } = await res.json()
    expect(offboardingCase.requiresCeoApproval).toBe(true)
  })

  it('returns 409 if employee already has an offboarding case', async () => {
    const hrUser = await seedHRUser()
    const employee = await seedEmployee(hrUser.id)
    mockAuth.mockResolvedValue({ user: { id: hrUser.id, role: 'HR' } })

    await POST(postRequest({ employeeId: employee.id, reason: 'VOLUNTARY' }))
    const res2 = await POST(postRequest({ employeeId: employee.id, reason: 'VOLUNTARY' }))
    expect(res2.status).toBe(409)
  })

  it('returns 400 for invalid reason', async () => {
    const hrUser = await seedHRUser()
    const employee = await seedEmployee(hrUser.id)
    mockAuth.mockResolvedValue({ user: { id: hrUser.id, role: 'HR' } })

    const res = await POST(postRequest({ employeeId: employee.id, reason: 'FIRED' }))
    expect(res.status).toBe(400)
  })
})

// ── checklist item toggle ─────────────────────────────────────────────────────

describe('PATCH /api/offboarding/[id]/item/[itemId]', () => {
  it('marks a checklist item complete', async () => {
    const hrUser = await seedHRUser()
    const employee = await seedEmployee(hrUser.id)
    mockAuth.mockResolvedValue({ user: { id: hrUser.id, role: 'HR' } })

    const postRes = await POST(postRequest({ employeeId: employee.id, reason: 'VOLUNTARY' }))
    const { case: offboardingCase } = await postRes.json()
    const item = offboardingCase.items[0]

    const { PATCH: patchItem } = await import('@/app/api/offboarding/[id]/item/[itemId]/route')
    const req = new NextRequest(`http://localhost/api/offboarding/${offboardingCase.id}/item/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: true }),
    })
    const res = await patchItem(req, { params: Promise.resolve({ id: offboardingCase.id, itemId: item.id }) })
    expect(res.status).toBe(200)

    const updated = await testDb.offboardingChecklistItem.findUnique({ where: { id: item.id } })
    expect(updated!.completedAt).not.toBeNull()
  })
})
