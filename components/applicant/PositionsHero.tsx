'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function PositionsHero({ count }: { count: number }) {
  return (
    <section
      style={{
        background: 'var(--navy-900)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle dot-grid background texture */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          pointerEvents: 'none',
        }}
      />

      {/* Subtle radial glow bottom-right */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          right: -100,
          bottom: -100,
          width: 500,
          height: 500,
          background: 'radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          maxWidth: 960,
          margin: '0 auto',
          padding: '72px 24px 80px',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0, 0, 0.2, 1] }}
        >
          {/* Gold label */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 24,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--gold)',
            }}
          >
            <span style={{ width: 20, height: 1, background: 'var(--gold)', display: 'inline-block' }} />
            Careers at Exchange Four
          </div>

          {/* Headline */}
          <h1
            style={{
              margin: '0 0 20px',
              fontSize: 'clamp(32px, 5vw, 48px)',
              fontWeight: 700,
              lineHeight: 1.15,
              color: '#FFFFFF',
              letterSpacing: '-0.02em',
            }}
          >
            Join a team that gives<br />
            <span style={{ color: 'var(--gold)' }}>more than it receives</span>
          </h1>

          {/* Subtext */}
          <p
            style={{
              margin: '0 0 36px',
              maxWidth: 560,
              fontSize: 17,
              lineHeight: 1.7,
              color: '#94A3B8',
              fontWeight: 400,
            }}
          >
            We operate on the principle of Exchange in Abundance — delivering
            more value than expected in everything we do. We&apos;re looking for
            people who share that belief.
          </p>

          {/* CTA */}
          <Link
            href="#positions"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 24px',
              borderRadius: 'var(--radius-md)',
              fontSize: 14,
              fontWeight: 600,
              textDecoration: 'none',
              background: 'var(--gold)',
              color: 'var(--navy-950)',
              transition: 'all var(--duration-fast) var(--ease-out)',
            }}
          >
            View {count} open position{count !== 1 ? 's' : ''}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M3 8h10M8 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
