'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { PLANS_I } from '@/lib/plans'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import PlanCard from '@/components/PlanCard'
import styles from './page.module.css'

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
  const [loggedIn, setLoggedIn] = useState(false)
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  useEffect(() => {
    api
      .getSession()
      .then((res) => {
        if (res.ok) setLoggedIn(true)
      })
      .catch(() => {})
  }, [])

  const handleSelect = async (planId: string, price: number) => {
    if (!loggedIn) {
      router.push('/sign-in?redirect=/pricing')
      return
    }

    if (price === 0) {
      router.push('/dashboard')
      return
    }

    setLoadingPlan(planId)
    try {
      const res = await api.createCheckoutSession(planId)
      if (res.checkout_url) {
        window.location.href = res.checkout_url
      }
    } catch {
      setLoadingPlan(null)
    }
  }

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

        {/* Plan cards */}
        <section className={styles.plans}>
          <div className={styles.planGrid}>
            {PLANS_I.map((plan) => (
              <PlanCard
                key={plan.id}
                name={plan.name}
                price={plan.price}
                interval={plan.interval}
                features={plan.features}
                recommended={plan.recommended}
                badge={BADGES[plan.name]}
                onSelect={() => handleSelect(plan.id, plan.price)}
                loading={loadingPlan === plan.id}
              />
            ))}
          </div>

          <p className={styles.planNote}>
            Cancel anytime. Free starts at $0. Unused paid-plan tokens roll over for 60 days.
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
