import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AcknowledgeForm from '@/app/(public)/acknowledge/[employeeId]/AcknowledgeForm'

const EMPLOYEE_ID = 'emp-123'

const allUnsigned = { ndaSigned: false, contractSigned: false, policiesRead: false }
const allSigned   = { ndaSigned: true,  contractSigned: true,  policiesRead: true  }

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

describe('AcknowledgeForm', () => {
  it('renders three policy checkboxes', () => {
    render(<AcknowledgeForm employeeId={EMPLOYEE_ID} initial={allUnsigned} />)
    // Use exact title strings — the description text also contains these words (case-insensitive),
    // so regex would find multiple matches and throw. Exact strings match only the title divs.
    expect(screen.getByText('Non-Disclosure Agreement (NDA)')).toBeInTheDocument()
    expect(screen.getByText('Employment Contract')).toBeInTheDocument()
    expect(screen.getByText('Company Policies & Employee Handbook')).toBeInTheDocument()
  })

  it('submit button is disabled when no boxes are checked', () => {
    render(<AcknowledgeForm employeeId={EMPLOYEE_ID} initial={allUnsigned} />)
    expect(screen.getByRole('button', { name: /Submit Acknowledgment/i })).toBeDisabled()
  })

  it('submit button is disabled when only some boxes are checked', () => {
    render(<AcknowledgeForm employeeId={EMPLOYEE_ID} initial={allUnsigned} />)
    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[0]) // check first only
    expect(screen.getByRole('button', { name: /Submit Acknowledgment/i })).toBeDisabled()
  })

  it('submit button becomes enabled when all three boxes are checked', () => {
    render(<AcknowledgeForm employeeId={EMPLOYEE_ID} initial={allUnsigned} />)
    const checkboxes = screen.getAllByRole('checkbox')
    checkboxes.forEach((cb) => fireEvent.click(cb))
    expect(screen.getByRole('button', { name: /Submit Acknowledgment/i })).not.toBeDisabled()
  })

  it('already-acknowledged items are disabled and show "Already acknowledged"', () => {
    render(<AcknowledgeForm employeeId={EMPLOYEE_ID} initial={allSigned} />)
    const checkboxes = screen.getAllByRole('checkbox')
    checkboxes.forEach((cb) => expect(cb).toBeDisabled())
    expect(screen.getAllByText(/Already acknowledged/i)).toHaveLength(3)
  })

  it('already-acknowledged boxes cannot be unchecked', () => {
    render(<AcknowledgeForm employeeId={EMPLOYEE_ID} initial={allSigned} />)
    const checkboxes = screen.getAllByRole('checkbox')
    // All are checked + disabled — clicking should have no effect
    checkboxes.forEach((cb) => {
      expect(cb).toBeChecked()
      expect(cb).toBeDisabled()
    })
  })

  it('shows loading state "Saving…" while submitting', async () => {
    vi.mocked(global.fetch).mockImplementation(() => new Promise(() => {})) // never resolves

    render(<AcknowledgeForm employeeId={EMPLOYEE_ID} initial={allUnsigned} />)
    const checkboxes = screen.getAllByRole('checkbox')
    checkboxes.forEach((cb) => fireEvent.click(cb))
    fireEvent.click(screen.getByRole('button', { name: /Submit Acknowledgment/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Saving/i })).toBeInTheDocument()
    })
  })

  it('shows success ✅ state after successful submission', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ plan: {} }),
    } as Response)

    render(<AcknowledgeForm employeeId={EMPLOYEE_ID} initial={allUnsigned} />)
    const checkboxes = screen.getAllByRole('checkbox')
    checkboxes.forEach((cb) => fireEvent.click(cb))
    fireEvent.click(screen.getByRole('button', { name: /Submit Acknowledgment/i }))

    await waitFor(() => {
      expect(screen.getByText(/Acknowledgment recorded/i)).toBeInTheDocument()
    })
  })

  it('shows error message when the API returns a non-OK response', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Server error' }),
    } as Response)

    render(<AcknowledgeForm employeeId={EMPLOYEE_ID} initial={allUnsigned} />)
    const checkboxes = screen.getAllByRole('checkbox')
    checkboxes.forEach((cb) => fireEvent.click(cb))
    fireEvent.click(screen.getByRole('button', { name: /Submit Acknowledgment/i }))

    await waitFor(() => {
      expect(screen.getByText(/Server error/i)).toBeInTheDocument()
    })
  })

  it('posts to the correct API endpoint with correct body', async () => {
    const mockFetch = vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ plan: {} }),
    } as Response)

    render(<AcknowledgeForm employeeId={EMPLOYEE_ID} initial={allUnsigned} />)
    const checkboxes = screen.getAllByRole('checkbox')
    checkboxes.forEach((cb) => fireEvent.click(cb))
    fireEvent.click(screen.getByRole('button', { name: /Submit Acknowledgment/i }))

    await waitFor(() => expect(mockFetch).toHaveBeenCalledOnce())

    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(`/api/onboarding/${EMPLOYEE_ID}/acknowledge`)
    const body = JSON.parse(options.body as string)
    expect(body.ndaSigned).toBe(true)
    expect(body.contractSigned).toBe(true)
    expect(body.policiesRead).toBe(true)
  })
})
