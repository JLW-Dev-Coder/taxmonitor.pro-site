'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import StepProgress from '@/components/StepProgress'
import { PLANS_II } from '@/lib/plans'
import type { PlanII } from '@/lib/plans'
import styles from './page.module.css'

const STEPS = ['Inquiry', 'Intake', 'Offer', 'Agreement', 'Payment']

const PLAN_FEATURES: Record<string, string[]> = {
  'tmp-bronze': [
    '6 weeks of IRS transcript monitoring',
    'Weekly transcript pulls',
    'Change-detection alerts',
    'Summary monitoring report',
    'Secure dashboard access',
  ],
  'tmp-silver': [
    '8 weeks of IRS transcript monitoring',
    'Weekly transcript pulls',
    'Change-detection alerts',
    'Detailed monitoring report',
    'Secure dashboard access',
    'Priority email support',
  ],
  'tmp-gold': [
    '12 weeks of IRS transcript monitoring',
    'Weekly transcript pulls',
    'Change-detection alerts',
    'Comprehensive monitoring report',
    'Secure dashboard access',
    'Priority email support',
    'Mid-term progress review',
  ],
  'tmp-snapshot': [
    'One-time transcript analysis',
    'Full transcript pull across all years',
    'Point-in-time compliance snapshot',
    'Detailed findings report',
    'No ongoing monitoring',
  ],
  'tmp-mfj': [
    'Add second spouse transcript monitoring',
    'Same monitoring period as primary plan',
    'Combined household reporting',
  ],
}

export default function OfferPage() {
  const router = useRouter()
  const [selectedId, setSelectedId] = useState<string>('tmp-silver')
  const [mfjSelected, setMfjSelected] = useState(false)

  const monitoringPlans = PLANS_II.filter(
    (p) => !p.mfjAddon && p.id !== 'tmp-snapshot'
  )
  const snapshotPlan = PLANS_II.find((p) => p.id === 'tmp-snapshot')!
  const mfjPlan = PLANS_II.find((p) => p.mfjAddon)!

  const selectedPlan = PLANS_II.find((p) => p.id === selectedId)

  function totalPrice(): number {
    let total = selectedPlan?.price ?? 0
    if (mfjSelected) total += mfjPlan.price
    return total
  }

  function handleApprove() {
    const offerData = {
      selected_plan: selectedId,
      plan_name: selectedPlan?.name,
      plan_price: selectedPlan?.price,
      mfj_addon: mfjSelected,
      mfj_price: mfjSelected ? mfjPlan.price : 0,
      total: totalPrice(),
      approved_at: new Date().toISOString(),
    }
    sessionStorage.setItem('offer_data', JSON.stringify(offerData))
    router.push('/agreement')
  }

  function renderFeatures(planId: string) {
    const features = PLAN_FEATURES[planId] || []
    return (
      <ul className={styles.featureList}>
        {features.map((f) => (
          <li key={f} className={styles.featureItem}>
            <svg
              className={styles.checkIcon}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {f}
          </li>
        ))}
      </ul>
    )
  }

  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className={styles.stepWrap}>
          <StepProgress steps={STEPS} current={2} />
        </div>

        <section className={styles.hero}>
          <h1 className={styles.heading}>
            Tax Monitoring <span className={styles.accent}>Offer</span>
          </h1>
          <p className={styles.subtitle}>
            Select the monitoring package that best fits your situation.
          </p>
        </section>

        {/* Monitoring plans grid */}
        <div className={styles.planGrid}>
          {monitoringPlans.map((plan) => (
            <button
              key={plan.id}
              type="button"
              className={`${styles.planCard} ${selectedId === plan.id ? styles.planCardSelected : ''}`}
              onClick={() => setSelectedId(plan.id)}
            >
              {plan.id === 'tmp-silver' && (
                <span className={styles.popularBadge}>MOST POPULAR</span>
              )}
              <h3 className={styles.planName}>{plan.name}</h3>
              <div className={styles.planPrice}>
                <span className={styles.priceDollar}>${plan.price}</span>
                <span className={styles.priceTerm}>one-time</span>
              </div>
              <p className={styles.planTerm}>
                {plan.weeks} weeks of monitoring
              </p>
              {renderFeatures(plan.id)}
            </button>
          ))}
        </div>

        {/* Additional options */}
        <div className={styles.extrasGrid}>
          {/* Snapshot */}
          <button
            type="button"
            className={`${styles.extraCard} ${selectedId === snapshotPlan.id ? styles.extraCardSelected : ''}`}
            onClick={() => setSelectedId(snapshotPlan.id)}
          >
            <h3 className={styles.extraName}>{snapshotPlan.name}</h3>
            <div className={styles.planPrice}>
              <span className={styles.priceDollar}>${snapshotPlan.price}</span>
              <span className={styles.priceTerm}>one-time</span>
            </div>
            <p className={styles.extraDesc}>{snapshotPlan.description}</p>
            {renderFeatures(snapshotPlan.id)}
          </button>

          {/* MFJ Add-on */}
          <button
            type="button"
            className={`${styles.extraCard} ${mfjSelected ? styles.extraCardSelected : ''}`}
            onClick={() => setMfjSelected(!mfjSelected)}
          >
            <h3 className={styles.extraName}>{mfjPlan.name}</h3>
            <div className={styles.planPrice}>
              <span className={styles.priceDollar}>+${mfjPlan.price}</span>
              <span className={styles.priceTerm}>add-on</span>
            </div>
            <p className={styles.extraDesc}>{mfjPlan.description}</p>
            {renderFeatures(mfjPlan.id)}
          </button>
        </div>

        {/* Selected summary */}
        <div className={styles.summaryCard}>
          <h3 className={styles.summaryTitle}>Selected Package</h3>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Package</span>
            <span className={styles.summaryValue}>{selectedPlan?.name ?? '--'}</span>
          </div>
          {selectedPlan?.weeks && (
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Term</span>
              <span className={styles.summaryValue}>{selectedPlan.weeks} weeks</span>
            </div>
          )}
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Price</span>
            <span className={styles.summaryValue}>${selectedPlan?.price ?? 0}</span>
          </div>
          {mfjSelected && (
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>MFJ Add-On</span>
              <span className={styles.summaryValue}>+${mfjPlan.price}</span>
            </div>
          )}
          <div className={styles.summaryDivider} />
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabelTotal}>Total</span>
            <span className={styles.summaryValueTotal}>${totalPrice()}</span>
          </div>
        </div>

        {/* Important notice */}
        <div className={styles.notice}>
          <h4 className={styles.noticeTitle}>Important Notice</h4>
          <p className={styles.noticeText}>
            Tax Monitor Pro provides IRS transcript monitoring services only. This does not
            constitute IRS representation, tax advice, tax preparation, or resolution services.
            Representation, filing, and resolution are separate engagements.
          </p>
        </div>

        {/* Actions */}
        <div className={styles.actionRow}>
          <button
            type="button"
            className={styles.approveBtn}
            onClick={handleApprove}
          >
            Approve Offer
          </button>
          <button
            type="button"
            className={styles.continueBtn}
            onClick={handleApprove}
          >
            Continue to Agreement
          </button>
        </div>

        <div className={styles.disclaimer}>
          <p>
            By approving this offer you acknowledge that this is a monitoring-only service.
            No IRS representation is provided under this agreement.
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
