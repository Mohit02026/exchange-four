interface OnboardingTask {
  id: string
  title: string
  description: string | null
  dueDay: number | null
  status: string
  completedAt: string | null
}

interface OnboardingPlan {
  ndaSigned: boolean
  contractSigned: boolean
  policiesRead: boolean
  tasks: OnboardingTask[]
  updatedAt: string
}

interface DailyCheckin {
  id: string
  completedToday: string
  studiedToday: string
  submittedAt: string
}

interface OnboardingTabProps {
  onboardingPlan: OnboardingPlan | null
  dailyCheckins: DailyCheckin[]
}

const CHECK = (v: boolean) => v
  ? <span className="text-green-600 font-medium">✓ Done</span>
  : <span className="text-gray-400">Not yet</span>

export default function OnboardingTab({ onboardingPlan, dailyCheckins }: OnboardingTabProps) {
  if (!onboardingPlan) {
    return <p className="text-sm text-gray-500">No onboarding plan created yet.</p>
  }

  const completed = onboardingPlan.tasks.filter(t => t.status === 'COMPLETE').length
  const total = onboardingPlan.tasks.length

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-lg">{CHECK(onboardingPlan.ndaSigned)}</div>
          <div className="text-xs text-gray-500 mt-1">NDA</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-lg">{CHECK(onboardingPlan.contractSigned)}</div>
          <div className="text-xs text-gray-500 mt-1">Contract</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-lg">{CHECK(onboardingPlan.policiesRead)}</div>
          <div className="text-xs text-gray-500 mt-1">Policies</div>
        </div>
      </div>

      {total > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700">Tasks</h3>
            <span className="text-xs text-gray-500">{completed}/{total} complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mb-3">
            <div
              className="bg-green-500 h-1.5 rounded-full"
              style={{ width: `${total > 0 ? Math.round((completed / total) * 100) : 0}%` }}
            />
          </div>
          <ul className="space-y-2">
            {onboardingPlan.tasks.map(task => (
              <li key={task.id} className="flex items-start gap-3 text-sm">
                <span className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center text-xs shrink-0 ${
                  task.status === 'COMPLETE' ? 'bg-green-100 border-green-400 text-green-700' : 'border-gray-300'
                }`}>
                  {task.status === 'COMPLETE' ? '✓' : ''}
                </span>
                <div>
                  <span className={task.status === 'COMPLETE' ? 'line-through text-gray-400' : 'text-gray-800'}>
                    {task.title}
                  </span>
                  {task.dueDay && <span className="text-xs text-gray-400 ml-2">Day {task.dueDay}</span>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {dailyCheckins.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Recent Check-ins</h3>
          <ul className="space-y-2">
            {dailyCheckins.map(c => (
              <li key={c.id} className="border border-gray-100 rounded-lg p-3 text-sm">
                <div className="text-xs text-gray-400 mb-1">{new Date(c.submittedAt).toLocaleDateString()}</div>
                <p className="text-gray-700"><strong>Completed:</strong> {c.completedToday}</p>
                <p className="text-gray-700 mt-1"><strong>Studied:</strong> {c.studiedToday}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
