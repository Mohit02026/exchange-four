interface EmployeeHeaderProps {
  employee: {
    id: string
    firstName: string
    lastName: string
    startDate: string | null
    onboardingPlan: {
      tasks: { status: string }[]
    } | null
    trainingPlan: {
      tasks: { status: string }[]
    } | null
    statistics: { entries: { value: number }[] }[]
  }
  application: {
    files: { type: string; fileUrl: string }[]
    position: { title: string } | null
  } | null
}

export default function EmployeeHeader({ employee, application }: EmployeeHeaderProps) {
  const photo = application?.files.find(f => f.type === 'PHOTO')

  const onboardingTasks = employee.onboardingPlan?.tasks ?? []
  const onboardingPct = onboardingTasks.length > 0
    ? Math.round((onboardingTasks.filter(t => t.status === 'COMPLETE').length / onboardingTasks.length) * 100)
    : 0

  const trainingTasks = employee.trainingPlan?.tasks ?? []
  const trainingPct = trainingTasks.length > 0
    ? Math.round((trainingTasks.filter(t => t.status === 'PASSED').length / trainingTasks.length) * 100)
    : 0

  return (
    <div className="flex items-start gap-5 mb-8 pb-6 border-b border-gray-200">
      <div className="w-16 h-16 rounded-full bg-gray-200 shrink-0 overflow-hidden">
        {photo ? (
          <img src={photo.fileUrl} alt={`${employee.firstName} ${employee.lastName}`} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl">
            {employee.firstName[0]}{employee.lastName[0]}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h1 className="text-xl font-bold text-gray-900">
          {employee.firstName} {employee.lastName}
        </h1>
        {application?.position && (
          <p className="text-sm text-gray-500 mt-0.5">{application.position.title}</p>
        )}
        {employee.startDate && (
          <p className="text-xs text-gray-400 mt-0.5">
            Started {new Date(employee.startDate).toLocaleDateString()}
          </p>
        )}

        <div className="flex flex-wrap gap-4 mt-3">
          <div className="text-sm">
            <span className="text-gray-500">Onboarding </span>
            <span className="font-semibold text-gray-800">{onboardingPct}%</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-500">Training </span>
            <span className="font-semibold text-gray-800">{trainingPct}%</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-500">Stats </span>
            <span className="font-semibold text-gray-800">{employee.statistics.length}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
