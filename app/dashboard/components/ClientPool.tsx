'use client'

import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api'
import type { SessionUser } from '@/components/AuthGuard'
import styles from './components.module.css'

interface Inquiry {
  inquiry_id?: string
  subject?: string
  message?: string
  created_at?: string
  status?: string
  [key: string]: unknown
}

export default function ClientPool({ account }: { account: SessionUser }) {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)

  const fetchInquiries = useCallback(async () => {
    try {
      const res = await api.getInquiries(account.account_id) as Inquiry[] | { inquiries?: Inquiry[] }
      const list = Array.isArray(res) ? res : (res as { inquiries?: Inquiry[] }).inquiries ?? []
      setInquiries(list)
    } catch {
      setInquiries([])
    } finally {
      setLoading(false)
    }
  }, [account.account_id])

  useEffect(() => {
    fetchInquiries()
  }, [fetchInquiries])

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Client Pool</h1>

      {loading ? (
        <div className={styles.loadingWrap}>
          <div className={styles.spinner} />
        </div>
      ) : inquiries.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className={styles.emptyTitle}>No Leads Available</h3>
          <p className={styles.emptyText}>No leads available at this time.</p>
        </div>
      ) : (
        <div className={styles.glassCard}>
          <h2 className={styles.cardTitle}>Incoming Inquiries</h2>
          <div className={styles.activityList}>
            {inquiries.map((inq, idx) => (
              <div key={inq.inquiry_id ?? idx} className={styles.activityRow}>
                <div>
                  <div className={styles.activityDesc}>{inq.subject || 'Inquiry'}</div>
                  <div className={styles.activityMeta}>
                    {inq.created_at
                      ? new Date(inq.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : '—'}
                  </div>
                </div>
                {inq.status && (
                  <span className={`${styles.badge} ${styles.badgeDefault}`}>{inq.status}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
