import Link from 'next/link'

type AuditEntry = {
  id: string
  action: string
  entityType: string
  entityId: string
  createdAt: string
  user: { name: string | null; email: string | null } | null
  metadata: Record<string, unknown>
}

type Props = {
  logs: AuditEntry[]
  page: number
  totalPages: number
  basePath: string
  query: Record<string, string>
}

function buildUrl(basePath: string, query: Record<string, string>, page: number) {
  const params = new URLSearchParams({ ...query, page: String(page) })
  return `${basePath}?${params.toString()}`
}

export default function AuditLogTable({ logs, page, totalPages, basePath, query }: Props) {
  if (logs.length === 0) {
    return (
      <div style={{
        padding: '40px 20px',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: 13,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
      }}>
        No audit entries found.
      </div>
    )
  }

  return (
    <div>
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--surface-raised)', borderBottom: '1px solid var(--border)' }}>
              {['Timestamp', 'Actor', 'Action', 'Entity', 'Details'].map(h => (
                <th key={h} style={{
                  padding: '10px 16px',
                  textAlign: 'left',
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.map((log, i) => (
              <tr key={log.id} style={{
                borderBottom: i < logs.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <td style={{ padding: '10px 16px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {new Date(log.createdAt).toLocaleString('en-GB', {
                    day: 'numeric', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </td>
                <td style={{ padding: '10px 16px' }}>
                  {log.user ? (
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {log.user.name ?? log.user.email ?? '—'}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>System</span>
                  )}
                </td>
                <td style={{ padding: '10px 16px' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    background: 'var(--surface-muted)',
                    borderRadius: 4,
                    fontFamily: 'monospace',
                    fontSize: 11,
                    color: 'var(--text-secondary)',
                  }}>
                    {log.action}
                  </span>
                </td>
                <td style={{ padding: '10px 16px', color: 'var(--text-muted)', fontSize: 12 }}>
                  <div>{log.entityType}</div>
                  <div style={{ fontSize: 10, fontFamily: 'monospace', opacity: 0.7 }}>
                    {log.entityId.slice(0, 12)}…
                  </div>
                </td>
                <td style={{ padding: '10px 16px', maxWidth: 240 }}>
                  {Object.keys(log.metadata ?? {}).length > 0 ? (
                    <span style={{
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}>
                      {JSON.stringify(log.metadata)}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', opacity: 0.4 }}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 16,
          fontSize: 13,
          color: 'var(--text-muted)',
        }}>
          <span>Page {page} of {totalPages}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {page > 1 && (
              <Link href={buildUrl(basePath, query, page - 1)} style={{
                padding: '5px 14px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                fontSize: 12,
                fontWeight: 500,
              }}>
                ← Previous
              </Link>
            )}
            {page < totalPages && (
              <Link href={buildUrl(basePath, query, page + 1)} style={{
                padding: '5px 14px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                fontSize: 12,
                fontWeight: 500,
              }}>
                Next →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
