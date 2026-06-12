// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { clearDatabase, seedHRUser } from '../db-helpers'

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/integrations/email', () => ({
  sendWeeklyReport: vi.fn(() => Promise.resolve()),
}))

import { GET, POST } from '@/app/api/reports/weekly/route'
import { auth } from '@/lib/auth'

const mockAuth = auth as ReturnType<typeof vi.fn>

beforeEach(async () => {
  await clearDatabase()
  vi.clearAllMocks()
})

describe('GET /api/reports/weekly', () => {
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

  it('returns report with correct shape for HR user', async () => {
    const hrUser = await seedHRUser()
    mockAuth.mockResolvedValue({ user: { id: hrUser.id, role: 'HR' } })

    const res = await GET()
    expect(res.status).toBe(200)

    const report = await res.json()
    expect(report).toHaveProperty('generatedAt')
    expect(report).toHaveProperty('weekStart')
    expect(report).toHaveProperty('weekEnd')
    expect(report).toHaveProperty('pipeline')
    expect(report).toHaveProperty('thisWeek')
    expect(report).toHaveProperty('awaitingAction')
    expect(report).toHaveProperty('onboarding')
    expect(report).toHaveProperty('training')
    expect(report).toHaveProperty('ethics')
    expect(report).toHaveProperty('corrections')
    expect(report).toHaveProperty('offboarding')
  })

  it('returns zeroed counts when DB is empty', async () => {
    const hrUser = await seedHRUser()
    mockAuth.mockResolvedValue({ user: { id: hrUser.id, role: 'HR' } })

    const res = await GET()
    const report = await res.json()

    expect(report.thisWeek.newApplications).toBe(0)
    expect(report.thisWeek.newHires).toBe(0)
    expect(report.corrections.open).toBe(0)
    expect(report.offboarding.activeCases).toBe(0)
    expect(report.ethics.openReports).toBe(0)
  })
})

describe('POST /api/reports/weekly', () => {
  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await POST()
    expect(res.status).toBe(401)
  })

  it('calls sendWeeklyReport and returns sent:true', async () => {
    const hrUser = await seedHRUser()
    mockAuth.mockResolvedValue({ user: { id: hrUser.id, role: 'HR' } })

    const { sendWeeklyReport } = await import('@/lib/integrations/email')

    const res = await POST()
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.sent).toBe(true)
    expect(body).toHaveProperty('report')
    expect(sendWeeklyReport).toHaveBeenCalledOnce()
  })
})
