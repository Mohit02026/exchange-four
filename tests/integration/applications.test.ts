// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { testDb, clearDatabase, seedApplicantUser, seedHRUser, seedApplication, seedPosition } from '../db-helpers'
import { NextRequest } from 'next/server'

vi.mock('next/headers', () => ({
  headers: vi.fn(() => ({ get: (_: string) => null })),
}))

// Mock auth() — each test overrides the resolved value via mockResolvedValue
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

// Mock Drive service — avoid real filesystem/Drive calls in integration tests
vi.mock('@/lib/services/drive', () => ({
  createApplicantFolder: vi.fn(() => Promise.resolve(null)),
  uploadFileToDrive: vi.fn(() => Promise.resolve('drive-file-id')),
  deleteLocalUploads: vi.fn(),
  mimeTypeForFile: vi.fn(() => 'application/pdf'),
}))

// Mock file save — avoid writing to public/uploads in tests
vi.mock('@/lib/services/applications', async (importOriginal) => {
  const real = await importOriginal<typeof import('@/lib/services/applications')>()
  return {
    ...real,
    saveUpload: vi.fn(() => Promise.resolve('/uploads/test/file.pdf')),
  }
})

import { GET as getQueue, POST as postApplication } from '@/app/api/applications/route'
import { GET as getMe } from '@/app/api/applications/me/route'
import { auth } from '@/lib/auth'

const mockAuth = auth as ReturnType<typeof vi.fn>

beforeEach(async () => {
  await clearDatabase()
  vi.clearAllMocks()
})

// ── GET /api/applications (HR queue) ─────────────────────────────────────────

describe('GET /api/applications', () => {
  it('returns 401 for unauthenticated requests', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await getQueue()
    expect(res.status).toBe(401)
  })

  it('returns 403 for APPLICANT role', async () => {
    const user = await seedApplicantUser()
    mockAuth.mockResolvedValue({ user: { id: user.id, role: 'APPLICANT' } })
    const res = await getQueue()
    expect(res.status).toBe(403)
  })

  it('returns application list for HR role', async () => {
    const hrUser = await seedHRUser()
    mockAuth.mockResolvedValue({ user: { id: hrUser.id, role: 'HR' } })

    const appUser = await seedApplicantUser()
    await seedApplication(appUser.applicant!.id)

    const res = await getQueue()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    expect(body).toHaveLength(1)
  })

  it('returns empty array when no applications exist', async () => {
    const hrUser = await seedHRUser()
    mockAuth.mockResolvedValue({ user: { id: hrUser.id, role: 'HR' } })

    const res = await getQueue()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveLength(0)
  })
})

// ── GET /api/applications/me ──────────────────────────────────────────────────

describe('GET /api/applications/me', () => {
  it('returns 401 for unauthenticated requests', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await getMe()
    expect(res.status).toBe(401)
  })

  it('returns null when the applicant has no application', async () => {
    const user = await seedApplicantUser()
    mockAuth.mockResolvedValue({ user: { id: user.id, role: 'APPLICANT' } })

    const res = await getMe()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toBeNull()
  })

  it("returns only the requesting user's own application", async () => {
    const userA = await seedApplicantUser('a@example.com')
    const userB = await seedApplicantUser('b@example.com')
    const appA = await seedApplication(userA.applicant!.id)
    await seedApplication(userB.applicant!.id)

    mockAuth.mockResolvedValue({ user: { id: userA.id, role: 'APPLICANT' } })

    const res = await getMe()
    const body = await res.json()
    expect(body.id).toBe(appA.id)
    expect(body.reference).toBe(appA.reference)
  })

  it('does not return another applicant\'s application', async () => {
    const userA = await seedApplicantUser('a@example.com')
    const userB = await seedApplicantUser('b@example.com')
    await seedApplication(userB.applicant!.id)

    // User A has no application — result should be null, not B's app
    mockAuth.mockResolvedValue({ user: { id: userA.id, role: 'APPLICANT' } })

    const res = await getMe()
    const body = await res.json()
    expect(body).toBeNull()
  })
})

// ── POST /api/applications ────────────────────────────────────────────────────

