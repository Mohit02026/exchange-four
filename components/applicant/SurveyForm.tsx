'use client'

import { useState } from 'react'

export default function SurveyForm() {
  const [form, setForm] = useState({
    howDidItGo: '',
    stillInterested: true,
    whatWasClear: '',
    whatWasUnclear: '',
    openQuestions: '',
    excitementScore: 7,
    anythingElse: '',
  })
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  function text(key: keyof typeof form) {
    return {
      value: form[key] as string,
      onChange: (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) =>
        setForm(prev => ({ ...prev, [key]: e.target.value })),
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, excitementScore: Number(form.excitementScore) }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Submission failed')
      }
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  if (done) {
    return (
      <div className="rounded-lg border border-gray-200 p-8 text-center">
        <div className="text-2xl mb-3">✓</div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Thank you for your feedback</h2>
        <p className="text-sm text-gray-500">Your responses have been recorded. We&apos;ll be in touch soon.</p>
      </div>
    )
  }

  const inputClass = "mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
  const labelClass = "block text-sm font-medium text-gray-700"

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className={labelClass}>How did the interview go overall? *</label>
        <textarea
          required
          rows={3}
          placeholder="Share your thoughts on how it went…"
          className={inputClass}
          {...text('howDidItGo')}
        />
      </div>

      <div>
        <label className={labelClass}>On a scale of 1–10, how excited are you about this role? *</label>
        <div className="flex items-center gap-4 mt-2">
          <input
            type="range"
            min={1}
            max={10}
            value={form.excitementScore}
            onChange={e => setForm(prev => ({ ...prev, excitementScore: Number(e.target.value) }))}
            className="flex-1"
          />
          <span className="w-8 text-center text-sm font-semibold text-gray-900">{form.excitementScore}</span>
        </div>
      </div>

      <div>
        <label className={labelClass}>Are you still interested in this position?</label>
        <div className="flex gap-6 mt-2">
          {[true, false].map(val => (
            <label key={String(val)} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="stillInterested"
                checked={form.stillInterested === val}
                onChange={() => setForm(prev => ({ ...prev, stillInterested: val }))}
              />
              {val ? 'Yes' : 'No'}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className={labelClass}>What felt clear and aligned with your expectations?</label>
        <textarea
          rows={2}
          className={inputClass}
          {...text('whatWasClear')}
        />
      </div>

      <div>
        <label className={labelClass}>What was unclear or surprised you?</label>
        <textarea
          rows={2}
          className={inputClass}
          {...text('whatWasUnclear')}
        />
      </div>

      <div>
        <label className={labelClass}>Any open questions you&apos;d like answered?</label>
        <textarea
          rows={2}
          className={inputClass}
          {...text('openQuestions')}
        />
      </div>

      <div>
        <label className={labelClass}>Anything else you&apos;d like to share?</label>
        <textarea
          rows={2}
          className={inputClass}
          {...text('anythingElse')}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-md bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
      >
        {saving ? 'Submitting…' : 'Submit Feedback'}
      </button>
    </form>
  )
}
