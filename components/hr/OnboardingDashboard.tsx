'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Task = {
  id: string
  title: string
  description: string | null
  dueDay: number | null
  status: string
  completedAt: Date | null
}

type Employee = {
  id: string
  firstName: string
  lastName: string
  startDate: Date | null
  onboardingPlan: {
    ndaSigned: boolean
    contractSigned: boolean
    policiesRead: boolean
    tasks: Task[]
  } | null
}

const POLICY_FLAGS: { key: 'ndaSigned' | 'contractSigned' | 'policiesRead'; label: string }[] = [
  { key: 'ndaSigned', label: 'NDA Signed' },
  { key: 'contractSigned', label: 'Contract Signed' },
  { key: 'policiesRead', label: 'Policies Read' },
]

export default function OnboardingDashboard({ employees }: { employees: Employee[] }) {
  if (employees.length === 0) {
    return (
      <div className="text-center py-16 text-sm text-gray-400">
        No employees in onboarding yet.
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {employees.map((emp) => (
        <EmployeeCard key={emp.id} employee={emp} />
      ))}
    </div>
  )
}

function EmployeeCard({ employee }: { employee: Employee }) {
  const router = useRouter()
  const plan = employee.onboardingPlan
  const tasks = plan?.tasks ?? []
  const completed = tasks.filter((t) => t.status === 'COMPLETE').length
  const total = tasks.length
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  const [taskLoading, setTaskLoading] = useState<string | null>(null)
  const [policyLoading, setPolicyLoading] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function toggleTask(taskId: string, currentStatus: string) {
    setTaskLoading(taskId)
    await fetch(`/api/onboarding/${employee.id}/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ complete: currentStatus !== 'COMPLETE' }),
    })
    router.refresh()
    setTaskLoading(null)
  }

  async function togglePolicy(field: 'ndaSigned' | 'contractSigned' | 'policiesRead', current: boolean) {
    setPolicyLoading(field)
    await fetch(`/api/onboarding/${employee.id}/policies`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ field, value: !current }),
    })
    router.refresh()
    setPolicyLoading(null)
  }

  function copyLink() {
    const url = `${window.location.origin}/acknowledge/${employee.id}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between bg-white border-b border-gray-100">
        <div>
          <p className="font-semibold text-gray-900">
            {employee.firstName} {employee.lastName}
          </p>
          {employee.startDate && (
            <p className="text-xs text-gray-400 mt-0.5">
              Start: {new Date(employee.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-700">{pct}%</p>
          <p className="text-xs text-gray-400">{completed}/{total} tasks</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-100">
        <div className="h-1 bg-gray-900 transition-all" style={{ width: `${pct}%` }} />
      </div>

      {/* Policy acknowledgment section */}
      {plan && (
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Document Acknowledgment</p>
            <button
              onClick={copyLink}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              {copied ? '✓ Copied!' : 'Copy employee link ↗'}
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            {POLICY_FLAGS.map(({ key, label }) => {
              const isChecked = plan[key]
              const isLoading = policyLoading === key
              return (
                <button
                  key={key}
                  onClick={() => togglePolicy(key, isChecked)}
                  disabled={isLoading}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    isChecked
                      ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400'
                  }`}
                >
                  <span className={`w-3 h-3 rounded-full border flex-shrink-0 flex items-center justify-center ${
                    isChecked ? 'bg-green-500 border-green-500' : 'border-gray-300'
                  }`}>
                    {isChecked && (
                      <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 10 8">
                        <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  {isLoading ? '…' : label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Tasks */}
      <div className="divide-y divide-gray-50 bg-white">
        {tasks.map((task) => {
          const done = task.status === 'COMPLETE'
          return (
            <div key={task.id} className="flex items-start gap-3 px-6 py-3">
              <button
                onClick={() => toggleTask(task.id, task.status)}
                disabled={taskLoading === task.id}
                className={`mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                  done ? 'bg-gray-900 border-gray-900' : 'border-gray-300 hover:border-gray-500'
                }`}
              >
                {done && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8">
                    <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${done ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                  {task.title}
                  {task.dueDay && (
                    <span className="ml-2 text-xs text-gray-400">Day {task.dueDay}</span>
                  )}
                </p>
                {task.description && (
                  <p className="text-xs text-gray-400 mt-0.5">{task.description}</p>
                )}
              </div>
              {task.completedAt && (
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {new Date(task.completedAt).toLocaleDateString('en-GB')}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
