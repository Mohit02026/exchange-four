import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ApplicationForm from '@/components/applicant/ApplicationForm'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

// FileUploader renders an input[type=file] — keep real component
// but mock fetch so we control API responses
beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

const NO_POSITIONS: [] = []

describe('ApplicationForm', () => {
  it('renders all five text field labels', () => {
    render(<ApplicationForm positions={NO_POSITIONS} />)
    expect(screen.getByLabelText(/Bio/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Skills/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Hobbies/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Career Goals/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Why Exchange Four/i)).toBeInTheDocument()
  })

  it('renders "General Application" option when no positions provided', () => {
    render(<ApplicationForm positions={NO_POSITIONS} />)
    expect(screen.getByRole('option', { name: /General Application/i })).toBeInTheDocument()
  })

  it('renders position options when positions are provided', () => {
    const positions = [
      { id: 'pos-1', title: 'Operations Coordinator', orgBoardUnit: { name: 'Ops' } },
    ]
    render(<ApplicationForm positions={positions} />)
    expect(screen.getByRole('option', { name: /Operations Coordinator/i })).toBeInTheDocument()
  })

  it('renders the Submit Application button', () => {
    render(<ApplicationForm positions={NO_POSITIONS} />)
    expect(screen.getByRole('button', { name: /Submit Application/i })).toBeInTheDocument()
  })

  it('shows "Submitting…" on the button while request is in flight', async () => {
    vi.mocked(global.fetch).mockImplementation(() => new Promise(() => {}))

    render(<ApplicationForm positions={NO_POSITIONS} />)
    fireEvent.submit(screen.getByRole('button', { name: /Submit Application/i }).closest('form')!)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Submitting/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Submitting/i })).toBeDisabled()
    })
  })

  it('shows server error message when API returns a non-OK response', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'All text fields are required' }),
    } as Response)

    render(<ApplicationForm positions={NO_POSITIONS} />)
    fireEvent.submit(screen.getByRole('button', { name: /Submit Application/i }).closest('form')!)

    await waitFor(() => {
      expect(screen.getByText(/All text fields are required/i)).toBeInTheDocument()
    })
  })

  it('shows fallback error when API returns non-JSON 500', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      json: async () => { throw new Error('not json') },
    } as unknown as Response)

    render(<ApplicationForm positions={NO_POSITIONS} />)
    fireEvent.submit(screen.getByRole('button', { name: /Submit Application/i }).closest('form')!)

    await waitFor(() => {
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()
    })
  })

  it('submit button re-enables after a failed request', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Server error' }),
    } as Response)

    render(<ApplicationForm positions={NO_POSITIONS} />)
    fireEvent.submit(screen.getByRole('button', { name: /Submit Application/i }).closest('form')!)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Submit Application/i })).not.toBeDisabled()
    })
  })

  it('posts to /api/applications', async () => {
    const mockFetch = vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ reference: 'EF-HR-APP-2026-000001' }),
    } as Response)

    render(<ApplicationForm positions={NO_POSITIONS} />)
    fireEvent.submit(screen.getByRole('button', { name: /Submit Application/i }).closest('form')!)

    await waitFor(() => expect(mockFetch).toHaveBeenCalledOnce())
    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/applications')
    expect(options.method).toBe('POST')
    expect(options.body).toBeInstanceOf(FormData)
  })
})
