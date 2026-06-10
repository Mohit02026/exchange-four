'use client'

import { useState } from 'react'

interface Tab {
  key: string
  label: string
  hidden?: boolean
}

interface ProfileTabsProps {
  tabs: Tab[]
  children: React.ReactNode[]
}

export default function ProfileTabs({ tabs, children }: ProfileTabsProps) {
  const visibleTabs = tabs.filter(t => !t.hidden)
  const [active, setActive] = useState(visibleTabs[0]?.key ?? '')

  const activeIndex = visibleTabs.findIndex(t => t.key === active)
  const content = children[tabs.findIndex(t => t.key === active)]

  return (
    <div>
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex gap-1 overflow-x-auto">
          {visibleTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActive(tab.key)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                active === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div key={active}>{activeIndex >= 0 ? content : null}</div>
    </div>
  )
}
