'use client'

import type { SessionUser } from '@/components/AuthGuard'
import styles from './components.module.css'

export default function ESign2848({ account }: { account: SessionUser }) {
  void account
  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>ESign 2848</h1>
      <div className={styles.comingSoon}>
        <div className={styles.comingSoonIcon}>
          <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h2 className={styles.comingSoonTitle}>Coming Soon</h2>
        <p className={styles.comingSoonText}>
          Electronic signature for IRS Form 2848 — Power of Attorney. Available in a future update.
        </p>
      </div>
    </div>
  )
}
