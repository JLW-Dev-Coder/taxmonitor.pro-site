'use client'

import AuthGuard from '@/components/AuthGuard'
import AppShell from '@/components/AppShell'
import ProfileContent from '@/app/dashboard/components/ProfileContent'

export default function ProfilePage() {
  return (
    <AuthGuard>
      {({ account }) => (
        <AppShell account={account}>
          <ProfileContent account={account} />
        </AppShell>
      )}
    </AuthGuard>
  )
}
