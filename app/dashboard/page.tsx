'use client'

import { useState } from 'react'
import AuthGuard from '@/components/AuthGuard'
import AppShell from '@/components/AppShell'
import type { SessionUser } from '@/components/AuthGuard'

import DashboardHome from './components/DashboardHome'
import Tokens from './components/Tokens'
import ActiveAlerts from './components/ActiveAlerts'
import ESign2848 from './components/ESign2848'
import ComplianceReport from './components/ComplianceReport'
import TranscriptChanges from './components/TranscriptChanges'
import Receipts from './components/Receipts'
import ProProfile from './components/ProProfile'
import HelpCenter from './components/HelpCenter'

import styles from './page.module.css'

/* ── Nav definition ── */
type ViewKey =
  | 'home'
  | 'tokens'
  | 'activeAlerts'
  | 'eSign2848'
  | 'complianceReport'
  | 'transcriptChanges'
  | 'receipts'
  | 'myProfile'
  | 'helpCenter'

interface NavItem {
  key: ViewKey
  label: string
  icon: React.ReactNode
  section: string
}

const NAV_ITEMS: NavItem[] = [
  {
    key: 'home',
    label: 'Dashboard',
    section: 'Overview',
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    key: 'complianceReport',
    label: 'Compliance Report',
    section: 'Tools',
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key: 'transcriptChanges',
    label: 'Transcript Changes',
    section: 'Tools',
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
  },
  {
    key: 'eSign2848',
    label: 'ESign 2848',
    section: 'Tools',
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    ),
  },
  {
    key: 'activeAlerts',
    label: 'Active Alerts',
    section: 'Monitoring',
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
  {
    key: 'tokens',
    label: 'Tokens',
    section: 'Monitoring',
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <path strokeLinecap="round" d="M12 8v4l3 3" />
      </svg>
    ),
  },
  {
    key: 'receipts',
    label: 'Receipts',
    section: 'Finance',
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path d="M9 14l2 2 4-4M7 4v1a1 1 0 001 1h8a1 1 0 001-1V4M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    key: 'myProfile',
    label: 'My Profile',
    section: 'Account',
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    key: 'helpCenter',
    label: 'Help Center',
    section: 'Account',
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" />
      </svg>
    ),
  },
]

/* Group nav items by section */
function groupBySections(items: NavItem[]) {
  const map = new Map<string, NavItem[]>()
  for (const item of items) {
    if (!map.has(item.section)) map.set(item.section, [])
    map.get(item.section)!.push(item)
  }
  return map
}

/* ── Page Export ── */
export default function DashboardPage() {
  return (
    <AuthGuard>
      {({ account }) => (
        <AppShell account={account}>
          <DashboardSPA account={account} />
        </AppShell>
      )}
    </AuthGuard>
  )
}

/* ── SPA shell ── */
function DashboardSPA({ account }: { account: SessionUser }) {
  const [activeView, setActiveView] = useState<ViewKey>('home')
  const sections = groupBySections(NAV_ITEMS)

  return (
    <div className={styles.layout}>
      {/* Inner sidebar */}
      <aside className={styles.innerSidebar}>
        {Array.from(sections.entries()).map(([section, items]) => (
          <div key={section} className={styles.sidebarSection}>
            <div className={styles.sidebarSectionLabel}>{section}</div>
            {items.map((item) => (
              <button
                key={item.key}
                className={`${styles.navBtn} ${activeView === item.key ? styles.navBtnActive : ''}`}
                onClick={() => setActiveView(item.key)}
              >
                <span className={styles.navBtnIcon}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        ))}
      </aside>

      {/* Main content */}
      <div className={styles.innerContent}>
        {activeView === 'home' && <DashboardHome account={account} />}
        {activeView === 'tokens' && <Tokens account={account} />}
        {activeView === 'activeAlerts' && <ActiveAlerts account={account} />}
        {activeView === 'eSign2848' && <ESign2848 account={account} />}
        {activeView === 'complianceReport' && <ComplianceReport account={account} />}
        {activeView === 'transcriptChanges' && <TranscriptChanges account={account} />}
        {activeView === 'receipts' && <Receipts account={account} />}
        {activeView === 'myProfile' && <ProProfile account={account} />}
        {activeView === 'helpCenter' && <HelpCenter account={account} />}
      </div>
    </div>
  )
}
