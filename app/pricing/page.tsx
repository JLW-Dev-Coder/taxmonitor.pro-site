'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import PlanCard from '@/components/PlanCard'
import styles from './page.module.css'

/* ── Types ── */
interface PlanI {
  plan_key: string
  name: string
  price: number
  interval: string
  features: string[]
  recommended: boolean
}

interface PlanII {
  plan_key: string
  name: string
  price: number
  interval: string
  weeks: number | null
  description: string
}

interface MfjAddon {
  plan_key: string
  name: string
  price: number
}

interface Membership {
  plan_key: string
  plan_name: string
  plan_tier: 'I' | 'II'
  status: string
}

const BADGES: Record<string, string> = {
  Free: 'Start here',
  Essential: 'Entry',
  Plus: 'Most popular',
  Premier: 'Advanced',
}

const FAQ_ITEMS = [
  {
    question: 'What is a Transcript Token?',
    answer:
      'A Transcript Token lets you request and analyze one IRS transcript through the Tax Monitor Pro platform. Tokens are included with paid plans and roll over for 60 days if unused.',
  },
  {
    question: 'What is a Tax Tool Game Token?',
    answer:
      'Tax Tool Game Tokens give you access to interactive tax education games on TaxTools Arcade. Each token allows one game session. Unused tokens roll over for 60 days.',
  },
  {
    question: 'Can I upgrade or downgrade anytime?',
    answer:
      'Yes. You can change your plan at any time from your dashboard. Upgrades take effect immediately, and downgrades apply at the start of your next billing cycle.',
  },
  {
    question: 'Do unused tokens roll over?',
    answer:
      'Yes. Unused paid-plan tokens roll over for 60 days. After 60 days, unused tokens expire.',
  },
  {
    question: 'Is there a contract or commitment?',
    answer:
      'No. All plans are month-to-month with no long-term commitment. You can cancel anytime from your dashboard. The Free plan never requires a payment method.',
  },
]

