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
  const tasks = employee.onboardingPlan?.tasks ?? []
  const completed = tasks.filter((t) => t.status === 'COMPLETE').length
  const total = tasks.length
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  const [loading, setLoading] = useState<string | null>(null)

  async function toggleTask(taskId: string, currentStatus: string) {
    setLoading(taskId)
    const complete = currentStatus !== 'COMPLETE'
    await fetch(`/api/onboarding/${employee.id}/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ complete }),
    })
    router.refresh()
    setLoading(null)
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

      {/* Tasks */}
      <div className="divide-y divide-gray-50 bg-white">
        {tasks.map((task) => {
          const done = task.status === 'COMPLETE'
          return (
            <div key={task.id} className="flex items-start gap-3 px-6 py-3">
              <button
                onClick={() => toggleTask(task.id, task.status)}
                disabled={loading === task.id}
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
