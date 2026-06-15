'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Position {
  id: string
  title: string
  orgBoardUnit: { name: string } | null
  employmentType: string | null
  location: string | null
  compensationRange: string | null
  purpose: string | null
}

export default function PositionCard({
  position,
  index = 0,
}: {
  position: Position
  index?: number
}) {
  const router = useRouter()
  const meta = [
    position.orgBoardUnit?.name,
    position.employmentType,
    position.location,
  ].filter(Boolean)

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        ease: [0, 0, 0.2, 1],
        delay: index * 0.05,
      }}
    >
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xs)',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          cursor: 'pointer',
          transition: 'box-shadow var(--duration-base) var(--ease-out), border-color var(--duration-base) var(--ease-out)',
        }}
        onClick={() => router.push(`/positions/${position.id}`)}
        onMouseEnter={(e) => {
          const el = e.currentTarget
          el.style.boxShadow = 'var(--shadow-md)'
          el.style.borderColor = 'var(--border-strong)'
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget
          el.style.boxShadow = 'var(--shadow-xs)'
          el.style.borderColor = 'var(--border)'
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h2
            style={{
              margin: 0,
              fontSize: 15,
              fontWeight: 600,
              color: 'var(--text-primary)',
              lineHeight: 1.4,
            }}
          >
            {position.title}
          </h2>

          {meta.length > 0 && (
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
              {meta.join(' · ')}
            </p>
          )}

          {position.purpose && (
            <p
              style={{
                margin: '6px 0 0',
                fontSize: 13,
                color: 'var(--text-muted)',
                lineHeight: 1.5,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {position.purpose}
            </p>
          )}

          {position.compensationRange && (
            <p
              style={{
                margin: '4px 0 0',
                fontSize: 12,
                color: 'var(--text-muted)',
              }}
            >
              {position.compensationRange}
            </p>
          )}
        </div>

        <Link
          href={`/apply?position=${position.id}`}
          onClick={(e) => e.stopPropagation()}
          style={{
            flexShrink: 0,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '9px 18px',
            borderRadius: 'var(--radius-md)',
            fontSize: 13,
            fontWeight: 600,
            textDecoration: 'none',
            background: 'var(--color-primary)',
            color: '#FFFFFF',
            transition: 'background var(--duration-fast) var(--ease-out)',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'var(--color-primary-hover)'
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'var(--color-primary)'
          }}
        >
          Apply
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
            <path d="M2 6.5h9M7 2l4.5 4.5L7 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    </motion.div>
  )
}
