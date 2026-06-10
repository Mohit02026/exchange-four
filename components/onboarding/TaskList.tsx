'use client'

import { useState } from 'react'

type Task = {
  id: string
  title: string
  description: string | null
  dueDay: number | null
  status: string
  completedAt: string | null
}

export default function TaskList({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState(initialTasks)
  const [loading, setLoading] = useState<string | null>(null)

  const completed = tasks.filter((t) => t.status === 'COMPLETE').length
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0

  async function toggleTask(task: Task) {
    setLoading(task.id)
    const res = await fetch('/api/onboarding/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId: task.id, complete: task.status !== 'COMPLETE' }),
    })
    if (res.ok) {
      const updated = await res.json()
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, ...updated } : t)))
    }
    setLoading(null)
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '14px', color: '#6b7280' }}>{completed} of {tasks.length} tasks complete</span>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#111' }}>{progress}%</span>
        </div>
        <div style={{ height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: '#10b981', borderRadius: '4px', transition: 'width 0.3s' }} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {tasks.map((task) => (
          <div
            key={task.id}
            style={{
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              opacity: task.status === 'COMPLETE' ? 0.7 : 1,
            }}
          >
            <button
              onClick={() => toggleTask(task)}
              disabled={loading === task.id}
              style={{
                width: '20px',
                height: '20px',
                minWidth: '20px',
                borderRadius: '4px',
                border: task.status === 'COMPLETE' ? 'none' : '2px solid #d1d5db',
                background: task.status === 'COMPLETE' ? '#10b981' : '#fff',
                cursor: loading === task.id ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: '2px',
              }}
            >
              {task.status === 'COMPLETE' && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
            <div style={{ flex: 1 }}>
              <div style={{
                fontWeight: 500,
                fontSize: '14px',
                color: '#111',
                textDecoration: task.status === 'COMPLETE' ? 'line-through' : 'none',
              }}>
                {task.title}
              </div>
              {task.description && (
                <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>{task.description}</div>
              )}
            </div>
            {task.dueDay && task.status !== 'COMPLETE' && (
              <span style={{ fontSize: '12px', color: '#9ca3af', whiteSpace: 'nowrap' }}>Day {task.dueDay}</span>
            )}
            {task.completedAt && (
              <span style={{ fontSize: '12px', color: '#10b981', whiteSpace: 'nowrap' }}>
                {new Date(task.completedAt).toLocaleDateString('en-GB')}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
