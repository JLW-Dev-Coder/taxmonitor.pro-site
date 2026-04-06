'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { api } from '@/lib/api'
import type { SessionUser } from './AuthGuard'
import styles from './AppShell.module.css'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: 'grid' },
  { href: '/dashboard/profile', label: 'Profile', icon: 'user' },
  { href: '/calendar', label: 'Calendar', icon: 'calendar' },
  { href: '/messages', label: 'Messages', icon: 'mail' },
  { href: '/office', label: 'Office', icon: 'credit-card' },
  { href: '/report', label: 'Report', icon: 'file-text' },
  { href: '/status', label: 'Status', icon: 'activity' },
  { href: '/support', label: 'Support', icon: 'life-buoy' },
  { href: '/affiliate', label: 'Affiliate', icon: 'share' },
] as const

function NavIcon({ icon }: { icon: string }) {
  switch (icon) {
    case 'grid':
      return (
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      )
    case 'user':
      return (
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    case 'calendar':
      return (
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      )
    case 'mail':
      return (
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M22 7l-10 6L2 7" />
        </svg>
      )
    case 'credit-card':
      return (
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <rect x="1" y="4" width="22" height="16" rx="2" />
          <path d="M1 10h22" />
        </svg>
      )
    case 'file-text':
      return (
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
        </svg>
      )
    case 'activity':
      return (
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      )
    case 'life-buoy':
      return (
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="4" />
          <path d="M4.93 4.93l4.24 4.24M14.83 14.83l4.24 4.24M14.83 9.17l4.24-4.24M4.93 19.07l4.24-4.24" />
        </svg>
      )
    case 'share':
      return (
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path strokeLinecap="round" d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
        </svg>
      )
    default:
      return null
  }
}

interface AppShellProps {
  account: SessionUser
  children: React.ReactNode
}

export default function AppShell({ account, children }: AppShellProps) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const initials =
    (account.first_name?.[0] || account.email[0] || 'T').toUpperCase() +
    (account.last_name?.[0] || 'M').toUpperCase()

  const handleLogout = useCallback(async () => {
    try {
      await api.logout()
    } catch {
      /* ignore */
    }
    sessionStorage.removeItem('tmp_session_id')
    sessionStorage.removeItem('tmp_email')
    window.location.href = '/sign-in'
  }, [])

  const closeSidebar = useCallback(() => setSidebarOpen(false), [])

  return (
    <div className={styles.shell}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className={styles.overlay} onClick={closeSidebar} />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <Link href="/" className={styles.logoLink} onClick={closeSidebar}>
            <span className={styles.logoChip}>TM</span>
            <div className={styles.logoText}>
              <span className={styles.logoTitle}>Tax Monitor</span>
              <span className={styles.logoSub}>Pro Dashboard</span>
            </div>
          </Link>
        </div>

        <nav className={styles.nav}>
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                onClick={closeSidebar}
              >
                <NavIcon icon={item.icon} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <Link href="/" className={styles.backLink} onClick={closeSidebar}>
            &larr; Back to site
          </Link>
        </div>
      </aside>

      {/* Main area */}
      <div className={styles.main}>
        {/* Topbar */}
        <header className={styles.topbar}>
          <button
            type="button"
            className={styles.menuToggle}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className={styles.topbarRight}>
            <span className={styles.planBadge}>{account.plan || 'Free'}</span>
            <span className={styles.accountName}>
              {account.first_name || account.email.split('@')[0]}
            </span>
            {account.avatar_url ? (
              <img
                src={account.avatar_url}
                alt="Avatar"
                className={styles.avatar}
              />
            ) : (
              <div className={styles.avatarChip}>{initials}</div>
            )}
            <button
              type="button"
              className={styles.logoutBtn}
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  )
}
