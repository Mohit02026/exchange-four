// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { testDb, clearDatabase, seedHRUser, seedApplicantUser, seedApplication } from '../db-helpers'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))

// interviews service may not exist yet — mock it to be safe
vi.mock('@/lib/services/interviews', () => ({
  createInterviewInvite: vi.fn(() => Promise.resolve(null)),
}))

import { POST } from '@/app/api/approvals/final/route'
import { auth } from '@/lib/auth'

const mockAuth = auth as ReturnType<typeof vi.fn>

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3001/api/approvals/final', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

async function setupHRAndApp() {
  const hr = await seedHRUser()
  const user = await seedApplicantUser()
  const app = await seedApplication(user.applicant!.id)
  // Put it in a state that Nicola can make a final decision on
  await testDb.application.update({
    where: { id: app.id },
    data: { status: 'EXECUTIVE_APPROVED' },
  })
  return { hr, app }
}

beforeEach(async () => {
  await clearDatabase()
  vi.clearAllMocks()
})

describe('POST /api/approvals/final', () => {
  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await POST(makeRequest({ applicationId: 'x', decision: 'approved' }))
    expect(res.status).toBe(401)
  })

  it('returns 403 for APPLICANT role', async () => {
    const user = await seedApplicantUser()
    mockAuth.mockResolvedValue({ user: { id: user.id, role: 'APPLICANT' } })
    const res = await POST(makeRequest({ applicationId: 'x', decision: 'approved' }))
    expect(res.status).toBe(403)
  })

  it('returns 422 for an invalid decision value', async () => {
    const hr = await seedHRUser()
    mockAuth.mockResolvedValue({ user: { id: hr.id, role: 'HR' } })
    const res = await POST(makeRequest({ applicationId: 'x', decision: 'maybe' }))
    expect(res.status).toBe(422)
  })

  it('returns 422 for a non-existent applicationId', async () => {
    const hr = await seedHRUser()
    mockAuth.mockResolvedValue({ user: { id: hr.id, role: 'HR' } })
    const res = await POST(makeRequest({ applicationId: 'nonexistent', decision: 'approved' }))
    expect(res.status).toBe(422)
  })

  describe('decision: approved', () => {
    it('sets status to START_DATE_REQUESTED', async () => {
      const { hr, app } = await setupHRAndApp()
      mockAuth.mockResolvedValue({ user: { id: hr.id, role: 'HR' } })

      const res = await POST(makeRequest({ applicationId: app.id, decision: 'approved' }))
      expect(res.status).toBe(200)

      const updated = await testDb.application.findUnique({ where: { id: app.id } })
      expect(updated!.status).toBe('START_DATE_REQUESTED')
    })

    it('writes NICOLA_FINAL_APPROVED audit log', async () => {
      const { hr, app } = await setupHRAndApp()
      mockAuth.mockResolvedValue({ user: { id: hr.id, role: 'HR' } })

      await POST(makeRequest({ applicationId: app.id, decision: 'approved' }))

      const log = await testDb.auditLog.findFirst({
        where: { action: 'NICOLA_FINAL_APPROVED', entityId: app.id },
      })
      expect(log).not.toBeNull()
      expect(log!.userId).toBe(hr.id)
    })

    it('creates an EmailEvent for the applicant', async () => {
      const { hr, app } = await setupHRAndApp()
      mockAuth.mockResolvedValue({ user: { id: hr.id, role: 'HR' } })

      await POST(makeRequest({ applicationId: app.id, decision: 'approved' }))

      const email = await testDb.emailEvent.findFirst({
        where: { applicationId: app.id, type: 'APPLICANT_APPROVED' },
      })
      expect(email).not.toBeNull()
    })
  })

  describe('decision: rejected', () => {
    it('sets status to REJECTED', async () => {
      const { hr, app } = await setupHRAndApp()
      mockAuth.mockResolvedValue({ user: { id: hr.id, role: 'HR' } })

      const res = await POST(makeRequest({ applicationId: app.id, decision: 'rejected' }))
      expect(res.status).toBe(200)

      const updated = await testDb.application.findUnique({ where: { id: app.id } })
      expect(updated!.status).toBe('REJECTED')
    })

    it('writes NICOLA_FINAL_REJECTED audit log', async () => {
      const { hr, app } = await setupHRAndApp()
      mockAuth.mockResolvedValue({ user: { id: hr.id, role: 'HR' } })

      await POST(makeRequest({ applicationId: app.id, decision: 'rejected' }))

      const log = await testDb.auditLog.findFirst({
        where: { action: 'NICOLA_FINAL_REJECTED', entityId: app.id },
      })
      expect(log).not.toBeNull()
    })

    it('creates an EmailEvent of type APPLICANT_REJECTED', async () => {
      const { hr, app } = await setupHRAndApp()
      mockAuth.mockResolvedValue({ user: { id: hr.id, role: 'HR' } })

      await POST(makeRequest({ applicationId: app.id, decision: 'rejected' }))

      const email = await testDb.emailEvent.findFirst({
        where: { applicationId: app.id, type: 'APPLICANT_REJECTED' },
      })
      expect(email).not.toBeNull()
    })
  })

  describe('decision: warm (keep warm)', () => {
    it('sets status to FUTURE_PROSPECT', async () => {
      const { hr, app } = await setupHRAndApp()
      mockAuth.mockResolvedValue({ user: { id: hr.id, role: 'HR' } })

      const res = await POST(makeRequest({ applicationId: app.id, decision: 'warm' }))
      expect(res.status).toBe(200)

      const updated = await testDb.application.findUnique({ where: { id: app.id } })
      expect(updated!.status).toBe('FUTURE_PROSPECT')
    })

    it('writes NICOLA_KEEP_WARM audit log', async () => {
      const { hr, app } = await setupHRAndApp()
      mockAuth.mockResolvedValue({ user: { id: hr.id, role: 'HR' } })

      await POST(makeRequest({ applicationId: app.id, decision: 'warm' }))

      const log = await testDb.auditLog.findFirst({
        where: { action: 'NICOLA_KEEP_WARM', entityId: app.id },
      })
      expect(log).not.toBeNull()
    })

    it('does NOT create an email event (no email sent for keep-warm)', async () => {
      const { hr, app } = await setupHRAndApp()
      mockAuth.mockResolvedValue({ user: { id: hr.id, role: 'HR' } })

      await POST(makeRequest({ applicationId: app.id, decision: 'warm' }))

      const emails = await testDb.emailEvent.findMany({ where: { applicationId: app.id } })
      expect(emails).toHaveLength(0)
    })
  })
})
