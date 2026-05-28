// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest'

// next/headers requires a Next.js request scope — mock it for handler testing
vi.mock('next/headers', () => ({
  headers: vi.fn(() => ({ get: (_: string) => null })),
}))
import { testDb, clearDatabase, seedApplicantUser, seedApplication, seedApprovalRequest } from '../db-helpers'

import { GET, POST } from '@/app/api/approvals/[token]/route'
import { NextRequest } from 'next/server'

function makeParams(token: string) {
  return { params: Promise.resolve({ token }) }
}

function makeGetRequest(token: string) {
  return new NextRequest(`http://localhost:3001/api/approvals/${token}`)
}

function makePostRequest(token: string, body: Record<string, unknown>) {
  return new NextRequest(`http://localhost:3001/api/approvals/${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(async () => {
  await clearDatabase()
})

describe('GET /api/approvals/[token]', () => {
  it('returns 404 for a non-existent token', async () => {
    const res = await GET(makeGetRequest('EX4-APPROVE-nonexistent'), makeParams('EX4-APPROVE-nonexistent'))
    expect(res.status).toBe(404)
  })

  it('returns 410 for an expired token', async () => {
    const { applicant } = await seedApplicantUser()
    const app = await seedApplication(applicant!.id)
    const pastExpiry = new Date(Date.now() - 1000)
    const expired = await testDb.approvalRequest.create({
      data: {
        applicationId: app.id,
        token: 'EX4-APPROVE-expired',
        tokenExpiry: pastExpiry,
      },
    })

    const res = await GET(makeGetRequest(expired.token), makeParams(expired.token))
    expect(res.status).toBe(410)
  })

  it('returns application data for a valid token', async () => {
    const { applicant } = await seedApplicantUser()
    const app = await seedApplication(applicant!.id)
    const req = await seedApprovalRequest(app.id)

    const res = await GET(makeGetRequest(req.token), makeParams(req.token))
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.applicant.firstName).toBe('Test')
    expect(body.application.reference).toBe(app.reference)
    expect(body.alreadyDecided).toBe(false)
  })

  it('records an APPROVAL_LINK_OPENED audit log on valid GET', async () => {
    const { applicant } = await seedApplicantUser()
    const app = await seedApplication(applicant!.id)
    const req = await seedApprovalRequest(app.id)

    await GET(makeGetRequest(req.token), makeParams(req.token))

    const log = await testDb.auditLog.findFirst({
      where: { action: 'APPROVAL_LINK_OPENED', entityId: req.token },
    })
    expect(log).not.toBeNull()
  })

  it('does not require authentication', async () => {
    // GET with no auth headers should still succeed for a valid token
    const { applicant } = await seedApplicantUser()
    const app = await seedApplication(applicant!.id)
    const req = await seedApprovalRequest(app.id)

    const res = await GET(makeGetRequest(req.token), makeParams(req.token))
    expect(res.status).toBe(200)
  })
})

describe('POST /api/approvals/[token]', () => {
  it('records APPROVED decision and sets status to EXECUTIVE_APPROVED', async () => {
    const { applicant } = await seedApplicantUser()
    const app = await seedApplication(applicant!.id)
    const req = await seedApprovalRequest(app.id)

    await testDb.application.update({ where: { id: app.id }, data: { status: 'SENT_TO_AVI' } })

    const res = await POST(
      makePostRequest(req.token, { decision: 'APPROVED', reason: null }),
      makeParams(req.token),
    )
    expect(res.status).toBe(200)

    const updated = await testDb.application.findUnique({ where: { id: app.id } })
    expect(updated!.status).toBe('EXECUTIVE_APPROVED')
  })

  it('records DISAPPROVED decision and sets status to EXECUTIVE_DISAPPROVED', async () => {
    const { applicant } = await seedApplicantUser()
    const app = await seedApplication(applicant!.id)
    const req = await seedApprovalRequest(app.id)

    const res = await POST(
      makePostRequest(req.token, { decision: 'DISAPPROVED', reason: 'Not a fit for this role' }),
      makeParams(req.token),
    )
    expect(res.status).toBe(200)

    const updated = await testDb.application.findUnique({ where: { id: app.id } })
    expect(updated!.status).toBe('EXECUTIVE_DISAPPROVED')
  })

  it('marks the token as used after a successful submission', async () => {
    const { applicant } = await seedApplicantUser()
    const app = await seedApplication(applicant!.id)
    const req = await seedApprovalRequest(app.id)

    await POST(
      makePostRequest(req.token, { decision: 'APPROVED' }),
      makeParams(req.token),
    )

    const updated = await testDb.approvalRequest.findUnique({ where: { id: req.id } })
    expect(updated!.tokenUsed).toBe(true)
  })

  it('returns 409 on a second POST with the same token (single-use)', async () => {
    const { applicant } = await seedApplicantUser()
    const app = await seedApplication(applicant!.id)
    const req = await seedApprovalRequest(app.id)

    await POST(makePostRequest(req.token, { decision: 'APPROVED' }), makeParams(req.token))

    const res2 = await POST(makePostRequest(req.token, { decision: 'APPROVED' }), makeParams(req.token))
    expect(res2.status).toBe(409)

    // Only one ApprovalDecision record should exist
    const decisions = await testDb.approvalDecision.findMany({
      where: { approvalRequestId: req.id },
    })
    expect(decisions).toHaveLength(1)
  })

  it('returns 409 when the token is expired', async () => {
    const { applicant } = await seedApplicantUser()
    const app = await seedApplication(applicant!.id)
    const expired = await testDb.approvalRequest.create({
      data: {
        applicationId: app.id,
        token: 'EX4-APPROVE-expired2',
        tokenExpiry: new Date(Date.now() - 1000),
      },
    })

    const res = await POST(
      makePostRequest(expired.token, { decision: 'APPROVED' }),
      makeParams(expired.token),
    )
    expect(res.status).toBe(409)
  })

  it('returns 422 when DISAPPROVED without a reason', async () => {
    const { applicant } = await seedApplicantUser()
    const app = await seedApplication(applicant!.id)
    const req = await seedApprovalRequest(app.id)

    const res = await POST(
      makePostRequest(req.token, { decision: 'DISAPPROVED', reason: null }),
      makeParams(req.token),
    )
    expect(res.status).toBe(422)
  })

  it('writes an audit log entry on decision', async () => {
    const { applicant } = await seedApplicantUser()
    const app = await seedApplication(applicant!.id)
    const req = await seedApprovalRequest(app.id)

    await POST(makePostRequest(req.token, { decision: 'APPROVED' }), makeParams(req.token))

    const log = await testDb.auditLog.findFirst({
      where: { action: 'AVI_APPROVED', entityId: app.id },
    })
    expect(log).not.toBeNull()
  })
})
