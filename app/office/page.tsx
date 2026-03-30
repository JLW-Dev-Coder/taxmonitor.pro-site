'use client'

import { useEffect, useState, useCallback } from 'react'
import AuthGuard from '@/components/AuthGuard'
import AppShell from '@/components/AppShell'
import { api } from '@/lib/api'
import type { SessionUser } from '@/components/AuthGuard'
import styles from './page.module.css'

/* ── Types ── */
interface Receipt {
  receipt_id?: string
  id?: string
  date: string
  description: string
  amount: number
  status: 'paid' | 'pending' | 'failed'
  [key: string]: unknown
}

type FilterType = 'all' | 'paid' | 'pending' | 'failed'

/* ── Helpers ── */
function formatAmount(cents: number): string {
  const dollars = typeof cents === 'number' ? cents / 100 : 0
  return `$${dollars.toFixed(2)}`
}

function formatDate(raw: string): string {
  if (!raw) return 'N/A'
  try {
    return new Date(raw).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return raw
  }
}

/* ── Page Export ── */
export default function OfficePage() {
  return (
    <AuthGuard>
      {({ account }) => (
        <AppShell account={account}>
          <OfficeContent account={account} />
        </AppShell>
      )}
    </AuthGuard>
  )
}

/* ── Exported content (reusable in dashboard) ── */
export function OfficeContent({ account }: { account: SessionUser }) {
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [selected, setSelected] = useState<Receipt | null>(null)

  const fetchReceipts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.getReceipts(account.account_id) as { receipts?: Receipt[] } | Receipt[]
      const list = Array.isArray(res) ? res : (res as { receipts?: Receipt[] }).receipts ?? []
      setReceipts(list)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load receipts')
    } finally {
      setLoading(false)
    }
  }, [account.account_id])

  useEffect(() => {
    fetchReceipts()
  }, [fetchReceipts])

  /* ── Computed stats ── */
  const totalPaid = receipts
    .filter((r) => r.status === 'paid')
    .reduce((sum, r) => sum + (r.amount ?? 0), 0)
  const pendingCount = receipts.filter((r) => r.status === 'pending').length
  const failedCount = receipts.filter((r) => r.status === 'failed').length

  /* ── Filtered list ── */
  const filtered = receipts.filter((r) => {
    const matchesFilter = filter === 'all' || r.status === filter
    const matchesSearch =
      !search ||
      (r.description ?? '').toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div>
        <div className={styles.skeletonStats}>
          <div className={styles.skeletonStatCard} />
          <div className={styles.skeletonStatCard} />
          <div className={styles.skeletonStatCard} />
        </div>
        <div className={styles.skeletonFilterBar}>
          <div className={styles.skeletonSearch} />
          <div className={styles.skeletonPills}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={styles.skeletonPill} />
            ))}
          </div>
        </div>
        <div className={styles.listCard}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={styles.skeletonRow} />
          ))}
        </div>
      </div>
    )
  }

  /* ── Error state ── */
  if (error) {
    return (
      <div className={styles.errorState}>
        <div className={styles.errorIcon}>
          <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <path strokeLinecap="round" d="M12 8v4m0 4h.01" />
          </svg>
        </div>
        <h2 className={styles.errorTitle}>Unable to Load Receipts</h2>
        <p className={styles.errorText}>{error}</p>
        <button className={styles.retryBtn} onClick={fetchReceipts}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <>
      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={`${styles.statLabel} ${styles.statLabelPaid}`}>Total Paid</div>
          <div className={styles.statValue}>{formatAmount(totalPaid)}</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statLabel} ${styles.statLabelPending}`}>Pending</div>
          <div className={styles.statValue}>{pendingCount}</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statLabel} ${styles.statLabelFailed}`}>Failed</div>
          <div className={styles.statValue}>{failedCount}</div>
        </div>
      </div>

      {/* Filter bar */}
      <div className={styles.filterBar}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search by description…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className={styles.pills}>
          {(['all', 'paid', 'pending', 'failed'] as FilterType[]).map((f) => (
            <button
              key={f}
              className={`${styles.pill} ${filter === f ? styles.pillActive : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <rect x="1" y="4" width="22" height="16" rx="2" />
              <path d="M1 10h22" />
            </svg>
          </div>
          <h3 className={styles.emptyTitle}>No Receipts Found</h3>
          <p className={styles.emptyText}>
            {search || filter !== 'all'
              ? 'Try adjusting your search or filter.'
              : 'Your payment history will appear here.'}
          </p>
        </div>
      ) : (
        <div className={styles.listCard}>
          <div className={styles.listHeader}>
            <span>Date</span>
            <span>Description</span>
            <span>Amount</span>
            <span>Status</span>
          </div>
          {filtered.map((r, idx) => (
            <div
              key={r.receipt_id ?? r.id ?? idx}
              className={styles.row}
              onClick={() => setSelected(r)}
            >
              <span className={styles.rowDate}>{formatDate(r.date)}</span>
              <span className={styles.rowDescription}>{r.description || '—'}</span>
              <span className={styles.rowAmount}>{formatAmount(r.amount)}</span>
              <span className={styles.rowStatus}>
                <span
                  className={`${styles.badge} ${
                    r.status === 'paid'
                      ? styles.badgePaid
                      : r.status === 'pending'
                        ? styles.badgePending
                        : styles.badgeFailed
                  }`}
                >
                  {r.status}
                </span>
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className={styles.modalOverlay} onClick={() => setSelected(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setSelected(null)}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className={styles.modalTitle}>Receipt Detail</h2>
            <div className={styles.modalField}>
              <span className={styles.modalLabel}>Date</span>
              <span className={styles.modalValue}>{formatDate(selected.date)}</span>
            </div>
            <div className={styles.modalField}>
              <span className={styles.modalLabel}>Description</span>
              <span className={styles.modalValue}>{selected.description || '—'}</span>
            </div>
            <div className={styles.modalField}>
              <span className={styles.modalLabel}>Amount</span>
              <span className={styles.modalValue}>{formatAmount(selected.amount)}</span>
            </div>
            <div className={styles.modalField}>
              <span className={styles.modalLabel}>Status</span>
              <span className={styles.modalValue}>{selected.status}</span>
            </div>
            {selected.receipt_id && (
              <div className={styles.modalField}>
                <span className={styles.modalLabel}>Receipt ID</span>
                <span className={styles.modalValue}>{String(selected.receipt_id)}</span>
              </div>
            )}
            {Object.entries(selected)
              .filter(([k]) => !['receipt_id', 'id', 'date', 'description', 'amount', 'status'].includes(k))
              .map(([k, v]) => (
                <div key={k} className={styles.modalField}>
                  <span className={styles.modalLabel}>{k.replace(/_/g, ' ')}</span>
                  <span className={styles.modalValue}>{String(v ?? '—')}</span>
                </div>
              ))}
            <button className={styles.printBtn} onClick={() => window.print()}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              Print Receipt
            </button>
          </div>
        </div>
      )}
    </>
  )
}
