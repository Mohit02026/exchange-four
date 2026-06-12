// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { testDb, clearDatabase, seedHRUser, seedEmployee } from '../db-helpers'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/integrations/email', () => ({
  sendCorrectionFiled: vi.fn(() => Promise.resolve()),
  sendCorrectionExecutiveApproval: vi.fn(() => Promise.resolve()),
}))

import { GET, POST } from '@/app/api/corrections/route'
import { GET as getOne, PATCH } from '@/app/api/corrections/[id]/route'
import { auth } from '@/lib/auth'

const mockAuth = auth as ReturnType<typeof vi.fn>

beforeEach(async () => {
  await clearDatabase()
  vi.clearAllMocks()
})

function makeRequest(body: unknown, method = 'POST') {
  return new NextRequest('http://localhost:3001/api/corrections', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// ── GET /api/corrections ──────────────────────────────────────────────────────

describe('GET /api/corrections', () => {
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

  it('returns empty array when no corrections exist', async () => {
    const hrUser = await seedHRUser()
    mockAuth.mockResolvedValue({ user: { id: hrUser.id, role: 'HR' } })
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.corrections).toEqual([])
  })
})

// ── POST /api/corrections ─────────────────────────────────────────────────────

describe('POST /api/corrections', () => {
  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(401)
  })

  it('returns 400 when required fields are missing', async () => {
    const hrUser = await seedHRUser()
    mockAuth.mockResolvedValue({ user: { id: hrUser.id, role: 'HR' } })
    const res = await POST(makeRequest({ employeeId: 'x' }))
    expect(res.status).toBe(400)
  })

  it('creates a correction record and returns 201', async () => {
    const hrUser = await seedHRUser()
    const employee = await seedEmployee(hrUser.id)
    mockAuth.mockResolvedValue({ user: { id: hrUser.id, role: 'HR' } })

    const res = await POST(makeRequest({
      employeeId: employee.id,
      incident: 'Late three times in a week',
      correctionRequested: 'Improve punctuality',
      severity: 'MINOR',
    }))

    expect(res.status).toBe(201)
    const { correction } = await res.json()
    expect(correction.employeeId).toBe(employee.id)
    expect(correction.severity).toBe('MINOR')
    expect(correction.requiresExecutiveApproval).toBe(false)
  })

  it('sets requiresExecutiveApproval=true for SUSPENSION action', async () => {
    const hrUser = await seedHRUser()
    const employee = await seedEmployee(hrUser.id)
    mockAuth.mockResolvedValue({ user: { id: hrUser.id, role: 'HR' } })

    const res = await POST(makeRequest({
      employeeId: employee.id,
      incident: 'Serious misconduct',
      correctionRequested: 'Suspension pending review',
      severity: 'CRITICAL',
      action: 'SUSPENSION',
    }))

    expect(res.status).toBe(201)
    const { correction } = await res.json()
    expect(correction.requiresExecutiveApproval).toBe(true)
    expect(correction.executiveToken).toMatch(/^EX4-CORRECTION-/)
  })

  it('returns 400 for invalid severity value', async () => {
    const hrUser = await seedHRUser()
    const employee = await seedEmployee(hrUser.id)
    mockAuth.mockResolvedValue({ user: { id: hrUser.id, role: 'HR' } })

    const res = await POST(makeRequest({
      employeeId: employee.id,
      incident: 'Some incident',
      correctionRequested: 'Fix it',
      severity: 'EXTREME', // invalid
    }))

    expect(res.status).toBe(400)
  })
})

// ── PATCH /api/corrections/[id] ───────────────────────────────────────────────

describe('PATCH /api/corrections/[id]', () => {
  it('returns 404 for non-existent correction', async () => {
    const hrUser = await seedHRUser()
    mockAuth.mockResolvedValue({ user: { id: hrUser.id, role: 'HR' } })

    const req = new NextRequest('http://localhost:3001/api/corrections/nonexistent', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'RESOLVED' }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'nonexistent' }) })
    expect(res.status).toBe(404)
  })

  it('updates correction status', async () => {
    const hrUser = await seedHRUser()
    const employee = await seedEmployee(hrUser.id)
    mockAuth.mockResolvedValue({ user: { id: hrUser.id, role: 'HR' } })

    // Create via service directly
    const correction = await testDb.correctionHandling.create({
      data: {
        employeeId: employee.id,
        submittedById: hrUser.id,
        incident: 'Test incident',
        correctionRequested: 'Test correction',
        severity: 'MINOR',
      },
    })

    const req = new NextRequest(`http://localhost:3001/api/corrections/${correction.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'RESOLVED', resolution: 'Issue addressed.' }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: correction.id }) })
    expect(res.status).toBe(200)

    const updated = await testDb.correctionHandling.findUnique({ where: { id: correction.id } })
    expect(updated!.status).toBe('RESOLVED')
    expect(updated!.resolution).toBe('Issue addressed.')
  })
})
