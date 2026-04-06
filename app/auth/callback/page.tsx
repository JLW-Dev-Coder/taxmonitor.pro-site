'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { api } from '@/lib/api'
import styles from './page.module.css'

function CallbackInner() {
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = searchParams.get('token')

    if (!token) {
      setError('Missing authentication token. Please try signing in again.')
      return
    }

    async function exchange() {
      try {
        const data = await api.exchangeHandoffToken(token!)
        // Store session in sessionStorage so api.ts can send it as Bearer token
        // (vlp_session cookie is SameSite=Lax on .virtuallaunch.pro — not sent cross-site)
        if (data.sessionId) {
          sessionStorage.setItem('tmp_session_id', data.sessionId)
        }
        if (data.email) {
          sessionStorage.setItem('tmp_email', data.email)
        }
        window.location.href = '/dashboard'
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : 'Authentication failed. Please try again.'
        )
      }
    }

    exchange()
  }, [searchParams])

  if (error) {
    return (
      <main className={styles.main}>
        <div className={styles.container}>
          <p className={styles.errorTitle}>Sign-in failed</p>
          <p className={styles.errorMessage}>{error}</p>
          <a href="/sign-in" className={styles.backLink}>
            Back to sign in
          </a>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <span className={styles.spinner} />
        <p className={styles.status}>Signing you in...</p>
      </div>
    </main>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className={styles.main}>
          <div className={styles.container}>
            <p className={styles.status}>Loading...</p>
          </div>
        </main>
      }
    >
      <CallbackInner />
    </Suspense>
  )
}