describe('POST /api/applications', () => {
  function makeFormRequest(fields: Record<string, string> = {}) {
    const form = new FormData()
    form.append('bio', fields.bio ?? 'Test bio')
    form.append('skills', fields.skills ?? 'Test skills')
    form.append('hobbies', fields.hobbies ?? 'Test hobbies')
    form.append('careerGoals', fields.careerGoals ?? 'Test career goals')
    form.append('whyExchangeFour', fields.whyExchangeFour ?? 'Test why')
    form.append('cv', new File(['pdf content'], 'cv.pdf', { type: 'application/pdf' }))
    form.append('photo', new File(['img'], 'photo.jpg', { type: 'image/jpeg' }))
    // Video: size > 0 required, use 1 byte
    const videoContent = new Uint8Array([0x00])
    form.append('video', new File([videoContent], 'video.mp4', { type: 'video/mp4' }))
    return new NextRequest('http://localhost:3001/api/applications', {
      method: 'POST',
      body: form,
    })
  }

  it('returns 401 without a session', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await postApplication(makeFormRequest())
    expect(res.status).toBe(401)
  })

  it('returns 403 for HR role', async () => {
    const hrUser = await seedHRUser()
    mockAuth.mockResolvedValue({ user: { id: hrUser.id, role: 'HR' } })
    const res = await postApplication(makeFormRequest())
    expect(res.status).toBe(403)
  })

  it('creates application with SUBMITTED status', async () => {
    const user = await seedApplicantUser()
    mockAuth.mockResolvedValue({ user: { id: user.id, role: 'APPLICANT' } })

    const res = await postApplication(makeFormRequest())
    expect(res.status).toBe(201)

    const app = await testDb.application.findFirst({ where: { applicantId: user.applicant!.id } })
    expect(app).not.toBeNull()
    expect(app!.status).toBe('SUBMITTED')
  })

  it('generates a reference in EF-HR-APP-{year}-{n} format', async () => {
    const user = await seedApplicantUser()
    mockAuth.mockResolvedValue({ user: { id: user.id, role: 'APPLICANT' } })

    const res = await postApplication(makeFormRequest())
    const body = await res.json()
    expect(body.reference).toMatch(/^EF-HR-APP-\d{4}-\d{6}$/)
  })

  it('returns 409 when applicant already has a submitted application', async () => {
    const user = await seedApplicantUser()
    mockAuth.mockResolvedValue({ user: { id: user.id, role: 'APPLICANT' } })
    await seedApplication(user.applicant!.id)

    const res = await postApplication(makeFormRequest())
    expect(res.status).toBe(409)
  })

  it('returns 400 when a required text field is missing', async () => {
    const user = await seedApplicantUser()
    mockAuth.mockResolvedValue({ user: { id: user.id, role: 'APPLICANT' } })

    const form = new FormData()
    // omit bio
    form.append('skills', 'skills')
    form.append('hobbies', 'hobbies')
    form.append('careerGoals', 'goals')
    form.append('whyExchangeFour', 'why')
    form.append('cv', new File(['x'], 'cv.pdf', { type: 'application/pdf' }))
    form.append('photo', new File(['x'], 'photo.jpg', { type: 'image/jpeg' }))
    const videoContent = new Uint8Array([0x00])
    form.append('video', new File([videoContent], 'video.mp4', { type: 'video/mp4' }))

    const req = new NextRequest('http://localhost:3001/api/applications', { method: 'POST', body: form })
    const res = await postApplication(req)
    expect(res.status).toBe(400)
  })

  it('rejects CV with an invalid MIME type', async () => {
    const user = await seedApplicantUser()
    mockAuth.mockResolvedValue({ user: { id: user.id, role: 'APPLICANT' } })

    const form = new FormData()
    form.append('bio', 'bio')
    form.append('skills', 'skills')
    form.append('hobbies', 'hobbies')
    form.append('careerGoals', 'goals')
    form.append('whyExchangeFour', 'why')
    form.append('cv', new File(['x'], 'cv.txt', { type: 'text/plain' })) // wrong type
    form.append('photo', new File(['x'], 'photo.jpg', { type: 'image/jpeg' }))
    const videoContent = new Uint8Array([0x00])
    form.append('video', new File([videoContent], 'video.mp4', { type: 'video/mp4' }))

    const req = new NextRequest('http://localhost:3001/api/applications', { method: 'POST', body: form })
    const res = await postApplication(req)
    expect(res.status).toBe(400)
  })

  it('creates CV and PHOTO file records', async () => {
    const user = await seedApplicantUser()
    mockAuth.mockResolvedValue({ user: { id: user.id, role: 'APPLICANT' } })

    await postApplication(makeFormRequest())

    const app = await testDb.application.findFirst({
      where: { applicantId: user.applicant!.id },
      include: { files: true },
    })
    const types = app!.files.map((f) => f.type).sort()
    expect(types).toContain('CV')
    expect(types).toContain('PHOTO')
  })

  it('writes APPLICATION_SUBMITTED audit log', async () => {
    const user = await seedApplicantUser()
    mockAuth.mockResolvedValue({ user: { id: user.id, role: 'APPLICANT' } })

    await postApplication(makeFormRequest())

    const log = await testDb.auditLog.findFirst({ where: { action: 'APPLICATION_SUBMITTED' } })
    expect(log).not.toBeNull()
  })
})
