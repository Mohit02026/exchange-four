// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { testDb, clearDatabase, seedHRUser, seedEmployee } from '../db-helpers'
import { NextRequest } from 'next/server'

vi.mock('next/headers', () => ({
  headers: vi.fn(() => ({ get: (_: string) => null })),
}))

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))

import { GET as getHatPacks, POST as postHatPack } from '@/app/api/training/hatpack/route'
import { GET as getPlan, POST as createPlan } from '@/app/api/training/[employeeId]/route'
import { POST as addTask } from '@/app/api/training/[employeeId]/task/route'
import { PATCH as patchTask } from '@/app/api/training/[employeeId]/task/[taskId]/route'
import { auth } from '@/lib/auth'

const mockAuth = auth as ReturnType<typeof vi.fn>

function makeEmpParams(employeeId: string) {
  return { params: Promise.resolve({ employeeId }) }
}
function makeTaskParams(employeeId: string, taskId: string) {
  return { params: Promise.resolve({ employeeId, taskId }) }
}
function makeReq(url: string, body?: Record<string, unknown>) {
  return new NextRequest(url, body
    ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    : { method: 'GET' })
}
function makePatch(url: string, body: Record<string, unknown>) {
  return new NextRequest(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
}

beforeEach(async () => {
  await clearDatabase()
  vi.clearAllMocks()
})

// ── Hat Packs ─────────────────────────────────────────────────────────────────

describe('GET /api/training/hatpack', () => {
  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await getHatPacks(makeReq('http://localhost:3001/api/training/hatpack'))
    expect(res.status).toBe(401)
  })

  it('returns 403 for non-HR role', async () => {
    const user = await seedHRUser()
    mockAuth.mockResolvedValue({ user: { id: user.id, role: 'APPLICANT' } })
    const res = await getHatPacks(makeReq('http://localhost:3001/api/training/hatpack'))
    expect(res.status).toBe(403)
  })

  it('returns empty packs list when none exist', async () => {
    const user = await seedHRUser()
    mockAuth.mockResolvedValue({ user: { id: user.id, role: 'HR' } })
    const res = await getHatPacks(makeReq('http://localhost:3001/api/training/hatpack'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.packs).toEqual([])
  })
})

describe('POST /api/training/hatpack', () => {
  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await postHatPack(makeReq('http://localhost:3001/api/training/hatpack', { postTitle: 'Ops', functions: ['Schedule'] }))
    expect(res.status).toBe(401)
  })

  it('creates a hat pack', async () => {
    const user = await seedHRUser()
    mockAuth.mockResolvedValue({ user: { id: user.id, role: 'HR' } })
    const res = await postHatPack(makeReq('http://localhost:3001/api/training/hatpack', {
      postTitle: 'Operations Coordinator',
      functions: ['Schedule management', 'Client liaison'],
    }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.pack.postTitle).toBe('Operations Coordinator')
    expect(body.pack.functions).toHaveLength(2)
  })

  it('returns 422 when postTitle is missing', async () => {
    const user = await seedHRUser()
    mockAuth.mockResolvedValue({ user: { id: user.id, role: 'HR' } })
    const res = await postHatPack(makeReq('http://localhost:3001/api/training/hatpack', { functions: ['fn'] }))
    expect(res.status).toBe(422)
  })
})

// ── Training Plan ─────────────────────────────────────────────────────────────

describe('GET /api/training/[employeeId]', () => {
  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await getPlan(makeReq('http://localhost:3001/api/training/abc'), makeEmpParams('abc'))
    expect(res.status).toBe(401)
  })

  it('returns null plan when none exists for employee', async () => {
    const user = await seedHRUser()
    const employee = await seedEmployee(user.id)
    mockAuth.mockResolvedValue({ user: { id: user.id, role: 'HR' } })
    const res = await getPlan(makeReq(`http://localhost:3001/api/training/${employee.id}`), makeEmpParams(employee.id))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.plan).toBeNull()
  })
})

