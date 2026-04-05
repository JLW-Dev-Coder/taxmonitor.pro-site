'use client'

import AuthGuard from '@/components/AuthGuard'
import AppShell from '@/components/AppShell'
import OfficeContent from '@/app/dashboard/components/OfficeContent'

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