export default function PricingPage() {
  const router = useRouter()

  const [accountId, setAccountId] = useState<string | null>(null)
  const [membership, setMembership] = useState<Membership | null>(null)

  const [plansI, setPlansI] = useState<PlanI[]>([])
  const [plansII, setPlansII] = useState<PlanII[]>([])
  const [mfjAddon, setMfjAddon] = useState<MfjAddon | null>(null)
  const [loadingPricing, setLoadingPricing] = useState(true)

  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  // Per Plan II card MFJ checkbox state
  const mfjChecked = useRef<Record<string, boolean>>({})
  const [mfjTick, setMfjTick] = useState(0) // force re-render on checkbox change

  /* Load pricing + session in parallel */
  useEffect(() => {
    api
      .getTmpPricing()
      .then((res) => {
        setPlansI(res.plans_i ?? [])
        setPlansII(res.plans_ii ?? [])
        setMfjAddon(res.mfj_addon ?? null)
      })
      .catch(() => {})
      .finally(() => setLoadingPricing(false))

    api
      .getSession()
      .then((res) => {
        if (res.ok) {
          setAccountId(res.user.account_id)
          return api.getTmpMembership(res.user.account_id)
        }
        return null
      })
      .then((res) => {
        if (res?.ok && res.membership) {
          setMembership(res.membership)
        }
      })
      .catch(() => {})
  }, [])

  /* Plan I checkout */
  const handleSelectI = async (planKey: string, price: number) => {
    if (!accountId) {
      router.push('/sign-in?redirect=/pricing')
      return
    }
    if (price === 0) {
      router.push('/dashboard')
      return
    }
    setLoadingPlan(planKey)
    try {
      const res = await api.createTmpCheckout(planKey)
      if (res.session_url) window.location.href = res.session_url
    } catch {
      setLoadingPlan(null)
    }
  }

  /* Plan II checkout */
  const handleSelectII = async (planKey: string) => {
    if (!accountId) {
      router.push('/sign-in?redirect=/pricing')
      return
    }
    const addon = mfjChecked.current[planKey] ?? false
    setLoadingPlan(planKey)
    try {
      const res = await api.createTmpCheckout(planKey, addon)
      if (res.session_url) window.location.href = res.session_url
    } catch {
      setLoadingPlan(null)
    }
  }

  const isActivePlan = (key: string) =>
    membership?.status === 'active' && membership.plan_key === key

  return (
    <>
      <Header variant="site" />
      <main className={styles.main}>
        {/* Hero */}
        <section className={styles.hero}>
          <p className={styles.trustBadge}>
            Choose your membership level &mdash; upgrade anytime.
          </p>
          <h1 className={styles.headline}>
            Simple Plans.{' '}
            <span className={styles.gradientText}>Serious Memberships.</span>
          </h1>
          <p className={styles.subheadline}>
            Every plan includes full platform access. Paid plans add Transcript Tokens and Tax Tool
            Game Tokens so you can monitor, learn, and stay ahead.
          </p>
        </section>

        {/* Plan I cards */}
        <section className={styles.plans}>
          <h2 className={styles.sectionTitle}>Plan I &mdash; Monthly Memberships</h2>
          <p className={styles.sectionDesc}>
            Access the TMP platform month-to-month. Upgrade or cancel anytime.
          </p>

          {loadingPricing ? (
            <div className={styles.loadingGrid}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className={styles.skelCard} />
              ))}
            </div>
          ) : (
            <div className={styles.planGrid}>
              {plansI.map((plan) => (
                <div key={plan.plan_key} style={{ position: 'relative' }}>
                  {isActivePlan(plan.plan_key) && (
                    <div className={styles.currentPlanBadge}>&#10003; Current Plan</div>
                  )}
                  <PlanCard
                    name={plan.name}
                    price={plan.price}
                    interval={plan.interval}
                    features={plan.features}
                    recommended={plan.recommended}
                    badge={BADGES[plan.name]}
                    onSelect={
                      isActivePlan(plan.plan_key)
                        ? () => router.push('/dashboard')
                        : () => handleSelectI(plan.plan_key, plan.price)
                    }
                    loading={loadingPlan === plan.plan_key}
                  />
                </div>
              ))}
            </div>
          )}

          <p className={styles.planNote}>
            Cancel anytime. Free starts at $0. Unused paid-plan tokens roll over for 60 days.
          </p>
        </section>

        {/* Plan II cards */}
        <section className={styles.plans}>
          <h2 className={styles.sectionTitle}>Plan II &mdash; Monitoring Services</h2>
          <p className={styles.sectionDesc}>
            IRS transcript monitoring engagements. One-time service fee. Add MFJ (+${mfjAddon?.price ?? 79}) for a second spouse.
          </p>

          {loadingPricing ? (
            <div className={styles.loadingGrid}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className={styles.skelCard} />
              ))}
            </div>
          ) : (
            <div className={styles.planIIGrid}>
              {plansII.map((plan) => {
                const active = isActivePlan(plan.plan_key)
                const mfj = mfjChecked.current[plan.plan_key] ?? false
                const displayPrice = mfj ? plan.price + (mfjAddon?.price ?? 79) : plan.price

                return (
                  <div key={plan.plan_key} className={styles.monitorCard}>
                    {active && (
                      <div className={styles.currentPlanBadge}>&#10003; Current Plan</div>
                    )}

                    <div className={styles.monitorCardName}>{plan.name}</div>

                    <div>
                      <span className={styles.monitorCardPrice}>${displayPrice}</span>
                      <span className={styles.monitorCardInterval}> / one-time</span>
                    </div>

                    <p className={styles.monitorCardDesc}>
                      {plan.description}
                      {plan.weeks != null && ` (${plan.weeks} weeks)`}
                    </p>

                    {/* MFJ checkbox */}
                    {mfjAddon && (
                      <label className={styles.mfjRow}>
                        <input
                          type="checkbox"
                          className={styles.mfjCheckbox}
                          checked={mfj}
                          onChange={(e) => {
                            mfjChecked.current[plan.plan_key] = e.target.checked
                            setMfjTick((t) => t + 1)
                          }}
                        />
                        <span className={styles.mfjLabel}>Add MFJ spouse</span>
                        <span className={styles.mfjPrice}>+${mfjAddon.price}</span>
                      </label>
                    )}

                    {active ? (
                      <button
                        className={styles.managePlanBtn}
                        onClick={() => router.push('/dashboard')}
                      >
                        Manage Plan
                      </button>
                    ) : (
                      <button
                        className={styles.monitorBtn}
                        onClick={() => handleSelectII(plan.plan_key)}
                        disabled={loadingPlan === plan.plan_key}
                      >
                        {loadingPlan === plan.plan_key ? 'Loading\u2026' : 'Start monitoring \u2192'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <p className={styles.planNote}>
            One-time service fee. No recurring charges. MFJ add-on covers a second spouse on the same engagement.
          </p>
        </section>

        {/* FAQ */}
        <section className={styles.faq}>
          <h2 className={styles.faqTitle}>Frequently Asked Questions</h2>
          <div className={styles.faqList}>
            {FAQ_ITEMS.map((item) => (
              <details key={item.question} className={styles.faqItem}>
                <summary className={styles.faqQuestion}>{item.question}</summary>
                <p className={styles.faqAnswer}>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className={styles.cta}>
          <h2 className={styles.ctaTitle}>Ready to Start?</h2>
          <p className={styles.ctaText}>
            Create your free account and explore the platform. Upgrade when you need tokens.
          </p>
          <Link href="/inquiry" className={styles.ctaButton}>
            Start intake &rarr;
          </Link>
        </section>

        {/* Disclaimer */}
        <p className={styles.disclaimer}>
          Tax Monitor Pro provides monitoring and reporting services. It does not create IRS
          representation. Representation, filing, and resolution are separate engagements.
        </p>
      </main>
      <Footer />
    </>
  )
}
