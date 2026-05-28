import { describe, it, expect } from 'vitest'
import { buildTemplate } from '@/lib/services/csw'

// Minimal mock that satisfies the shape buildTemplate expects
function makeApp(overrides: Record<string, unknown> = {}) {
  return {
    id: 'app-1',
    reference: 'EF-HR-APP-2026-000001',
    bio: 'Experienced operations professional',
    skills: 'Project management, communication',
    hobbies: 'Reading, cycling',
    careerGoals: 'Lead a high-performance ops team',
    whyExchangeFour: 'Aligned values',
    isGeneralApplication: false,
    applicant: {
      firstName: 'Jane',
      lastName: 'Smith',
      correspondenceEmail: 'jane@example.com',
      phone: '+44 7700 900000',
      location: 'London, UK',
    },
    position: {
      title: 'Operations Coordinator',
      orgBoardUnit: { name: 'Operations' },
    },
    review: {
      notesForAvi: 'Strong candidate',
      sections: [
        { section: 'Resume Presentation', rating: '8/10', notes: 'Clean, well-structured' },
        { section: 'Skills Match', rating: '9/10', notes: null },
      ],
    },
    ...overrides,
  } as ReturnType<typeof import('@/lib/services/csw').getApplicationForCSW> extends Promise<infer T> ? T : never
}

describe('buildTemplate', () => {
  it('includes the applicant full name in the output', () => {
    const { content } = buildTemplate(makeApp())
    expect(content).toContain('Jane Smith')
  })

  it('includes the application reference', () => {
    const { content } = buildTemplate(makeApp())
    expect(content).toContain('EF-HR-APP-2026-000001')
  })

  it('includes the position title', () => {
    const { content } = buildTemplate(makeApp())
    expect(content).toContain('Operations Coordinator')
  })

  it('shows "General Application" when isGeneralApplication is true', () => {
    const { content } = buildTemplate(makeApp({ isGeneralApplication: true, position: null }))
    expect(content).toContain('General Application')
  })

  it('includes review section ratings when present', () => {
    const { content } = buildTemplate(makeApp())
    expect(content).toContain('8/10')
  })

  it('shows "Not yet collected" for absent review sections', () => {
    const { content } = buildTemplate(makeApp({ review: { notesForAvi: null, sections: [] } }))
    expect(content).toContain('Not yet collected')
  })

  it('does not crash when orgBoardUnit is null', () => {
    const app = makeApp({ position: { title: 'Operations Coordinator', orgBoardUnit: null } })
    expect(() => buildTemplate(app)).not.toThrow()
  })

  it('populates sourceFields for every non-null value', () => {
    const { sourceFields } = buildTemplate(makeApp())
    expect(sourceFields['Position']).toBe('Operations Coordinator')
    expect(sourceFields['Email']).toBe('jane@example.com')
  })

  it('lists missing fields when data is absent', () => {
    const app = makeApp({
      applicant: {
        firstName: 'Jane',
        lastName: 'Smith',
        correspondenceEmail: 'jane@example.com',
        phone: null,
        location: null,
      },
    })
    const { missingFields } = buildTemplate(app)
    expect(missingFields).toContain('Phone')
    expect(missingFields).toContain('Location')
  })

  it('throws when app is null', () => {
    expect(() => buildTemplate(null as never)).toThrow('Application not found')
  })
})
