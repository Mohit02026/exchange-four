// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { testDb, clearDatabase, seedHRUser, seedEmployee } from '../db-helpers'
import { NextRequest } from 'next/server'

vi.mock('next/headers', () => ({
  headers: vi.fn(() => ({ get: (_: string) => null })),
}))

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))

import { GET as getStats, POST as postStat } from '@/app/api/statistics/[employeeId]/route'
import { POST as postEntry } from '@/app/api/statistics/[employeeId]/entry/route'
import { GET as getAlerts } from '@/app/api/statistics/alerts/route'
import { auth } from '@/lib/auth'

const mockAuth = auth as ReturnType<typeof vi.fn>

function makeParams(employeeId: string) {
  return { params: Promise.resolve({ employeeId }) }
}

function makeReq(url: string, body?: Record<string, unknown>) {
  return new Request(url, body
    ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    : { method: 'GET' })
}

const validStat = {
  postTitle: 'Operations Coordinator',
  name: 'Invoices Processed',
  definition: 'Number of invoices processed per week',
  unit: 'invoices',
  frequency: 'WEEKLY',
  target: 50,
}

beforeEach(async () => {
  await clearDatabase()
  vi.clearAllMocks()
})

// ── GET /api/statistics/[employeeId] ──────────────────────────────────────────

describe('GET /api/statistics/[employeeId]', () => {
  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await getStats(makeReq('http://localhost:3001/api/statistics/abc'), makeParams('abc'))
    expect(res.status).toBe(401)
  })

  it('returns 403 for non-HR role', async () => {
    const user = await seedHRUser()
    mockAuth.mockResolvedValue({ user: { id: user.id, role: 'APPLICANT' } })
    const res = await getStats(makeReq('http://localhost:3001/api/statistics/abc'), makeParams('abc'))
    expect(res.status).toBe(403)
  })

  it('returns empty array when employee has no statistics', async () => {
    const user = await seedHRUser()
    const employee = await seedEmployee(user.id)
    mockAuth.mockResolvedValue({ user: { id: user.id, role: 'HR' } })

    const res = await getStats(makeReq(`http://localhost:3001/api/statistics/${employee.id}`), makeParams(employee.id))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    expect(body).toHaveLength(0)
  })

  it('returns statistics with their entries', async () => {
    const user = await seedHRUser()
    const employee = await seedEmployee(user.id)
    mockAuth.mockResolvedValue({ user: { id: user.id, role: 'HR' } })

    const stat = await testDb.statistic.create({
      data: { employeeId: employee.id, ...validStat },
    })
    await testDb.statisticEntry.create({
      data: { statisticId: stat.id, value: 42, period: '2026-W01', enteredById: user.id },
    })

    const res = await getStats(makeReq(`http://localhost:3001/api/statistics/${employee.id}`), makeParams(employee.id))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveLength(1)
    expect(body[0].name).toBe('Invoices Processed')
    expect(body[0].entries).toHaveLength(1)
    expect(body[0].entries[0].value).toBe(42)
  })
})

// ── POST /api/statistics/[employeeId] ─────────────────────────────────────────

describe('POST /api/statistics/[employeeId]', () => {
  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await postStat(makeReq('http://localhost:3001/api/statistics/abc', validStat), makeParams('abc'))
    expect(res.status).toBe(401)
  })

  it('returns 403 for non-HR role', async () => {
    const user = await seedHRUser()
    mockAuth.mockResolvedValue({ user: { id: user.id, role: 'APPLICANT' } })
    const res = await postStat(makeReq('http://localhost:3001/api/statistics/abc', validStat), makeParams('abc'))
    expect(res.status).toBe(403)
  })

  it('creates a statistic and returns 201', async () => {
    const user = await seedHRUser()
    const employee = await seedEmployee(user.id)
    mockAuth.mockResolvedValue({ user: { id: user.id, role: 'HR' } })

    const res = await postStat(
      makeReq(`http://localhost:3001/api/statistics/${employee.id}`, validStat),
      makeParams(employee.id),
    )
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.name).toBe('Invoices Processed')
    expect(body.unit).toBe('invoices')
    expect(body.frequency).toBe('WEEKLY')
    expect(body.target).toBe(50)
    expect(body.employeeId).toBe(employee.id)
  })

  it('returns 422 when required fields are missing', async () => {
    const user = await seedHRUser()
    const employee = await seedEmployee(user.id)
    mockAuth.mockResolvedValue({ user: { id: user.id, role: 'HR' } })

    const res = await postStat(
      makeReq(`http://localhost:3001/api/statistics/${employee.id}`, { name: 'Missing most fields' }),
      makeParams(employee.id),
    )
    expect(res.status).toBe(422)
  })

  it('returns 422 for invalid frequency value', async () => {
    const user = await seedHRUser()
    const employee = await seedEmployee(user.id)
    mockAuth.mockResolvedValue({ user: { id: user.id, role: 'HR' } })

    const res = await postStat(
      makeReq(`http://localhost:3001/api/statistics/${employee.id}`, { ...validStat, frequency: 'HOURLY' }),
      makeParams(employee.id),
    )
    expect(res.status).toBe(422)
  })
})

// ── POST /api/statistics/[employeeId]/entry ───────────────────────────────────

describe('POST /api/statistics/[employeeId]/entry', () => {
  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await postEntry(
      makeReq('http://localhost:3001/api/statistics/abc/entry', { statisticId: 'x', value: 10, period: '2026-W01' }),
      makeParams('abc'),
    )
    expect(res.status).toBe(401)
  })

  it('records an entry and returns 201', async () => {
    const user = await seedHRUser()
    const employee = await seedEmployee(user.id)
    mockAuth.mockResolvedValue({ user: { id: user.id, role: 'HR' } })

    const stat = await testDb.statistic.create({
      data: { employeeId: employee.id, ...validStat },
    })

    const res = await postEntry(
      makeReq(`http://localhost:3001/api/statistics/${employee.id}/entry`, {
        statisticId: stat.id,
        value: 55,
        period: '2026-W02',
      }),
      makeParams(employee.id),
    )
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.value).toBe(55)
    expect(body.period).toBe('2026-W02')
    expect(body.statisticId).toBe(stat.id)
  })

  it('returns 422 when statisticId is missing', async () => {
    const user = await seedHRUser()
    const employee = await seedEmployee(user.id)
    mockAuth.mockResolvedValue({ user: { id: user.id, role: 'HR' } })

    const res = await postEntry(
      makeReq(`http://localhost:3001/api/statistics/${employee.id}/entry`, { value: 10, period: '2026-W01' }),
      makeParams(employee.id),
    )
    expect(res.status).toBe(422)
  })
})

// ── GET /api/statistics/alerts ────────────────────────────────────────────────

describe('GET /api/statistics/alerts', () => {
  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await getAlerts()
    expect(res.status).toBe(401)
  })

  it('returns 403 for non-HR role', async () => {
    const user = await seedHRUser()
    mockAuth.mockResolvedValue({ user: { id: user.id, role: 'APPLICANT' } })
    const res = await getAlerts()
    expect(res.status).toBe(403)
  })

  it('returns alert shape with empty arrays when no stats are stale', async () => {
    const user = await seedHRUser()
    mockAuth.mockResolvedValue({ user: { id: user.id, role: 'HR' } })
    const res = await getAlerts()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body.missingStats)).toBe(true)
    expect(Array.isArray(body.staleStats)).toBe(true)
    expect(Array.isArray(body.declining)).toBe(true)
  })
})
