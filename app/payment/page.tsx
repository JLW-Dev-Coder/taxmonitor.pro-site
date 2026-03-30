'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import StepProgress from '@/components/StepProgress'
import { api } from '@/lib/api'
import styles from './page.module.css'

const STEPS = ['Inquiry', 'Intake', 'Offer', 'Agreement', 'Payment']

interface OfferData {
  plan_id: string
  plan_name: string
  price: number
  price_id: string
  name?: string
}

export default function PaymentPage() {
  const router = useRouter()
  const [offer, setOffer] = useState<OfferData | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    try {
      const agreementRaw = sessionStorage.getItem('agreement_data')
      if (!agreementRaw) {
        router.push('/agreement')
        return
      }
      const agreementData = JSON.parse(agreementRaw)
      if (!agreementData.agreed) {
        router.push('/agreement')
        return
      }
    } catch {
      router.push('/agreement')
      return
    }

    try {
      const offerRaw = sessionStorage.getItem('offer_data')
      if (offerRaw) {
        setOffer(JSON.parse(offerRaw))
      }
    } catch {
      /* ignore */
    }
  }, [router])

  async function handlePay() {
    if (loading) return
    setError('')
    setLoading(true)

    try {
      const session = await api.getSession()
      if (!session.ok) {
        router.push('/sign-in?redirect=/payment')
        return
      }
    } catch {
      router.push('/sign-in?redirect=/payment')
      return
    }

    try {
      const priceId = offer?.price_id || ''
      const result = await api.createCheckoutSession(
        priceId,
        `${window.location.origin}/payment-success`
      )
      if (result.checkout_url) {
        window.location.href = result.checkout_url
      } else {
        setError('Unable to create checkout session. Please try again.')
        setLoading(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.')
      setLoading(false)
    }
  }

  const clientName = offer?.name || 'Client'
  const planName = offer?.plan_name || 'Tax Monitor Plan'
  const planPrice = offer?.price != null ? `$${offer.price}` : '--'

  return (
    <>
      <Header variant="site" />
      <main className={styles.main}>
        <div className={styles.stepperWrap}>
          <StepProgress steps={STEPS} current={4} />
        </div>

        <section className={styles.hero}>
          <h1 className={styles.heroTitle}>Secure Payment</h1>
          <p className={styles.heroSub}>Complete checkout to activate your Tax Monitor service.</p>
        </section>

        <div className={styles.grid}>
          {/* Left column */}
          <div className={styles.left}>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>What happens next</h2>
              <ul className={styles.bulletList}>
                <li className={styles.bulletItem}>
                  <span className={styles.bulletIcon}>
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                  <span>Checkout completes through Stripe on our branded billing domain</span>
                </li>
                <li className={styles.bulletItem}>
                  <span className={styles.bulletIcon}>
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                  <span>After payment, you&rsquo;ll be routed to your status page to confirm activation</span>
                </li>
                <li className={styles.bulletItem}>
                  <span className={styles.bulletIcon}>
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                  <span>Monitoring is a reporting service and does not create IRS representation</span>
                </li>
              </ul>
            </div>

            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Security</h2>
              <p className={styles.securityDesc}>
                We do not store your card details. Stripe processes payment securely.
              </p>
              <div className={styles.checkmarks}>
                <div className={styles.checkmarkItem}>
                  <svg className={styles.checkIcon} width="18" height="18" fill="none" stroke="var(--success)" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Stripe secured</span>
                </div>
                <div className={styles.checkmarkItem}>
                  <svg className={styles.checkIcon} width="18" height="18" fill="none" stroke="var(--success)" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>No card storage</span>
                </div>
                <div className={styles.checkmarkItem}>
                  <svg className={styles.checkIcon} width="18" height="18" fill="none" stroke="var(--success)" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Encrypted transport</span>
                </div>
              </div>
            </div>

            <div className={styles.noticeBanner}>
              <svg className={styles.noticeIcon} width="20" height="20" fill="none" stroke="var(--accent)" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className={styles.noticeText}>
                Tax Monitor Pro provides monitoring and reporting services only. This service does not include IRS representation, tax filing, negotiation, or resolution services.
              </p>
            </div>
          </div>

          {/* Right column -- Order summary */}
          <div className={styles.right}>
            <div className={styles.summaryCard}>
              <div className={styles.summaryHeader}>
                <h3 className={styles.summaryName}>{clientName}</h3>
                <span className={styles.summaryTotal}>{planPrice}</span>
              </div>

              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>{planName}</span>
                <span className={styles.summaryValue}>{planPrice}</span>
              </div>

              {error && (
                <div className={styles.errorBanner}>
                  {error}
                </div>
              )}

              <button
                type="button"
                className={styles.payButton}
                onClick={handlePay}
                disabled={loading}
              >
                {loading ? (
                  <span className={styles.spinner} />
                ) : (
                  <>
                    Pay now
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>

              <button
                type="button"
                className={styles.backLink}
                onClick={() => router.push('/agreement')}
              >
                &larr; Back to agreement
              </button>

              <p className={styles.helpText}>
                Need help? <a href="mailto:support@taxmonitor.pro" className={styles.helpLink}>support@taxmonitor.pro</a>
              </p>
            </div>
          </div>
        </div>

        <p className={styles.disclaimer}>
          Monitoring does not create IRS representation. Representation, filing, and resolution are separate engagements.
        </p>
      </main>
      <Footer />
    </>
  )
}
