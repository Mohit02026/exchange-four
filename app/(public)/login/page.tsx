'use client'

import { useState, Suspense } from 'react'
import { motion } from 'framer-motion'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const registered = searchParams?.get('registered') === 'true'
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const form = e.currentTarget
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value

    const result = await signIn('credentials', { email, password, redirect: false })

    if (result?.error) {
      setError('Invalid email or password')
      setLoading(false)
      return
    }

    const sessionRes = await fetch('/api/auth/session')
    const session = await sessionRes.json()
    const role = session?.user?.role

    router.refresh()
    if (role === 'HR') router.push('/hr/dashboard')
    else if (role === 'EXECUTIVE') router.push('/approve')
    else router.push('/status')
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    setError(null)
    await signIn('google', { callbackUrl: '/status' })
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex' }}>

      {/* ── Left brand panel ─────────────────────────────────── */}
      <div
        className="login-brand-panel"
        style={{
          display: 'none',
          flex: '0 0 46%',
          background: 'var(--navy-900)',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '52px 56px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle warm glow bottom-left */}
        <div style={{
          position: 'absolute',
          bottom: '-100px',
          left: '-80px',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(201,160,32,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Top: mark + wordmark */}
        <div style={{ position: 'relative' }}>
          {/* Bar chart mark — 3 rising bars + gold 4 */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, marginBottom: 36 }}>
            <div style={{ width: 12, height: 22, background: '#5B93C5', borderRadius: '3px 3px 2px 2px', opacity: 0.8 }} />
            <div style={{ width: 12, height: 34, background: '#2E6BAD', borderRadius: '3px 3px 2px 2px', opacity: 0.9 }} />
            <div style={{ width: 12, height: 46, background: '#3B6BC4', borderRadius: '3px 3px 2px 2px' }} />
            <div style={{
              marginLeft: 4,
              fontSize: 52,
              fontWeight: 900,
              color: 'var(--gold)',
              lineHeight: 1,
              letterSpacing: '-0.06em',
            }}>
              4
            </div>
          </div>

          {/* Stacked wordmark */}
          <div>
            <div style={{
              fontSize: 40,
              fontWeight: 800,
              color: '#FFFFFF',
              letterSpacing: '-0.025em',
              lineHeight: 1.05,
            }}>
              EXCHANGE
            </div>
            <div style={{
              fontSize: 40,
              fontWeight: 800,
              color: 'var(--gold)',
              letterSpacing: '-0.025em',
              lineHeight: 1.05,
            }}>
              FOUR
            </div>
          </div>
        </div>

        {/* Bottom: tagline */}
        <div style={{ position: 'relative' }}>
          <div style={{
            width: 44,
            height: 2,
            background: 'var(--gold)',
            borderRadius: 2,
            marginBottom: 22,
            opacity: 0.6,
          }} />
          <p style={{
            margin: '0 0 14px',
            fontSize: 22,
            fontWeight: 700,
            color: '#FFFFFF',
            lineHeight: 1.35,
            letterSpacing: '-0.02em',
          }}>
            Give more than<br />you receive.
          </p>
          <p style={{
            margin: 0,
            fontSize: 13,
            color: '#475569',
            lineHeight: 1.7,
            maxWidth: 280,
          }}>
            The fourth type of exchange — delivering more value than expected in everything we do.
          </p>
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────────────── */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        padding: '40px 32px',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0, 0, 0.2, 1] }}
          style={{ width: '100%', maxWidth: 420 }}
        >
          <div style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-xl)',
            border: '1px solid var(--border)',
            padding: '44px 40px',
          }}>
            {/* Brand mark */}
            <div style={{ marginBottom: 32, textAlign: 'center' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 46,
                height: 46,
                borderRadius: 'var(--radius-md)',
                background: 'var(--navy-900)',
                marginBottom: 18,
              }}>
                <span style={{
                  fontSize: 14,
                  fontWeight: 900,
                  color: 'var(--gold)',
                  letterSpacing: '-0.02em',
                  fontFamily: 'monospace',
                }}>
                  EX4
                </span>
              </div>
              <h1 style={{
                margin: '0 0 4px',
                fontSize: 20,
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
              }}>
                Sign in to{' '}
                <span style={{ color: 'var(--navy-700)' }}>Exchange </span>
                <span style={{ color: 'var(--gold-dark)' }}>Four</span>
              </h1>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
                Personnel Desk
              </p>
            </div>

            {registered && (
              <div style={{
                marginBottom: 20,
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--status-green-bg)',
                border: '1px solid #bbf7d0',
                fontSize: 13,
                color: 'var(--status-green-text)',
              }}>
                Account created — please sign in.
              </div>
            )}

            {/* Google sign-in */}
            <button
              type="button"
              onClick={handleGoogle}
              disabled={googleLoading || loading}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                padding: '10px 16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                fontSize: 14,
                fontWeight: 500,
                color: 'var(--text-primary)',
                cursor: 'pointer',
                marginBottom: 20,
                transition: 'all var(--duration-fast) var(--ease-out)',
                opacity: googleLoading || loading ? 0.5 : 1,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              {googleLoading ? 'Redirecting…' : 'Continue with Google'}
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                or sign in with email
              </span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            {/* Credentials form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label
                  htmlFor="email"
                  style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}
                >
                  Email <span style={{ color: 'var(--status-red)' }}>*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    fontSize: 14,
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    transition: 'border-color var(--duration-fast) var(--ease-out)',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)' }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}
                >
                  Password <span style={{ color: 'var(--status-red)' }}>*</span>
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    fontSize: 14,
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    transition: 'border-color var(--duration-fast) var(--ease-out)',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)' }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
                />
              </div>

              {error && (
                <div
                  role="alert"
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--status-red-bg)',
                    border: '1px solid #fecaca',
                    fontSize: 13,
                    color: 'var(--status-red-text)',
                  }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || googleLoading}
                style={{
                  width: '100%',
                  padding: '11px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: loading || googleLoading ? 'var(--border-strong)' : 'var(--color-primary)',
                  color: '#FFFFFF',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: loading || googleLoading ? 'not-allowed' : 'pointer',
                  transition: 'background var(--duration-fast) var(--ease-out)',
                  marginTop: 4,
                }}
              >
                {loading ? 'Signing In…' : 'Sign In'}
              </button>

              <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>
                Don&apos;t have an account?{' '}
                <Link href="/register" style={{ color: 'var(--navy-700)', fontWeight: 500, textDecoration: 'none' }}>
                  Create one
                </Link>
              </p>
            </form>
          </div>
        </motion.div>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
