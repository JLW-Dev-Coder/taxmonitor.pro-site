'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
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

interface TmpDashboard {
  plan_key: string
  plan_name: string
  plan_tier: 'I' | 'II'
  status: string
}

interface MonitoringStatus {
  phase: string
  phase_label: string
  intake_complete: number
  esign_2848_complete: number
  processing_complete: number
  tax_record_complete: number
  current_step?: string
  step_status?: string
}

const MONITOR_PHASES = [
  { key: 'intake_complete' as const, label: 'Intake' },
  { key: 'esign_2848_complete' as const, label: 'ESign 2848' },
  { key: 'processing_complete' as const, label: 'Processing' },
  { key: 'tax_record_complete' as const, label: 'Tax Record' },
]

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
  const [tmpDashboard, setTmpDashboard] = useState<TmpDashboard | null>(null)
  const [monitoring, setMonitoring] = useState<MonitoringStatus | null>(null)

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [loadingNotif, setLoadingNotif] = useState(true)
  const [loadingReceipts, setLoadingReceipts] = useState(true)
  const [tokenBalance, setTokenBalance] = useState<number | null>(null)
  const [loadingTokens, setLoadingTokens] = useState(true)

  const fetchData = useCallback(async () => {
    // TMP dashboard gate
    try {
      const res = await api.getTmpDashboard()
      setTmpDashboard(res)

      if (res.plan_tier === 'II') {
        try {
          const mon = await api.getTmpMonitoringStatus()
          setMonitoring(mon)
        } catch {
          // monitoring status unavailable — non-fatal
        }
      }
    } catch {
      // TMP dashboard info unavailable — non-fatal, dashboard still loads
    }

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

      {/* Plan header banner */}
      {tmpDashboard && (
        <div className={styles.planBanner}>
          <div>
            <div className={styles.planBannerLabel}>Current Plan</div>
            <div className={styles.planBannerName}>{tmpDashboard.plan_name}</div>
          </div>
          <span
            className={`${styles.planBannerStatus} ${
              tmpDashboard.status === 'active'
                ? styles.planBannerStatusActive
                : styles.planBannerStatusInactive
            }`}
          >
            {tmpDashboard.status === 'active' ? '● Active' : tmpDashboard.status}
          </span>
          {tmpDashboard.status !== 'active' && (
            <Link href="/pricing" className={styles.planUpgradeLink}>
              Upgrade &rarr;
            </Link>
          )}
        </div>
      )}

      {/* Plan II monitoring phase cards */}
      {monitoring && (
        <div className={styles.glassCard}>
          <h2 className={styles.cardTitle}>Monitoring Progress</h2>
          <div className={styles.monitoringGrid}>
            {MONITOR_PHASES.map((phase, idx) => {
              const value = Number((monitoring as unknown as Record<string, unknown>)[phase.key] ?? 0)
              const allPrev = MONITOR_PHASES.slice(0, idx).every(
                (p) => Number((monitoring as unknown as Record<string, unknown>)[p.key] ?? 0) === 1
              )
              const state: 'complete' | 'current' | 'locked' =
                value === 1 ? 'complete' : allPrev ? 'current' : 'locked'

              return (
                <div key={phase.key} className={styles.monitoringPhaseCard}>
                  <div className={styles.monitoringPhaseNum}>Phase {idx + 1}</div>
                  <div className={styles.monitoringPhaseName}>{phase.label}</div>
                  <span
                    className={`${styles.monitoringPhaseBadge} ${
                      state === 'complete'
                        ? styles.monitoringBadgeComplete
                        : state === 'current'
                          ? styles.monitoringBadgeCurrent
                          : styles.monitoringBadgeLocked
                    }`}
                  >
                    {state === 'complete' ? 'Complete' : state === 'current' ? 'In Progress' : 'Locked'}
                  </span>
                </div>
              )
            })}
          </div>
          {monitoring.current_step && (
            <p style={{ fontSize: '0.813rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Current step: <strong style={{ color: 'var(--text)' }}>{monitoring.current_step}</strong>
              {monitoring.step_status && (
                <> &mdash; <span style={{ color: 'var(--accent)' }}>{monitoring.step_status}</span></>
              )}
            </p>
          )}
        </div>
      )}

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
