'use client'

import OfficeContent from '@/app/dashboard/components/OfficeContent'
import type { SessionUser } from '@/components/AuthGuard'
import styles from './components.module.css'

export default function Receipts({ account }: { account: SessionUser }) {
  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Receipts</h1>
      <OfficeContent account={account} />
    </div>
  )
}
