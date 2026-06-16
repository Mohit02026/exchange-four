import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import AuditLogTable from '@/components/hr/AuditLogTable'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 50

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; from?: string; to?: string; action?: string; entityId?: string }>
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'HR') notFound()

  const { page: pageStr = '1', search = '', from = '', to = '', action = '', entityId = '' } = await searchParams
  const page = Math.max(1, parseInt(pageStr, 10))

  const where = {
    ...(entityId ? { entityId } : {}),
    ...(action ? { action } : {}),
    ...((from || to) ? {
      createdAt: {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to + 'T23:59:59Z') } : {}),
      },
    } : {}),
    ...(search ? {
      OR: [
        { action: { contains: search, mode: 'insensitive' as const } },
        { entityType: { contains: search, mode: 'insensitive' as const } },
        { user: { name: { contains: search, mode: 'insensitive' as const } } },
        { user: { email: { contains: search, mode: 'insensitive' as const } } },
      ],
    } : {}),
  }

  const [total, logs] = await Promise.all([
    db.auditLog.count({ where }),
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: { select: { name: true, email: true } } },
    }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const serializedLogs = JSON.parse(JSON.stringify(logs))

  const queryParams: Record<string, string> = {}
  if (search) queryParams.search = search
  if (from) queryParams.from = from
  if (to) queryParams.to = to
  if (action) queryParams.action = action
  if (entityId) queryParams.entityId = entityId

  return (
    <div style={{ padding: '36px 44px', maxWidth: 1100 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
          Audit Log
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
          {total} entries total
        </p>
      </div>

      {/* Filters */}
      <form method="GET" action="/hr/audit" style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          type="text"
          name="search"
          defaultValue={search}
          placeholder="Search action, entity, actor..."
          style={{
            padding: '7px 12px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            fontSize: 13,
            color: 'var(--text-primary)',
            width: 240,
          }}
        />
        <input
          type="date"
          name="from"
          defaultValue={from}
          style={{
            padding: '7px 10px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            fontSize: 13,
            color: 'var(--text-primary)',
          }}
        />
        <input
          type="date"
          name="to"
          defaultValue={to}
          style={{
            padding: '7px 10px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            fontSize: 13,
            color: 'var(--text-primary)',
          }}
        />
        <button type="submit" style={{
          padding: '7px 18px',
          background: 'var(--navy-800)',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          fontSize: 13,
          fontWeight: 600,
          color: '#fff',
          cursor: 'pointer',
        }}>
          Filter
        </button>
        {(search || from || to || action || entityId) && (
          <a href="/hr/audit" style={{
            padding: '7px 14px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            fontSize: 13,
            color: 'var(--text-muted)',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
          }}>
            Clear
          </a>
        )}
      </form>

      <AuditLogTable
        logs={serializedLogs}
        page={page}
        totalPages={totalPages}
        basePath="/hr/audit"
        query={queryParams}
      />
    </div>
  )
}
