'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

type NavItem = { href: string; label: string; icon: string[] }
type NavGroup = { label: string | null; items: NavItem[] }

function Icon({ paths }: { paths: string[] }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={{ flexShrink: 0 }}
    >
      {paths.map((d, i) => <path key={i} d={d} />)}
    </svg>
  )
}

const NAV: NavGroup[] = [
  {
    label: null,
    items: [
      {
        href: '/hr/dashboard',
        label: 'Dashboard',
        icon: ['M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M9 22V12h6v10'],
      },
    ],
  },
  {
    label: 'Pipeline',
    items: [
      {
        href: '/hr/applications',
        label: 'Applications',
        icon: [
          'M22 12h-6l-2 3h-4l-2-3H2',
          'M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z',
        ],
      },
      {
        href: '/hr/positions',
        label: 'Positions',
        icon: [
          'M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z',
          'M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2',
        ],
      },
    ],
  },
  {
    label: 'People',
    items: [
      {
        href: '/hr/onboarding',
        label: 'Onboarding',
        icon: [
          'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2',
          'M9 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8',
          'M17 11l2 2 4-4',
        ],
      },
      {
        href: '/hr/employees',
        label: 'Employees',
        icon: [
          'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2',
          'M9 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8',
          'M23 21v-2a4 4 0 0 0-3-3.87',
          'M16 3.13a4 4 0 0 1 0 7.75',
        ],
      },
      {
        href: '/hr/training',
        label: 'Training',
        icon: [
          'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z',
          'M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z',
        ],
      },
      {
        href: '/hr/statistics',
        label: 'Statistics',
        icon: ['M18 20V10', 'M12 20V4', 'M6 20v-6'],
      },
    ],
  },
  {
    label: 'Conduct',
    items: [
      {
        href: '/hr/ethics',
        label: 'Ethics',
        icon: ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'],
      },
      {
        href: '/hr/corrections',
        label: 'Corrections',
        icon: [
          'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z',
          'M12 9v4',
          'M12 17h.01',
        ],
      },
      {
        href: '/hr/offboarding',
        label: 'Offboarding',
        icon: [
          'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4',
          'M16 17l5-5-5-5',
          'M21 12H9',
        ],
      },
    ],
  },
  {
    label: 'Reports',
    items: [
      {
        href: '/hr/reports/weekly',
        label: 'Weekly Report',
        icon: [
          'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z',
          'M14 2v6h6',
          'M16 13H8',
          'M16 17H8',
        ],
      },
    ],
  },
  {
    label: null,
    items: [
      {
        href: '/hr/settings',
        label: 'Settings',
        icon: [
          'M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16z',
          'M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
          'M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41',
        ],
      },
    ],
  },
]

export default function HRNav() {
  const pathname = usePathname()
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <nav style={{ padding: '6px 0', flex: 1, overflowY: 'auto' }}>
      {NAV.map(({ label, items }, gi) => (
        <div key={gi} style={{ marginBottom: label ? 2 : 0 }}>

          {label && (
            <div style={{
              padding: '14px 20px 5px',
              fontSize: 9.5,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#4E6E8C',
            }}>
              {label}
            </div>
          )}

          {items.map(({ href, label: itemLabel, icon }) => {
            const active =
              pathname === href ||
              (href !== '/hr/dashboard' && pathname.startsWith(href))
            const isHovered = hovered === href && !active

            return (
              <Link
                key={href}
                href={href}
                onMouseEnter={() => setHovered(href)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  padding: '7px 12px',
                  margin: '1px 8px',
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  color: active ? '#FFFFFF' : isHovered ? '#B8CCDF' : '#7A9AB8',
                  textDecoration: 'none',
                  borderRadius: 7,
                  background: active
                    ? 'rgba(255,255,255,0.09)'
                    : isHovered
                    ? 'rgba(255,255,255,0.04)'
                    : 'transparent',
                  boxShadow: active ? 'inset 2.5px 0 0 var(--gold)' : 'none',
                  transition: 'color 120ms ease, background 120ms ease, box-shadow 120ms ease',
                  letterSpacing: '0.01em',
                }}
              >
                <Icon paths={icon} />
                <span style={{ flex: 1 }}>{itemLabel}</span>
              </Link>
            )
          })}
        </div>
      ))}
    </nav>
  )
}
