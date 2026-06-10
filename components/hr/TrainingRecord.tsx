'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type TrainingStatus = 'IN_PROGRESS' | 'PASSED' | 'CORRECTION_NEEDED'

type TrainingTask = {
  id: string
  functionName: string
  policyRef: string | null
  status: TrainingStatus
  qualityCheckNotes: string | null
  correctionNotes: string | null
  datePassed: string | null
}

type Props = {
  planId: string
  tasks: TrainingTask[]
  employeeId: string
}

const STATUS_LABELS: Record<TrainingStatus, string> = {
  IN_PROGRESS: 'In Progress',
  PASSED: 'Passed',
  CORRECTION_NEEDED: 'Correction Needed',
}

const STATUS_COLOR: Record<TrainingStatus, string> = {
  IN_PROGRESS: '#9ca3af',
  PASSED: '#10b981',
  CORRECTION_NEEDED: '#dc2626',
}

export default function TrainingRecord({ tasks, employeeId }: Props) {
  const router = useRouter()
  const [updating, setUpdating] = useState<string | null>(null)

  const passed = tasks.filter((t) => t.status === 'PASSED').length
  const total = tasks.length
  const pct = total > 0 ? Math.round((passed / total) * 100) : 0

  async function updateStatus(taskId: string, status: TrainingStatus) {
    setUpdating(taskId)
    await fetch(`/api/training/${employeeId}/task/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    router.refresh()
    setUpdating(null)
  }

  return (
    <div>
      {/* Progress bar */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>
            Training Progress
          </span>
          <span style={{ fontSize: '13px', color: '#6b7280' }}>
            {passed}/{total} passed ({pct}%)
          </span>
        </div>
        <div style={{ height: '6px', background: '#f3f4f6', borderRadius: '3px' }}>
          <div
            style={{
              height: '6px',
              background: '#10b981',
              borderRadius: '3px',
              width: `${pct}%`,
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Task list */}
      {tasks.length === 0 ? (
        <p style={{ color: '#9ca3af', fontSize: '14px' }}>No training tasks yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              loading={updating === task.id}
              onStatusChange={(s) => updateStatus(task.id, s)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function TaskRow({
  task,
  loading,
  onStatusChange,
}: {
  task: TrainingTask
  loading: boolean
  onStatusChange: (s: TrainingStatus) => void
}) {
  return (
    <div
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: '6px',
        padding: '12px 16px',
        background: '#fff',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: '#111827' }}>
            {task.functionName}
          </p>
          {task.policyRef && (
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6b7280' }}>
              Policy: {task.policyRef}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <span
            style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: STATUS_COLOR[task.status],
              flexShrink: 0,
            }}
          />
          <select
            disabled={loading}
            value={task.status}
            onChange={(e) => onStatusChange(e.target.value as TrainingStatus)}
            style={{
              fontSize: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              padding: '3px 6px',
              background: '#fff',
              cursor: 'pointer',
              color: STATUS_COLOR[task.status],
              fontWeight: 500,
            }}
          >
            {(Object.keys(STATUS_LABELS) as TrainingStatus[]).map((s) => (
              <option key={s} value={s} style={{ color: STATUS_COLOR[s] }}>
                {loading && task.status === s ? '…' : STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {task.status === 'CORRECTION_NEEDED' && task.correctionNotes && (
        <div
          style={{
            marginTop: '8px',
            padding: '8px 10px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#dc2626',
          }}
        >
          <strong>Correction needed:</strong> {task.correctionNotes}
        </div>
      )}
      {task.status === 'PASSED' && task.qualityCheckNotes && (
        <div
          style={{
            marginTop: '8px',
            padding: '8px 10px',
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#15803d',
          }}
        >
          <strong>QC notes:</strong> {task.qualityCheckNotes}
        </div>
      )}
    </div>
  )
}
