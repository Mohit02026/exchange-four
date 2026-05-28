'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import FileUploader from '@/components/shared/FileUploader'

interface Position {
  id: string
  title: string
  orgBoardUnit: { name: string } | null
}

interface Props {
  positions: Position[]
  initialPositionId?: string
}

const TEXT_FIELDS = [
  { name: 'bio', label: 'Bio', placeholder: 'Tell us about yourself…' },
  { name: 'skills', label: 'Skills', placeholder: 'List your key skills and experience…' },
  { name: 'hobbies', label: 'Hobbies & Interests', placeholder: 'What do you enjoy outside of work?' },
  { name: 'careerGoals', label: 'Career Goals', placeholder: 'Where do you see yourself in 3–5 years?' },
  { name: 'whyExchangeFour', label: 'Why Exchange Four?', placeholder: 'Why are you interested in joining us?' },
]

export default function ApplicationForm({ positions, initialPositionId }: Props) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const res = await fetch('/api/applications', {
      method: 'POST',
      body: new FormData(e.currentTarget),
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong. Please try again.')
      setSubmitting(false)
      return
    }

    router.push('/status')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Position */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
        <select
          name="positionId"
          defaultValue={initialPositionId ?? ''}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 bg-white"
        >
          <option value="">General Application</option>
          {positions.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}{p.orgBoardUnit ? ` — ${p.orgBoardUnit.name}` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* File uploads */}
      <div className="space-y-4 rounded-lg border border-gray-100 bg-gray-50 p-4">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Documents</p>
        <FileUploader
          label="CV / Resume"
          name="cv"
          accept=".pdf,.doc,.docx"
          hint="PDF, DOC, or DOCX"
          required
        />
        <FileUploader
          label="Photo"
          name="photo"
          accept=".jpg,.jpeg,.png,.webp"
          hint="JPG, PNG, or WEBP"
          required
        />
        <FileUploader
          label="Video Introduction (1–2 minutes)"
          name="video"
          accept=".mp4,.mov"
          hint="MP4 or MOV · max 200 MB"
          required
        />
      </div>

      {/* Text fields */}
      <div className="space-y-4">
        {TEXT_FIELDS.map(({ name, label, placeholder }) => (
          <div key={name}>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
              {label} <span className="text-red-500">*</span>
            </label>
            <textarea
              id={name}
              name={name}
              required
              rows={4}
              placeholder={placeholder}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
          </div>
        ))}
      </div>

      {error && (
        <p className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-gray-900 px-4 py-3 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50 transition-colors"
      >
        {submitting ? 'Submitting…' : 'Submit Application'}
      </button>
    </form>
  )
}
