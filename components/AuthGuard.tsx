'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { api } from '@/lib/api'
import styles from './AuthGuard.module.css'

export interface SessionUser {
  account_id: string
  email: string
  plan: string
  first_name?: string
  last_name?: string
  avatar_url?: string
  role?: string
}

interface AuthGuardProps {
  children: (session: { account: SessionUser }) => React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [account, setAccount] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()

  useEffect(() => {
    api
      .getSession()
      .then((res) => {
        if (res.ok && res.user) {
          setAccount(res.user as SessionUser)
        } else {
          window.location.href = `/sign-in?redirect=${encodeURIComponent(pathname)}`
        }
      })
      .catch(() => {
        window.location.href = `/sign-in?redirect=${encodeURIComponent(pathname)}`
      })
      .finally(() => setLoading(false))
  }, [pathname])

  if (loading || !account) {
    return (
      <div className={styles.loaderWrap}>
        <div className={styles.spinner} />
      </div>
    )
  }

  return <>{children({ account })}</>
}
