'use client'

import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api'
import type { SessionUser } from '@/components/AuthGuard'
import styles from './components.module.css'

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
  } catch { return raw }
}

export default function Payouts({ account }: { account: SessionUser }) {
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [loading, setLoading] = useState(true)

  const fetchReceipts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.getReceipts(account.account_id) as { receipts?: Receipt[] } | Receipt[]
      const list = Array.isArray(res) ? res : (res as { receipts?: Receipt[] }).receipts ?? []
      setReceipts(list)
    } catch {
      setReceipts([])
    } finally {
      setLoading(false)
    }
  }, [account.account_id])

  useEffect(() => { fetchReceipts() }, [fetchReceipts])

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Payouts</h1>

      {/* Pending balance card */}
      <div className={styles.summaryRow} style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Pending Balance</div>
          <div className={styles.summaryValue}>$0.00</div>
          <div className={styles.summaryNote}>Affiliate payout system not yet active</div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Total Transactions</div>
          <div className={styles.summaryValue}>{loading ? '—' : receipts.length}</div>
          <div className={styles.summaryNote}>All time</div>
        </div>
      </div>

      <div className={styles.glassCard} style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--surface-border)' }}>
          <h2 className={styles.cardTitle} style={{ marginBottom: 0 }}>Payout History</h2>
        </div>

        {loading ? (
          <div className={styles.loadingWrap} style={{ padding: '2rem' }}>
            <div className={styles.spinner} />
          </div>
        ) : receipts.length === 0 ? (
          <div className={styles.emptyState}>
            <h3 className={styles.emptyTitle}>No Payout History</h3>
            <p className={styles.emptyText}>Your payout history will appear here once the affiliate system is active.</p>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {receipts.map((r, idx) => (
                  <tr key={r.receipt_id ?? idx}>
                    <td style={{ color: 'var(--text-muted)' }}>{formatDate(r.date)}</td>
                    <td>{r.description || '—'}</td>
                    <td style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                      {r.amount != null ? formatAmount(r.amount) : '—'}
                    </td>
                    <td>
                      <span className={`${styles.badge} ${
                        r.status === 'paid' ? styles.badgeSuccess
                          : r.status === 'pending' ? styles.badgeWarning
                            : r.status === 'failed' ? styles.badgeError
                              : styles.badgeDefault
                      }`}>
                        {r.status ?? '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
