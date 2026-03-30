'use client'

import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api'
import type { SessionUser } from '@/components/AuthGuard'
import styles from './components.module.css'

interface Notification {
  notification_id?: string
  message?: string
  title?: string
  type?: string
  read?: boolean
  created_at?: string
  [key: string]: unknown
}

function formatDate(raw?: string): string {
  if (!raw) return '—'
  try {
    return new Date(raw).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch { return raw }
}

export default function ActiveAlerts({ account }: { account: SessionUser }) {
  void account
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.getNotifications() as { notifications?: Notification[] } | Notification[]
      const list = Array.isArray(res) ? res : (res as { notifications?: Notification[] }).notifications ?? []
      setNotifications(list)
    } catch {
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  const unread = notifications.filter((n) => !n.read)
  const read = notifications.filter((n) => n.read)

  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.spinner} />
        <span className={styles.loadingText}>Loading alerts…</span>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Active Alerts</h1>

      {notifications.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <h3 className={styles.emptyTitle}>No Active Alerts</h3>
          <p className={styles.emptyText}>No active alerts.</p>
        </div>
      ) : (
        <>
          {unread.length > 0 && (
            <div className={styles.glassCard}>
              <h2 className={styles.cardTitle}>
                Unread <span style={{ color: 'var(--accent)' }}>({unread.length})</span>
              </h2>
              <div className={styles.activityList}>
                {unread.map((n, idx) => (
                  <div key={n.notification_id ?? idx} className={styles.activityRow}>
                    <div>
                      <div className={styles.activityDesc}>{n.title ?? n.message ?? 'Notification'}</div>
                      {n.message && n.title && (
                        <div className={styles.activityMeta}>{n.message}</div>
                      )}
                      <div className={styles.activityMeta}>{formatDate(n.created_at)}</div>
                    </div>
                    <span className={`${styles.badge} ${
                      n.type === 'alert' ? styles.badgeError
                        : n.type === 'info' ? styles.badgeBlue
                          : styles.badgeWarning
                    }`}>
                      {n.type ?? 'alert'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {read.length > 0 && (
            <div className={styles.glassCard}>
              <h2 className={styles.cardTitle} style={{ color: 'var(--text-muted)' }}>Read</h2>
              <div className={styles.activityList}>
                {read.map((n, idx) => (
                  <div key={n.notification_id ?? idx} className={styles.activityRow} style={{ opacity: 0.6 }}>
                    <div>
                      <div className={styles.activityDesc}>{n.title ?? n.message ?? 'Notification'}</div>
                      <div className={styles.activityMeta}>{formatDate(n.created_at)}</div>
                    </div>
                    <span className={`${styles.badge} ${styles.badgeDefault}`}>Read</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
