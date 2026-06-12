// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { testDb, clearDatabase, seedHRUser, seedEmployee } from '../db-helpers'
import { NextRequest } from 'next/server'

vi.mock('next/headers', () => ({
  headers: vi.fn(() => ({ get: (_: string) => null })),
}))

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))

import { GET as getReports, POST as postReport } from '@/app/api/ethics/route'
import { GET as getReport, PATCH as patchReport } from '@/app/api/ethics/[id]/route'
import { auth } from '@/lib/auth'

const mockAuth = auth as ReturnType<typeof vi.fn>

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

function makePostRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3001/api/ethics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makePatchRequest(id: string, body: Record<string, unknown>) {
  return new NextRequest(`http://localhost:3001/api/ethics/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const validReport = {
  subjectType: 'EMPLOYEE',
  category: 'Misconduct',
  description: 'Detailed description of the incident that occurred.',
  severity: 'MEDIUM',
  isSensitive: false,
}

beforeEach(async () => {
  await clearDatabase()
  vi.clearAllMocks()
})

describe('GET /api/ethics', () => {
  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await getReports()
    expect(res.status).toBe(401)
  })

  it('returns 403 for non-HR role', async () => {
    const user = await seedHRUser()
    mockAuth.mockResolvedValue({ user: { id: user.id, role: 'APPLICANT' } })
    const res = await getReports()
    expect(res.status).toBe(403)
  })

  it('returns empty array when no reports exist', async () => {
    const user = await seedHRUser()
    mockAuth.mockResolvedValue({ user: { id: user.id, role: 'HR' } })
    const res = await getReports()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    expect(body).toHaveLength(0)
  })

  it('returns reports for HR user without ethicsAccess (excludes SENSITIVE)', async () => {
    const user = await seedHRUser()
    mockAuth.mockResolvedValue({ user: { id: user.id, role: 'HR' } })

    // Create a non-sensitive report
    await testDb.ethicsReport.create({
      data: {
        reporterId: user.id,
        subjectType: 'EMPLOYEE',
        category: 'Misconduct',
        description: 'A normal report',
        severity: 'LOW',
        isSensitive: false,
      },
    })
    // Create a sensitive report
    await testDb.ethicsReport.create({
      data: {
        reporterId: user.id,
        subjectType: 'EMPLOYEE',
        category: 'Sensitive issue',
        description: 'A sensitive report',
        severity: 'SENSITIVE',
        isSensitive: true,
      },
    })

    const res = await getReports()
    const body = await res.json()
    expect(body.length).toBe(1)
    expect(body[0].isSensitive).toBe(false)
  })
})

describe('POST /api/ethics', () => {
  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await postReport(makePostRequest(validReport))
    expect(res.status).toBe(401)
  })

  it('returns 403 for non-HR role', async () => {
    const user = await seedHRUser()
    mockAuth.mockResolvedValue({ user: { id: user.id, role: 'APPLICANT' } })
    const res = await postReport(makePostRequest(validReport))
    expect(res.status).toBe(403)
  })

  it('creates a report and returns 201', async () => {
    const user = await seedHRUser()
    mockAuth.mockResolvedValue({ user: { id: user.id, role: 'HR' } })
    const res = await postReport(makePostRequest(validReport))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.category).toBe('Misconduct')
    expect(body.severity).toBe('MEDIUM')
    expect(body.isSensitive).toBe(false)
  })

  it('forces isSensitive=true when severity is SENSITIVE', async () => {
    const user = await seedHRUser()
    mockAuth.mockResolvedValue({ user: { id: user.id, role: 'HR' } })
    const res = await postReport(makePostRequest({ ...validReport, severity: 'SENSITIVE', isSensitive: false }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.isSensitive).toBe(true)
  })

  it('returns 400 when description is too short', async () => {
    const user = await seedHRUser()
    mockAuth.mockResolvedValue({ user: { id: user.id, role: 'HR' } })
    const res = await postReport(makePostRequest({ ...validReport, description: 'short' }))
    expect(res.status).toBe(400)
  })
})

describe('GET /api/ethics/[id]', () => {
  it('returns 404 for non-existent report', async () => {
    const user = await seedHRUser()
    mockAuth.mockResolvedValue({ user: { id: user.id, role: 'HR' } })
    const res = await getReport(new NextRequest('http://localhost:3001/api/ethics/nonexistent'), makeParams('nonexistent'))
    expect(res.status).toBe(404)
  })

  it('returns the report for HR with ethicsAccess on sensitive report', async () => {
    const user = await seedHRUser()
    await testDb.user.update({ where: { id: user.id }, data: { ethicsAccess: true } })
    mockAuth.mockResolvedValue({ user: { id: user.id, role: 'HR' } })

    const report = await testDb.ethicsReport.create({
      data: {
        reporterId: user.id,
        subjectType: 'EMPLOYEE',
        category: 'Sensitive',
        description: 'Sensitive details here',
        severity: 'SENSITIVE',
        isSensitive: true,
      },
    })

    const res = await getReport(new NextRequest(`http://localhost:3001/api/ethics/${report.id}`), makeParams(report.id))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.id).toBe(report.id)
  })
})

describe('PATCH /api/ethics/[id]', () => {
  it('updates report status', async () => {
    const user = await seedHRUser()
    await testDb.user.update({ where: { id: user.id }, data: { ethicsAccess: true } })
    mockAuth.mockResolvedValue({ user: { id: user.id, role: 'HR' } })

    const report = await testDb.ethicsReport.create({
      data: {
        reporterId: user.id,
        subjectType: 'EMPLOYEE',
        category: 'Misconduct',
        description: 'Report description here',
        severity: 'LOW',
        isSensitive: false,
      },
    })

    const res = await patchReport(makePatchRequest(report.id, { status: 'UNDER_INVESTIGATION' }), makeParams(report.id))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('UNDER_INVESTIGATION')
  })

  it('returns 404 for non-existent report', async () => {
    const user = await seedHRUser()
    await testDb.user.update({ where: { id: user.id }, data: { ethicsAccess: true } })
    mockAuth.mockResolvedValue({ user: { id: user.id, role: 'HR' } })
    const res = await patchReport(makePatchRequest('nonexistent', { status: 'CLOSED' }), makeParams('nonexistent'))
    expect(res.status).toBe(404)
  })
})
