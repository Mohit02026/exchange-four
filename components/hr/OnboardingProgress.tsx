type Props = {
  ndaSigned: boolean
  contractSigned: boolean
  policiesRead: boolean
  tasksTotal: number
  tasksComplete: number
  trainingTotal: number
  trainingPassed: number
  surveysSubmitted: number
}

type StageState = 'complete' | 'in-progress' | 'not-started'

function stageIcon(state: StageState): string {
  if (state === 'complete') return '✓'
  if (state === 'in-progress') return '⏳'
  return '—'
}

function stageColor(state: StageState): string {
  if (state === 'complete') return '#059669'
  if (state === 'in-progress') return '#d97706'
  return '#9ca3af'
}

function stageBg(state: StageState): string {
  if (state === 'complete') return 'rgba(5,150,105,0.08)'
  if (state === 'in-progress') return 'rgba(217,119,6,0.08)'
  return 'rgba(156,163,175,0.08)'
}

export default function OnboardingProgress({
  ndaSigned,
  contractSigned,
  policiesRead,
  tasksTotal,
  tasksComplete,
  trainingTotal,
  trainingPassed,
  surveysSubmitted,
}: Props) {
  const docsState: StageState =
    ndaSigned && contractSigned && policiesRead
      ? 'complete'
      : ndaSigned || contractSigned || policiesRead
        ? 'in-progress'
        : 'not-started'

  const tasksState: StageState =
    tasksTotal === 0
      ? 'not-started'
      : tasksComplete === tasksTotal
        ? 'complete'
        : tasksComplete > 0
          ? 'in-progress'
          : 'not-started'

  const trainingState: StageState =
    trainingTotal === 0
      ? 'not-started'
      : trainingPassed === trainingTotal
        ? 'complete'
        : trainingPassed > 0
          ? 'in-progress'
          : 'not-started'

  const surveysState: StageState =
    surveysSubmitted >= 1 ? 'complete' : 'not-started'

  const stages: { label: string; state: StageState; sub: string }[] = [
    {
      label: 'Documents',
      state: docsState,
      sub: `${[ndaSigned, contractSigned, policiesRead].filter(Boolean).length}/3 signed`,
    },
    {
      label: 'Tasks',
      state: tasksState,
      sub: tasksTotal > 0 ? `${tasksComplete}/${tasksTotal} complete` : 'No tasks',
    },
    {
      label: 'Training',
      state: trainingState,
      sub: trainingTotal > 0 ? `${trainingPassed}/${trainingTotal} passed` : 'No training',
    },
    {
      label: 'Surveys',
      state: surveysState,
      sub: `${surveysSubmitted} submitted`,
    },
  ]

  const completeCount = stages.filter(s => s.state === 'complete').length
  const overallPct = Math.round((completeCount / stages.length) * 100)

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '20px 24px',
      boxShadow: '0 2px 8px rgba(15,30,53,0.07)',
    }}>
      {/* Overall bar */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Onboarding Progress
          </span>
          <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
            {overallPct}%
          </span>
        </div>
        <div style={{ height: 8, background: 'var(--surface-muted)', borderRadius: 9999, overflow: 'hidden' }}>
          <div style={{
            height: 8,
            borderRadius: 9999,
            background: overallPct === 100
              ? '#059669'
              : 'linear-gradient(90deg, var(--gold-dark) 0%, var(--gold) 100%)',
            width: `${overallPct}%`,
            minWidth: overallPct > 0 ? 8 : 0,
            transition: 'width 0.6s cubic-bezier(0,0,0.2,1)',
          }} />
        </div>
      </div>

      {/* Stage badges */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {stages.map(({ label, state, sub }) => (
          <div key={label} style={{
            background: stageBg(state),
            border: `1px solid ${stageColor(state)}33`,
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: 18,
              color: stageColor(state),
              marginBottom: 4,
              fontWeight: 700,
            }}>
              {stageIcon(state)}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: stageColor(state), letterSpacing: '0.04em' }}>
              {label}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>
              {sub}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
