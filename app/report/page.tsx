'use client'

import AuthGuard from '@/components/AuthGuard'
import AppShell from '@/components/AppShell'
import ReportContent from '@/app/dashboard/components/ReportContent'

export default function ReportPage() {
  return (
    <AuthGuard>
      {({ account }) => (
        <AppShell account={account}>
          <ReportContent account={account} />
        </AppShell>
      )}
    </AuthGuard>
  )
}
