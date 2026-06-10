interface AuditEntry {
  id: string
  action: string
  entityType: string
  entityId: string
  createdAt: string
  metadata: Record<string, unknown>
  user: { name: string | null; email: string } | null
}

interface AuditLogTabProps {
  auditLogs: AuditEntry[]
}

export default function AuditLogTab({ auditLogs }: AuditLogTabProps) {
  if (auditLogs.length === 0) {
    return <p className="text-sm text-gray-500">No audit entries recorded.</p>
  }

  return (
    <ul className="space-y-2">
      {auditLogs.map(entry => (
        <li key={entry.id} className="flex gap-4 text-sm py-2 border-b border-gray-100">
          <span className="text-gray-400 text-xs w-32 shrink-0 pt-0.5">
            {new Date(entry.createdAt).toLocaleString()}
          </span>
          <div className="flex-1">
            <span className="font-medium text-gray-800">{entry.action}</span>
            {entry.user && (
              <span className="text-gray-500 ml-2">
                by {entry.user.name ?? entry.user.email}
              </span>
            )}
            {entry.metadata && Object.keys(entry.metadata).length > 0 && (
              <pre className="mt-1 text-xs text-gray-500 bg-gray-50 p-2 rounded overflow-x-auto">
                {JSON.stringify(entry.metadata, null, 2)}
              </pre>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
