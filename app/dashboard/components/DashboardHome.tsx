'use client'

import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api'
import type { SessionUser } from '@/components/AuthGuard'
import styles from './components.module.css'

interface Notification {
  notification_id?: string
  message?: string
  type?: string
  read?: boolean
  created_at?: string
  [key: string]: unknown
}

interface Receipt {
  receipt_id?: string
  date?: string
  description?: string
  amount?: number
  status?: string
  [key: string]: unknown
}

function formatAmount(cents: number): string {
  const dollars = typeof cents === 'number' ? cents / 100 : 0
  return `$${dollars.toFixed(2)}`
}

function formatDate(raw?: string): string {
  if (!raw) return '—'
  try {
    return new Date(raw).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return raw
  }
}

export default function DashboardHome({ account }: { account: SessionUser }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [loadingNotif, setLoadingNotif] = useState(true)
  const [loadingReceipts, setLoadingReceipts] = useState(true)
  const [tokenBalance, setTokenBalance] = useState<number | null>(null)
  const [loadingTokens, setLoadingTokens] = useState(true)

  const fetchData = useCallback(async () => {
    // Notifications
    try {
      const res = await api.getNotifications() as { notifications?: Notification[] } | Notification[]
      const list = Array.isArray(res) ? res : (res as { notifications?: Notification[] }).notifications ?? []
      setNotifications(list)
    } catch {
      setNotifications([])
    } finally {
      setLoadingNotif(false)
    }

    // Receipts
    try {
      const res = await api.getReceipts(account.account_id) as { receipts?: Receipt[] } | Receipt[]
      const list = Array.isArray(res) ? res : (res as { receipts?: Receipt[] }).receipts ?? []
      setReceipts(list)
    } catch {
      setReceipts([])
    } finally {
      setLoadingReceipts(false)
    }

    // Token balance
    try {
      const res = await api.getTokenBalance(account.account_id)
      setTokenBalance(res.transcript_tokens + res.tax_game_tokens)
    } catch {
      setTokenBalance(null)
    } finally {
      setLoadingTokens(false)
    }
  }, [account.account_id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const pendingAlerts = notifications.filter((n) => !n.read).length
  const recentReceipts = receipts.slice(0, 5)

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Dashboard</h1>

      <div className={styles.summaryRow}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Active Clients</div>
          <div className={styles.summaryValue}>0</div>
          <div className={styles.summaryNote}>No clients enrolled</div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Pending Alerts</div>
          <div className={styles.summaryValue}>
            {loadingNotif ? '—' : pendingAlerts}
          </div>
          <div className={styles.summaryNote}>Unread notifications</div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Token Balance</div>
          <div className={styles.summaryValue}>
            {loadingTokens ? '—' : (tokenBalance ?? '—')}
          </div>
          <div className={styles.summaryNote}>Total available tokens</div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Recent Payments</div>
          <div className={styles.summaryValue}>
            {loadingReceipts ? '—' : recentReceipts.length}
          </div>
          <div className={styles.summaryNote}>Last 5 transactions</div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className={styles.glassCard}>
        <h2 className={styles.cardTitle}>Recent Activity</h2>
        {loadingReceipts ? (
          <div className={styles.loadingWrap} style={{ padding: '2rem' }}>
            <div className={styles.spinner} />
          </div>
        ) : recentReceipts.length === 0 ? (
          <div className={styles.emptyState} style={{ padding: '2rem' }}>
            <p className={styles.emptyText}>No recent payment activity.</p>
          </div>
        ) : (
          <div className={styles.activityList}>
            {recentReceipts.map((r, idx) => (
              <div key={r.receipt_id ?? idx} className={styles.activityRow}>
                <div>
                  <div className={styles.activityDesc}>{r.description || 'Payment'}</div>
                  <div className={styles.activityMeta}>{formatDate(r.date)}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', color: 'var(--text)', fontWeight: 600 }}>
                    {r.amount != null ? formatAmount(r.amount) : '—'}
                  </span>
                  <span
                    className={`${styles.badge} ${
                      r.status === 'paid'
                        ? styles.badgeSuccess
                        : r.status === 'pending'
                          ? styles.badgeWarning
                          : r.status === 'failed'
                            ? styles.badgeError
                            : styles.badgeDefault
                    }`}
                  >
                    {r.status ?? '—'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
