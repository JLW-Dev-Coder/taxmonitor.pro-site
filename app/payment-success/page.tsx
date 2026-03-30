'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import StepProgress from '@/components/StepProgress'
import { api } from '@/lib/api'
import styles from './page.module.css'

const STEPS = ['Inquiry', 'Intake', 'Offer', 'Agreement', 'Payment']

function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    if (!sessionId) {
      setStatus('success')
      return
    }

    api
      .getCheckoutStatus(sessionId)
      .then((res) => {
        if (res.ok) {
          setStatus('success')
        } else {
          setStatus('error')
        }
      })
      .catch(() => {
        setStatus('error')
      })

    // Clear intake flow sessionStorage data
    try {
      sessionStorage.removeItem('inquiry_data')
      sessionStorage.removeItem('intake_data')
      sessionStorage.removeItem('offer_data')
      sessionStorage.removeItem('agreement_data')
    } catch {
      /* ignore */
    }
  }, [searchParams])

  return (
    <>
      <Header variant="site" />
      <main className={styles.main}>
        <div className={styles.stepperWrap}>
          <StepProgress steps={STEPS} current={4} />
        </div>

        <section className={styles.hero}>
          <h1 className={styles.heroTitle}>Payment Successful</h1>
          <p className={styles.heroSub}>
            Your payment has been confirmed. Next, log in to begin onboarding.
          </p>
        </section>

        <div className={styles.content}>
          {status === 'loading' && (
            <div className={styles.loadingWrap}>
              <span className={styles.spinner} />
              <p className={styles.loadingText}>Confirming your payment...</p>
            </div>
          )}

          {status === 'success' && (
            <>
              <div className={styles.successIcon}>
                <div className={styles.successCircle}>
                  <svg
                    className={styles.checkmark}
                    width="48"
                    height="48"
                    fill="none"
                    stroke="#fff"
                    strokeWidth={3}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>

              <div className={styles.actions}>
                <Link href="/sign-in" className={styles.primaryButton}>
                  Go to Login
                </Link>
                <Link href="/sign-in" className={styles.secondaryButton}>
                  Create Your Account
                </Link>
              </div>
            </>
          )}

          {status === 'error' && (
            <div className={styles.errorWrap}>
              <p className={styles.errorText}>
                We could not confirm your payment status. If you were charged, please contact{' '}
                <a href="mailto:support@taxmonitor.pro" className={styles.link}>
                  support@taxmonitor.pro
                </a>{' '}
                for assistance.
              </p>
              <Link href="/sign-in" className={styles.primaryButton}>
                Go to Login
              </Link>
            </div>
          )}
        </div>

        <p className={styles.disclaimer}>
          Monitoring does not create IRS representation. Representation, filing, and resolution are separate engagements.
        </p>
      </main>
      <Footer />
    </>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={null}>
      <PaymentSuccessContent />
    </Suspense>
  )
}
