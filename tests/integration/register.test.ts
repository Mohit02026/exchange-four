// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest'
import { testDb, clearDatabase } from '../db-helpers'
import bcrypt from 'bcryptjs'

// Call the API handler directly — no HTTP server needed
import { POST } from '@/app/api/auth/register/route'
import { NextRequest } from 'next/server'

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3001/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const validPayload = {
  email: 'new@example.com',
  password: 'password123',
  firstName: 'New',
  lastName: 'User',
  correspondenceEmail: 'new@example.com',
}

beforeEach(async () => {
  await clearDatabase()
})

describe('POST /api/auth/register', () => {
  it('creates a User record with APPLICANT role', async () => {
    const res = await POST(makeRequest(validPayload))
    expect(res.status).toBe(201)

    const user = await testDb.user.findUnique({ where: { email: 'new@example.com' } })
    expect(user).not.toBeNull()
    expect(user!.role).toBe('APPLICANT')
  })

  it('creates a linked Applicant record', async () => {
    await POST(makeRequest(validPayload))

    const user = await testDb.user.findUnique({
      where: { email: 'new@example.com' },
      include: { applicant: true },
    })
    expect(user!.applicant).not.toBeNull()
    expect(user!.applicant!.firstName).toBe('New')
    expect(user!.applicant!.lastName).toBe('User')
  })

  it('stores a bcrypt hash — not the plaintext password', async () => {
    await POST(makeRequest(validPayload))

    const user = await testDb.user.findUnique({ where: { email: 'new@example.com' } })
    expect(user!.password).not.toBe('password123')
    expect(user!.password).toMatch(/^\$2[ab]\$/)

    const matches = await bcrypt.compare('password123', user!.password)
    expect(matches).toBe(true)
  })

  it('returns 409 when email is already registered', async () => {
    await POST(makeRequest(validPayload))
    const res = await POST(makeRequest(validPayload))
    expect(res.status).toBe(409)

    const body = await res.json()
    expect(body.error).toMatch(/already registered/i)
  })

  it('returns 400 when email is malformed', async () => {
    const res = await POST(makeRequest({ ...validPayload, email: 'not-an-email' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when password is under 8 characters', async () => {
    const res = await POST(makeRequest({ ...validPayload, email: 'short@example.com', password: 'abc' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/8 characters/i)
  })

  it('returns 400 when firstName is empty', async () => {
    const res = await POST(makeRequest({ ...validPayload, email: 'nofirst@example.com', firstName: '' }))
    expect(res.status).toBe(400)
  })

  it('creates only one user when called once', async () => {
    await POST(makeRequest(validPayload))
    const count = await testDb.user.count()
    expect(count).toBe(1)
  })
})
