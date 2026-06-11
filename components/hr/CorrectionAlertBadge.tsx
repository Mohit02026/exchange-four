interface CorrectionAlertBadgeProps {
  count: number
}

export default function CorrectionAlertBadge({ count }: CorrectionAlertBadgeProps) {
  if (count === 0) return null
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      background: '#fef3c7',
      color: '#b45309',
      border: '1px solid #fcd34d',
      borderRadius: 99,
      padding: '2px 10px',
      fontSize: 12,
      fontWeight: 600,
    }}>
      ⚠ {count} Correction{count !== 1 ? 's' : ''}
    </span>
  )
}
