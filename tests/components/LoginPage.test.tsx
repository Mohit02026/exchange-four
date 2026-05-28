import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LoginPage from '@/app/(public)/login/page'

// next-auth/react — mock signIn so we never hit real OAuth
vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}))

// next/navigation — mock router and searchParams
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => ({ get: vi.fn(() => null) }),
}))

// next/link — render as a plain anchor in test env
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

import { signIn } from 'next-auth/react'
const mockSignIn = signIn as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
  mockSignIn.mockReset()
})

describe('LoginPage', () => {
  it('renders the "Continue with Google" button', () => {
    render(<LoginPage />)
    expect(screen.getByRole('button', { name: /Continue with Google/i })).toBeInTheDocument()
  })

  it('renders email and password inputs', () => {
    render(<LoginPage />)
    expect(screen.getByRole('textbox', { name: /Email/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument()
  })

  it('renders the "Sign In" submit button', () => {
    render(<LoginPage />)
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument()
  })

  it('renders divider text "or sign in with email"', () => {
    render(<LoginPage />)
    expect(screen.getByText(/or sign in with email/i)).toBeInTheDocument()
  })

  it('Google button calls signIn("google") on click', async () => {
    mockSignIn.mockResolvedValue(undefined)
    render(<LoginPage />)
    fireEvent.click(screen.getByRole('button', { name: /Continue with Google/i }))
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('google', { callbackUrl: '/status' })
    })
  })

  it('Google button shows "Redirecting…" while loading', async () => {
    mockSignIn.mockImplementation(() => new Promise(() => {})) // never resolves
    render(<LoginPage />)
    fireEvent.click(screen.getByRole('button', { name: /Continue with Google/i }))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Redirecting/i })).toBeInTheDocument()
    })
  })

  it('email form calls signIn("credentials") with email and password', async () => {
    mockSignIn.mockResolvedValue({ error: null })
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ user: { role: 'APPLICANT' } }),
    } as Response)

    render(<LoginPage />)
    fireEvent.change(screen.getByRole('textbox', { name: /Email/i }), {
      target: { value: 'user@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'password123' },
    })
    fireEvent.submit(screen.getByRole('button', { name: /Sign In/i }).closest('form')!)

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('credentials', {
        email: 'user@example.com',
        password: 'password123',
        redirect: false,
      })
    })
  })

  it('shows error message on invalid credentials', async () => {
    mockSignIn.mockResolvedValue({ error: 'CredentialsSignin' })

    render(<LoginPage />)
    fireEvent.change(screen.getByRole('textbox', { name: /Email/i }), {
      target: { value: 'wrong@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'wrongpass' },
    })
    fireEvent.submit(screen.getByRole('button', { name: /Sign In/i }).closest('form')!)

    await waitFor(() => {
      expect(screen.getByText(/Invalid email or password/i)).toBeInTheDocument()
    })
  })

  it('disables both buttons while email sign-in is loading', async () => {
    mockSignIn.mockImplementation(() => new Promise(() => {})) // never resolves

    render(<LoginPage />)
    fireEvent.change(screen.getByRole('textbox', { name: /Email/i }), {
      target: { value: 'user@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'password123' },
    })
    fireEvent.submit(screen.getByRole('button', { name: /Sign In/i }).closest('form')!)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Continue with Google/i })).toBeDisabled()
    })
  })
})
