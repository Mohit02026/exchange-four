// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { testDb, clearDatabase, seedApplicantUser, seedApplication } from '../db-helpers'

// next/headers requires a Next.js request scope — mock it for unit-level handler testing
vi.mock('next/headers', () => ({
  headers: vi.fn(() => ({ get: (_: string) => null })),
}))

import { GET, POST } from '@/app/api/onboarding/[employeeId]/acknowledge/route'
import { NextRequest } from 'next/server'

function makeParams(employeeId: string) {
  return { params: Promise.resolve({ employeeId }) }
}

function makeGetRequest(employeeId: string) {
  return new NextRequest(`http://localhost:3001/api/onboarding/${employeeId}/acknowledge`)
}

function makePostRequest(employeeId: string, body: Record<string, unknown>) {
  return new NextRequest(`http://localhost:3001/api/onboarding/${employeeId}/acknowledge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

async function seedEmployee() {
  const user = await seedApplicantUser('employee@example.com')
  const app = await seedApplication(user.applicant!.id)

  const employee = await testDb.employee.create({
    data: {
      userId: user.id,
      firstName: 'Test',
      lastName: 'Employee',
      startDate: new Date(),
      applicationId: app.id,
      onboardingPlan: {
        create: {
          ndaSigned: false,
          contractSigned: false,
          policiesRead: false,
        },
      },
    },
    include: { onboardingPlan: true },
  })

  return employee
}

beforeEach(async () => {
  await clearDatabase()
})

describe('GET /api/onboarding/[employeeId]/acknowledge', () => {
  it('returns employee data and onboarding plan flags', async () => {
    const employee = await seedEmployee()

    const res = await GET(makeGetRequest(employee.id), makeParams(employee.id))
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.employee.id).toBe(employee.id)
    expect(body.employee.onboardingPlan.ndaSigned).toBe(false)
  })

  it('returns 404 for a non-existent employee ID', async () => {
    const res = await GET(makeGetRequest('nonexistent-id'), makeParams('nonexistent-id'))
    expect(res.status).toBe(404)
  })
})

describe('POST /api/onboarding/[employeeId]/acknowledge', () => {
  it('sets ndaSigned to true', async () => {
    const employee = await seedEmployee()

    const res = await POST(
      makePostRequest(employee.id, { ndaSigned: true }),
      makeParams(employee.id),
    )
    expect(res.status).toBe(200)

    const plan = await testDb.onboardingPlan.findUnique({ where: { employeeId: employee.id } })
    expect(plan!.ndaSigned).toBe(true)
  })

  it('sets all three flags when all are submitted as true', async () => {
    const employee = await seedEmployee()

    await POST(
      makePostRequest(employee.id, { ndaSigned: true, contractSigned: true, policiesRead: true }),
      makeParams(employee.id),
    )

    const plan = await testDb.onboardingPlan.findUnique({ where: { employeeId: employee.id } })
    expect(plan!.ndaSigned).toBe(true)
    expect(plan!.contractSigned).toBe(true)
    expect(plan!.policiesRead).toBe(true)
  })

  it('cannot retract a flag — sending false has no effect', async () => {
    const employee = await seedEmployee()

    // First, set the flag to true
    await POST(makePostRequest(employee.id, { ndaSigned: true }), makeParams(employee.id))

    // Now try to retract it
    await POST(makePostRequest(employee.id, { ndaSigned: false }), makeParams(employee.id))

    const plan = await testDb.onboardingPlan.findUnique({ where: { employeeId: employee.id } })
    expect(plan!.ndaSigned).toBe(true)
  })

  it('returns 400 when payload contains no true flags', async () => {
    const employee = await seedEmployee()

    const res = await POST(
      makePostRequest(employee.id, { ndaSigned: false, contractSigned: false }),
      makeParams(employee.id),
    )
    expect(res.status).toBe(400)
  })

  it('returns 404 for a non-existent employee ID', async () => {
    const res = await POST(
      makePostRequest('nonexistent-id', { ndaSigned: true }),
      makeParams('nonexistent-id'),
    )
    expect(res.status).toBe(404)
  })
})
