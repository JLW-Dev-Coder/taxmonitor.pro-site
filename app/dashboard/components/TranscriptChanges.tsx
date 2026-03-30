'use client'

import type { SessionUser } from '@/components/AuthGuard'
import styles from './components.module.css'

export default function TranscriptChanges({ account }: { account: SessionUser }) {
  void account
  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Transcript Changes</h1>
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>
          <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className={styles.emptyTitle}>No Transcript Changes</h3>
        <p className={styles.emptyText}>No transcript changes on record.</p>
      </div>
    </div>
  )
}
