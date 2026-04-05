'use client'

import ReportContent from '@/app/dashboard/components/ReportContent'
import type { SessionUser } from '@/components/AuthGuard'
import styles from './components.module.css'

export default function ComplianceReport({ account }: { account: SessionUser }) {
  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Compliance Report</h1>
      <ReportContent account={account} />
    </div>
  )
}
