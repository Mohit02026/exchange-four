import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import FinalDecisionPanel from '@/components/hr/FinalDecisionPanel'

// next/navigation mock — needed because FinalDecisionPanel calls useRouter
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

const BASE_PROPS = {
  applicationId: 'app-123',
  applicantName: 'Jane Smith',
  reference: 'EF-HR-APP-2026-000001',
  positionTitle: 'Operations Coordinator',
  currentStatus: 'EXECUTIVE_APPROVED',
  aviDecision: { decision: 'APPROVED', reason: null, notes: null },
  reviewNotesForAvi: null,
  reviewSections: [],
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

describe('FinalDecisionPanel', () => {
  it('renders three decision buttons when status is EXECUTIVE_APPROVED', () => {
    render(<FinalDecisionPanel {...BASE_PROPS} />)
    expect(screen.getByRole('button', { name: /Fully Approved/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Keep Warm/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Rejected/i })).toBeInTheDocument()
  })

  it('shows Avi APPROVED badge when aviDecision is APPROVED', () => {
    render(<FinalDecisionPanel {...BASE_PROPS} />)
    expect(screen.getByText(/Avi: Approved/i)).toBeInTheDocument()
  })

  it('shows Avi DISAPPROVED badge when aviDecision is DISAPPROVED', () => {
    render(<FinalDecisionPanel {...BASE_PROPS} aviDecision={{ decision: 'DISAPPROVED', reason: 'Not a fit', notes: null }} />)
    expect(screen.getByText(/Avi: Disapproved/i)).toBeInTheDocument()
    expect(screen.getByText(/Not a fit/i)).toBeInTheDocument()
  })

  it('all buttons are disabled while a submission is in flight', async () => {
    vi.mocked(global.fetch).mockImplementation(() => new Promise(() => {})) // never resolves

    render(<FinalDecisionPanel {...BASE_PROPS} />)
    fireEvent.click(screen.getByRole('button', { name: /Fully Approved/i }))

    await waitFor(() => {
      // The clicked button shows "Processing…"
      expect(screen.getByRole('button', { name: /Processing/i })).toBeInTheDocument()
      // Other buttons are disabled
      expect(screen.getByRole('button', { name: /Keep Warm/i })).toBeDisabled()
      expect(screen.getByRole('button', { name: /Rejected/i })).toBeDisabled()
    })
  })

  it('hides buttons and shows "Decision recorded" after a successful approved submission', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response)

    render(<FinalDecisionPanel {...BASE_PROPS} />)
    fireEvent.click(screen.getByRole('button', { name: /Fully Approved/i }))

    await waitFor(() => {
      expect(screen.getByText(/Decision recorded/i)).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Fully Approved/i })).not.toBeInTheDocument()
    })
  })

  it('shows the correct status badge after approval', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response)

    render(<FinalDecisionPanel {...BASE_PROPS} />)
    fireEvent.click(screen.getByRole('button', { name: /Fully Approved/i }))

    await waitFor(() => {
      // StatusBadge appears in both the header and the "Decision recorded" line — use getAllByText
      const badges = screen.getAllByText(/Approved.*Awaiting Start Date/i)
      expect(badges.length).toBeGreaterThan(0)
    })
  })

  it('shows error message when API returns an error', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Something went wrong' }),
    } as Response)

    render(<FinalDecisionPanel {...BASE_PROPS} />)
    fireEvent.click(screen.getByRole('button', { name: /Rejected/i }))

    await waitFor(() => {
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()
      // Buttons reappear after error
      expect(screen.getByRole('button', { name: /Rejected/i })).toBeInTheDocument()
    })
  })

  it('shows "Decision recorded" immediately when status is already decided', () => {
    render(<FinalDecisionPanel {...BASE_PROPS} currentStatus="REJECTED" />)
    expect(screen.getByText(/Decision recorded/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Fully Approved/i })).not.toBeInTheDocument()
  })

  it('posts to /api/approvals/final with the correct applicationId and decision', async () => {
    const mockFetch = vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response)

    render(<FinalDecisionPanel {...BASE_PROPS} />)
    fireEvent.click(screen.getByRole('button', { name: /Keep Warm/i }))

    await waitFor(() => expect(mockFetch).toHaveBeenCalledOnce())

    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/approvals/final')
    const body = JSON.parse(options.body as string)
    expect(body.applicationId).toBe('app-123')
    expect(body.decision).toBe('warm')
  })
})