describe('POST /api/training/[employeeId]', () => {
  it('creates a training plan for the employee', async () => {
    const user = await seedHRUser()
    const employee = await seedEmployee(user.id)
    mockAuth.mockResolvedValue({ user: { id: user.id, role: 'HR' } })
    const res = await createPlan(
      makeReq(`http://localhost:3001/api/training/${employee.id}`, { postTitle: 'Operations Coordinator' }),
      makeEmpParams(employee.id),
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.plan.postTitle).toBe('Operations Coordinator')
    expect(body.plan.employeeId).toBe(employee.id)
  })

  it('returns 422 when postTitle is missing', async () => {
    const user = await seedHRUser()
    const employee = await seedEmployee(user.id)
    mockAuth.mockResolvedValue({ user: { id: user.id, role: 'HR' } })
    const res = await createPlan(
      makeReq(`http://localhost:3001/api/training/${employee.id}`, {}),
      makeEmpParams(employee.id),
    )
    expect(res.status).toBe(422)
  })
})

// ── Training Tasks ────────────────────────────────────────────────────────────

describe('POST /api/training/[employeeId]/task', () => {
  it('returns 404 when no training plan exists', async () => {
    const user = await seedHRUser()
    const employee = await seedEmployee(user.id)
    mockAuth.mockResolvedValue({ user: { id: user.id, role: 'HR' } })
    const res = await addTask(
      makeReq(`http://localhost:3001/api/training/${employee.id}/task`, { functionName: 'Handle invoices' }),
      makeEmpParams(employee.id),
    )
    expect(res.status).toBe(404)
  })

  it('adds a task to an existing plan', async () => {
    const user = await seedHRUser()
    const employee = await seedEmployee(user.id)
    mockAuth.mockResolvedValue({ user: { id: user.id, role: 'HR' } })

    // Create plan first
    await createPlan(
      makeReq(`http://localhost:3001/api/training/${employee.id}`, { postTitle: 'Ops' }),
      makeEmpParams(employee.id),
    )

    const res = await addTask(
      makeReq(`http://localhost:3001/api/training/${employee.id}/task`, { functionName: 'Handle invoices', policyRef: 'OPS-01' }),
      makeEmpParams(employee.id),
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.task.functionName).toBe('Handle invoices')
    expect(body.task.status).toBe('IN_PROGRESS')
  })
})

describe('PATCH /api/training/[employeeId]/task/[taskId]', () => {
  it('updates task status to COMPLETED', async () => {
    const user = await seedHRUser()
    const employee = await seedEmployee(user.id)
    mockAuth.mockResolvedValue({ user: { id: user.id, role: 'HR' } })

    // Create plan + task
    await createPlan(
      makeReq(`http://localhost:3001/api/training/${employee.id}`, { postTitle: 'Ops' }),
      makeEmpParams(employee.id),
    )
    const taskRes = await addTask(
      makeReq(`http://localhost:3001/api/training/${employee.id}/task`, { functionName: 'Filing' }),
      makeEmpParams(employee.id),
    )
    const { task } = await taskRes.json()

    const res = await patchTask(
      makePatch(`http://localhost:3001/api/training/${employee.id}/task/${task.id}`, { status: 'PASSED' }),
      makeTaskParams(employee.id, task.id),
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.task.status).toBe('PASSED')
  })

  it('returns 422 for invalid status value', async () => {
    const user = await seedHRUser()
    const employee = await seedEmployee(user.id)
    mockAuth.mockResolvedValue({ user: { id: user.id, role: 'HR' } })

    await createPlan(
      makeReq(`http://localhost:3001/api/training/${employee.id}`, { postTitle: 'Ops' }),
      makeEmpParams(employee.id),
    )
    const taskRes = await addTask(
      makeReq(`http://localhost:3001/api/training/${employee.id}/task`, { functionName: 'Filing' }),
      makeEmpParams(employee.id),
    )
    const { task } = await taskRes.json()

    const res = await patchTask(
      makePatch(`http://localhost:3001/api/training/${employee.id}/task/${task.id}`, { status: 'INVALID_STATUS' }),
      makeTaskParams(employee.id, task.id),
    )
    expect(res.status).toBe(422)
  })
})
