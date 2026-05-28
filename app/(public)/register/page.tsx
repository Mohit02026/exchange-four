'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const form = e.currentTarget
    const get = (name: string) => (form.elements.namedItem(name) as HTMLInputElement).value

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: get('firstName'),
        lastName: get('lastName'),
        email: get('email'),
        correspondenceEmail: get('correspondenceEmail'),
        password: get('password'),
        phone: get('phone'),
        location: get('location'),
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Registration failed. Please try again.')
      setLoading(false)
      return
    }

    router.push('/login?registered=true')
  }

  return (
    <main className="max-w-md mx-auto py-12 px-4">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Create Account</h1>
      <p className="text-sm text-gray-400 mb-8">Exchange Four Personnel Desk</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="First Name" name="firstName" required />
          <Field label="Last Name" name="lastName" required />
        </div>

        <Field label="Login Email" name="email" type="email" required hint="Used to sign in to this portal" />
        <Field
          label="Correspondence Email"
          name="correspondenceEmail"
          type="email"
          required
          hint="Where we'll send application updates"
        />
        <Field label="Password" name="password" type="password" required hint="Minimum 8 characters" minLength={8} />
        <Field label="Phone" name="phone" type="tel" />
        <Field label="Location" name="location" placeholder="City, Country" />

        {error && (
          <p className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-gray-900 px-4 py-3 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Creating Account…' : 'Create Account'}
        </button>

        <p className="text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="text-gray-900 underline">
            Sign in
          </Link>
        </p>
      </form>
    </main>
  )
}

function Field({
  label,
  name,
  type = 'text',
  required,
  hint,
  placeholder,
  minLength,
}: {
  label: string
  name: string
  type?: string
  required?: boolean
  hint?: string
  placeholder?: string
  minLength?: number
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        minLength={minLength}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
      />
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  )
}
