interface TrainingTask {
  id: string
  functionName: string
  policyRef: string | null
  status: string
  dateStarted: string | null
  datePassed: string | null
  correctionNotes: string | null
  qualityCheckNotes: string | null
}

interface TrainingPlan {
  postTitle: string
  tasks: TrainingTask[]
}

interface TrainingTabProps {
  trainingPlan: TrainingPlan | null
  employeeId: string
}

const STATUS_STYLE: Record<string, string> = {
  PASSED: 'bg-green-100 text-green-800',
  CORRECTION_NEEDED: 'bg-red-100 text-red-800',
  IN_PROGRESS: 'bg-gray-100 text-gray-600',
}

export default function TrainingTab({ trainingPlan }: TrainingTabProps) {
  if (!trainingPlan) {
    return <p className="text-sm text-gray-500">No training plan assigned yet.</p>
  }

  const passed = trainingPlan.tasks.filter(t => t.status === 'PASSED').length
  const total = trainingPlan.tasks.length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">{trainingPlan.postTitle}</h3>
        <span className="text-xs text-gray-500">{passed}/{total} passed</span>
      </div>

      {total > 0 && (
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-green-500 h-1.5 rounded-full"
            style={{ width: `${total > 0 ? Math.round((passed / total) * 100) : 0}%` }}
          />
        </div>
      )}

      <ul className="space-y-2">
        {trainingPlan.tasks.map(task => (
          <li key={task.id} className="border border-gray-100 rounded-lg p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-sm font-medium text-gray-800">{task.functionName}</span>
                {task.policyRef && (
                  <span className="ml-2 text-xs text-gray-400">{task.policyRef}</span>
                )}
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_STYLE[task.status] ?? 'bg-gray-100 text-gray-600'}`}>
                {task.status.replace('_', ' ')}
              </span>
            </div>
            {task.correctionNotes && (
              <p className="mt-1 text-xs text-red-700 bg-red-50 p-2 rounded">{task.correctionNotes}</p>
            )}
            {task.qualityCheckNotes && (
              <p className="mt-1 text-xs text-gray-500">{task.qualityCheckNotes}</p>
            )}
            <div className="flex gap-4 mt-1 text-xs text-gray-400">
              {task.dateStarted && <span>Started {new Date(task.dateStarted).toLocaleDateString()}</span>}
              {task.datePassed && <span>Passed {new Date(task.datePassed).toLocaleDateString()}</span>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
