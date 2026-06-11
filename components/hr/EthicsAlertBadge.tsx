interface EthicsAlertBadgeProps {
  count: number
}

export default function EthicsAlertBadge({ count }: EthicsAlertBadgeProps) {
  if (count < 5) return null

  return (
    <span
      title={`${count} ethics reports — threshold reached`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        background: '#dc2626',
        color: '#fff',
        fontSize: 11,
        fontWeight: 700,
        padding: '2px 8px',
        borderRadius: 9999,
      }}
    >
      ⚠ {count} Ethics Reports
    </span>
  )
}
