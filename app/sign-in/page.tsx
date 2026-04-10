'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import Header from '@/components/Header'
import styles from './page.module.css'

type View = 'default' | 'magic-link' | 'check-email'

function SignInContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/dashboard'
  const oauthError = searchParams.get('error')

  const [view, setView] = useState<View>('default')
  const [email, setEmail] = useState('')
  const [error, setError] = useState(oauthError || '')
  const [googleLoading, setGoogleLoading] = useState(false)
  const [magicLoading, setMagicLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)

  useEffect(() => {
    api
      .getSession()
      .then((res) => {
        if (res.ok && res.session) router.replace(redirect)
      })
      .catch(() => {})
  }, [router, redirect])

  const handleGoogle = () => {
    setGoogleLoading(true)
    setError('')
    const returnTo = encodeURIComponent(`https://taxmonitor.pro${redirect}`)
    window.location.href =
      `https://api.virtuallaunch.pro/v1/auth/google/start?return_to=${returnTo}`
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setMagicLoading(true)
    setError('')
    try {
      const fullRedirect = `https://taxmonitor.pro${redirect}`
      await api.requestMagicLink(email.trim(), fullRedirect)
      setView('check-email')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send magic link')
    } finally {
      setMagicLoading(false)
    }
  }

  const handleResend = async () => {
    setResendLoading(true)
    setResendSuccess(false)
    try {
      const fullRedirect = `https://taxmonitor.pro${redirect}`
      await api.requestMagicLink(email.trim(), fullRedirect)
      setResendSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend')
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <>
      <Header variant="site" />
      <main className={styles.main}>
        <div className={styles.container}>
          {/* Badge + branding */}
          <div className={styles.branding}>
            <span className={styles.badge}>TM</span>
            <h1 className={styles.title}>Tax Monitor Pro</h1>
          </div>

          <h2 className={styles.heading}>Sign in to continue</h2>
          <p className={styles.subtext}>
            Login is required to access your dashboard and begin monitoring.
          </p>

          {/* Card */}
          <div className={styles.card}>
            {/* Error alert */}
            {error && (
              <div className={styles.errorAlert}>
                <svg
                  className={styles.errorIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {view === 'default' && (
              <>
                {/* Google button */}
                <button
                  type="button"
                  className={styles.googleButton}
                  onClick={handleGoogle}
                  disabled={googleLoading}
                >
                  {googleLoading ? (
                    <span className={styles.spinner} />
                  ) : (
                    <svg className={styles.googleIcon} viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                  )}
                  Continue with Google
                </button>

                {/* Divider */}
                <div className={styles.divider}>
                  <span className={styles.dividerLine} />
                  <span className={styles.dividerText}>or</span>
                  <span className={styles.dividerLine} />
                </div>

                {/* Magic Link button */}
                <button
                  type="button"
                  className={styles.magicButton}
                  onClick={() => setView('magic-link')}
                >
                  <svg
                    className={styles.magicIcon}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  Magic Link
                </button>
              </>
            )}

            {view === 'magic-link' && (
              <form onSubmit={handleMagicLink} className={styles.magicForm}>
                <label className={styles.label} htmlFor="email">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  className={styles.input}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={magicLoading || !email.trim()}
                >
                  {magicLoading ? (
                    <>
                      <span className={styles.spinner} />
                      Sending...
                    </>
                  ) : (
                    'Send magic link'
                  )}
                </button>
                <button
                  type="button"
                  className={styles.backButton}
                  onClick={() => {
                    setView('default')
                    setError('')
                  }}
                >
                  Back to sign-in options
                </button>
              </form>
            )}

            {view === 'check-email' && (
              <div className={styles.checkEmail}>
                <div className={styles.checkEmailIcon}>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className={styles.checkEmailTitle}>Check your email</h3>
                <p className={styles.checkEmailText}>
                  We sent a magic link to <strong>{email}</strong>. Click the link in the email to
                  sign in.
                </p>
                <button
                  type="button"
                  className={styles.resendButton}
                  onClick={handleResend}
                  disabled={resendLoading}
                >
                  {resendLoading ? 'Resending...' : 'Resend magic link'}
                </button>
                {resendSuccess && (
                  <p className={styles.resendSuccess}>Email resent successfully.</p>
                )}
                <button
                  type="button"
                  className={styles.backButton}
                  onClick={() => {
                    setView('default')
                    setError('')
                    setResendSuccess(false)
                  }}
                >
                  Back to sign-in options
                </button>
              </div>
            )}
          </div>

          {/* Reminder box */}
          <div className={styles.reminder}>
            <svg
              className={styles.reminderIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p>
              Tax Monitor Pro provides monitoring and reporting. It does not create IRS
              representation.
            </p>
          </div>

          {/* Footer links */}
          <nav className={styles.footerLinks}>
            <Link href="/legal/privacy">Privacy</Link>
            <Link href="/legal/terms">Terms</Link>
            <Link href="/contact">Contact</Link>
          </nav>
        </div>
      </main>
    </>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInContent />
    </Suspense>
  )
}
