'use client'

import { ProfileContent } from '@/app/dashboard/profile/page'
import type { SessionUser } from '@/components/AuthGuard'
import styles from './components.module.css'

export default function ProProfile({ account }: { account: SessionUser }) {
  return (
    <div className={styles.page}>
      <ProfileContent account={account} />
    </div>
  )
}
