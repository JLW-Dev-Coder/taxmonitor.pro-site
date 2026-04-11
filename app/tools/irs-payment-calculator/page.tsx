'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { api } from '@/lib/api'
import styles from './page.module.css'

type Step = 0 | 1 | 2 | 3 | 4

type NoticeChoice = 'yes' | 'no' | null
type DisputeChoice = '' | 'no' | 'yes' | 'unsure'
type LifeChange = '' | 'stable' | 'reduced' | 'improved' | 'uncertain'
type ScenarioKey = 'full' | 'mixed' | 'partial'

const STEP_LABELS = [
  'Balance',
  'How it works',
  'Years',
  'Capacity',
  'Results',
]

const IRM_LINKS = {
  installmentAgreements: 'https://www.irs.gov/irm/part5/irm_05-014-001',
  collectionStatute: 'https://www.irs.gov/irm/part5/irm_05-001-019',
  statuteDate: 'https://www.irs.gov/irm/part5/irm_05-001-019#idm140428989756112',
  disputes: 'https://www.irs.gov/irm/part5/irm_05-001-019#idm140428989720672',
  payCapacity: 'https://www.irs.gov/irm/part5/irm_05-014-001#idm140428987562688',
  timing: 'https://www.irs.gov/irm/part5/irm_05-014-001#idm140428987509840',
  offers: 'https://www.irs.gov/irm/part5/irm_05-008-001',
}

function formatCurrency(value: string): string {
  const digits = value.replace(/[^\d]/g, '')
  if (!digits) return ''
  return parseInt(digits, 10).toLocaleString('en-US')
}

function toNumber(display: string): number {
  const digits = display.replace(/[^\d]/g, '')
  return digits ? parseInt(digits, 10) : 0
}

function formatMoney(n: number): string {
  return '$' + Math.round(n).toLocaleString('en-US')
}

export default function IrsPaymentCalculatorPage() {
  const [step, setStep] = useState<Step>(0)

  const [balanceDisplay, setBalanceDisplay] = useState('')
  const balance = toNumber(balanceDisplay)

  const [years, setYears] = useState<number[]>([])
  const [hasNotice, setHasNotice] = useState<NoticeChoice>(null)
  const [noticeDate, setNoticeDate] = useState('')
  const [dispute, setDispute] = useState<DisputeChoice>('')

  const [monthlyDisplay, setMonthlyDisplay] = useState('')
  const monthly = toNumber(monthlyDisplay)
  const [lifeChange, setLifeChange] = useState<LifeChange>('')

  const [leadName, setLeadName] = useState('')
  const [leadEmail, setLeadEmail] = useState('')
  const [leadSituation, setLeadSituation] = useState('')
  const [leadSubmitting, setLeadSubmitting] = useState(false)
  const [leadSubmitted, setLeadSubmitted] = useState(false)
  const [leadError, setLeadError] = useState('')

  const currentYear = new Date().getFullYear()
  const yearOptions = useMemo(
    () => Array.from({ length: 10 }, (_, i) => currentYear - i),
    [currentYear]
  )

  const oldestYear = years.length ? Math.min(...years) : null

  const outcome = useMemo(() => {
    if (!oldestYear || balance <= 0 || monthly <= 0) {
      return null
    }

    const estAssessment = new Date(oldestYear + 1, 3, 15)
    let assessment = estAssessment
    if (hasNotice === 'yes' && noticeDate) {
      const parsed = new Date(noticeDate)
      if (!isNaN(parsed.getTime()) && parsed > estAssessment) {
        assessment = parsed
      }
    }

    const expiration = new Date(assessment)
    expiration.setFullYear(expiration.getFullYear() + 10)
    if (dispute === 'yes') {
      expiration.setMonth(expiration.getMonth() + 6)
    }

    const today = new Date()
    const monthsUntil = Math.max(
      0,
      (expiration.getFullYear() - today.getFullYear()) * 12 +
        (expiration.getMonth() - today.getMonth())
    )
    const yearsUntil = Math.max(0, Math.floor(monthsUntil / 12))

    const totalPaid = Math.min(monthly * monthsUntil, balance)
    const remaining = Math.max(0, balance - totalPaid)

    let scenario: ScenarioKey
    if (remaining === 0) scenario = 'full'
    else if (remaining > balance * 0.5) scenario = 'partial'
    else scenario = 'mixed'

    return {
      expirationYear: expiration.getFullYear(),
      monthsUntil,
      yearsUntil,
      totalPaid,
      remaining,
      scenario,
    }
  }, [oldestYear, balance, monthly, hasNotice, noticeDate, dispute])

  function goTo(next: Step) {
    setStep(next)
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  function toggleYear(y: number) {
    setYears((prev) =>
      prev.includes(y) ? prev.filter((x) => x !== y) : [...prev, y]
    )
  }

  async function submitLead(e: React.FormEvent) {
    e.preventDefault()
    if (!leadName.trim() || !leadEmail.trim()) {
      setLeadError('Please enter your name and email.')
      return
    }
    setLeadError('')
    setLeadSubmitting(true)
    try {
      const summary = [
        `IRS Payment Calculator lead`,
        `Balance: ${formatMoney(balance)}`,
        `Years: ${years.sort((a, b) => a - b).join(', ')}`,
        `Monthly capacity: ${formatMoney(monthly)}`,
        outcome
          ? `Estimated paid: ${formatMoney(outcome.totalPaid)} | Remaining: ${formatMoney(outcome.remaining)} | Scenario: ${outcome.scenario}`
          : '',
        leadSituation ? `Situation: ${leadSituation}` : '',
      ]
        .filter(Boolean)
        .join('\n')

      await api.createInquiry({
        name: leadName,
        email: leadEmail,
        message: leadSituation || summary,
        description: leadSituation || summary,
        service_needed: 'Tax Resolution',
        state: null,
        entity_type: 'Individuals',
        source: 'inquiry_form',
        source_page: '/tools/irs-payment-calculator',
        tax_situation: summary,
      })
      setLeadSubmitted(true)
    } catch (err) {
      setLeadError(
        err instanceof Error ? err.message : 'Submission failed. Please try again.'
      )
    } finally {
      setLeadSubmitting(false)
    }
  }

  const canContinueStep0 = balance > 0
  const canContinueStep2 = years.length > 0
  const canContinueStep3 = monthly > 0

  return (
    <>
      <Header variant="site" />
      <main className={styles.main}>
        <div className={styles.container}>
          {/* Step dots */}
          <div className={styles.stepDots} aria-label="Progress">
            {STEP_LABELS.map((label, i) => (
              <div
                key={label}
                className={`${styles.stepDot} ${i <= step ? styles.stepDotActive : ''} ${i === step ? styles.stepDotCurrent : ''}`}
              >
                <span className={styles.stepDotNum}>{i + 1}</span>
                <span className={styles.stepDotLabel}>{label}</span>
              </div>
            ))}
          </div>

          {/* Step 0 — Hero + Balance Input */}
          {step === 0 && (
            <section className={styles.heroGrid}>
              <div className={styles.heroLeft}>
                <h1 className={styles.heroHeading}>
                  Will your IRS debt actually be{' '}
                  <span className={styles.accent}>paid</span> — or{' '}
                  <span className={styles.accent}>expire</span>?
                </h1>
                <p className={styles.heroBody}>
                  Some taxpayers pay for years and never fully satisfy the
                  balance. This calculator reveals what your timeline may look
                  like based on the IRS statute of limitations.
                </p>
                <p className={styles.heroHint}>
                  <em>Let&apos;s start with your current IRS balance.</em>
                </p>
              </div>

              <div className={styles.card}>
                <div className={styles.cardKicker}>Quick assessment</div>
                <label className={styles.fieldLabel} htmlFor="balance">
                  Total IRS balance owed
                </label>
                <div className={styles.currencyWrap}>
                  <span className={styles.currencyPrefix}>$</span>
                  <input
                    id="balance"
                    className={styles.currencyInput}
                    type="text"
                    inputMode="numeric"
                    placeholder="24,847"
                    value={balanceDisplay}
                    onChange={(e) =>
                      setBalanceDisplay(formatCurrency(e.target.value))
                    }
                  />
                </div>
                <p className={styles.hint}>
                  From your IRS notice or transcript. If you owe for multiple
                  years, enter your total combined balance.
                </p>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  disabled={!canContinueStep0}
                  onClick={() => goTo(1)}
                >
                  Run my calculation &rarr;
                </button>
              </div>
            </section>
          )}

          {/* Step 1 — Education */}
          {step === 1 && (
            <section className={styles.section}>
              <button
                type="button"
                className={styles.backBtn}
                onClick={() => goTo(0)}
              >
                &larr; Back
              </button>
              <h2 className={styles.sectionHeading}>
                Most taxpayers don&apos;t know this
              </h2>
              <p className={styles.sectionSubhead}>
                The IRS has a limited time to collect. Understanding your
                statute is the key to your strategy.
              </p>

              <div className={styles.factGrid}>
                <div className={styles.factCard}>
                  <div className={styles.factBig}>10 years</div>
                  <div className={styles.factTitle}>IRS collection window</div>
                  <div className={styles.factDesc}>
                    After which they must stop collecting
                  </div>
                </div>
                <div className={styles.factCard}>
                  <div className={styles.factBig}>Per year</div>
                  <div className={styles.factTitle}>
                    Each tax year has its own clock
                  </div>
                  <div className={styles.factDesc}>
                    Your oldest year expires first
                  </div>
                </div>
                <div className={styles.factCard}>
                  <div className={styles.factBig}>Strategic</div>
                  <div className={styles.factTitle}>
                    Timing changes everything
                  </div>
                  <div className={styles.factDesc}>
                    Your payment plan matters more than total owed
                  </div>
                </div>
              </div>

              <div className={styles.timeline}>
                <div className={styles.timelineNode}>
                  <div className={styles.timelineDot} />
                  <div className={styles.timelineLabel}>Assessment date</div>
                </div>
                <div className={styles.timelineLine} />
                <div className={styles.timelineNode}>
                  <div className={styles.timelineDot} />
                  <div className={styles.timelineLabel}>
                    Payment plan years
                  </div>
                </div>
                <div className={styles.timelineLine} />
                <div className={styles.timelineNode}>
                  <div className={styles.timelineDot} />
                  <div className={styles.timelineLabel}>Statute expires</div>
                </div>
              </div>

              <div className={styles.refLinks}>
                <a
                  href={IRM_LINKS.installmentAgreements}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.refLink}
                >
                  IRM 5.14.1 &mdash; Installment agreements &rarr;
                </a>
                <a
                  href={IRM_LINKS.collectionStatute}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.refLink}
                >
                  IRM 5.1.19 &mdash; Collection statute &rarr;
                </a>
              </div>

              <button
                type="button"
                className={styles.primaryBtn}
                onClick={() => goTo(2)}
              >
                Continue to your details &rarr;
              </button>
            </section>
          )}

          {/* Step 2 — Years + Notices + Disputes */}
          {step === 2 && (
            <section className={styles.section}>
              <button
                type="button"
                className={styles.backBtn}
                onClick={() => goTo(1)}
              >
                &larr; Back
              </button>
              <h2 className={styles.sectionHeading}>
                Which tax years do you owe for?
              </h2>
              <p className={styles.sectionSubhead}>
                Select all years where you have an outstanding balance with the
                IRS. Your oldest year is the most strategically important —
                it&apos;s the one closest to expiring.
              </p>

              <div className={styles.card}>
                <div className={styles.yearGrid}>
                  {yearOptions.map((y) => (
                    <button
                      key={y}
                      type="button"
                      className={`${styles.yearChip} ${years.includes(y) ? styles.yearChipActive : ''}`}
                      onClick={() => toggleYear(y)}
                    >
                      {y}
                    </button>
                  ))}
                </div>

                <div className={styles.yearCount}>
                  {years.length} year{years.length === 1 ? '' : 's'} selected
                </div>

                {oldestYear && (
                  <div className={styles.infoBox}>
                    Your oldest tax year is <strong>{oldestYear}</strong>. The
                    IRS collection clock for this year likely started around
                    April {oldestYear + 1}. This is the year we will base your
                    timeline on.
                  </div>
                )}

                <hr className={styles.divider} />

                <label className={styles.fieldLabel}>
                  Have you received any IRS notices about these years?
                </label>
                <div className={styles.toggleRow}>
                  <button
                    type="button"
                    className={`${styles.toggleBtn} ${hasNotice === 'yes' ? styles.toggleBtnActive : ''}`}
                    onClick={() => setHasNotice('yes')}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    className={`${styles.toggleBtn} ${hasNotice === 'no' ? styles.toggleBtnActive : ''}`}
                    onClick={() => setHasNotice('no')}
                  >
                    No
                  </button>
                </div>

                {hasNotice === 'yes' && (
                  <div className={styles.subField}>
                    <label className={styles.fieldLabel} htmlFor="noticeDate">
                      What&apos;s the date on your most recent notice?
                    </label>
                    <input
                      id="noticeDate"
                      type="date"
                      className={styles.input}
                      value={noticeDate}
                      onChange={(e) => setNoticeDate(e.target.value)}
                    />
                    <p className={styles.hint}>
                      The notice date can affect your collection statute
                      calculation.{' '}
                      <a
                        href={IRM_LINKS.statuteDate}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.inlineLink}
                      >
                        IRM 5.1.19.1
                      </a>
                    </p>
                  </div>
                )}

                <hr className={styles.divider} />

                <label className={styles.fieldLabel} htmlFor="dispute">
                  Are there any pending disputes or appeals?
                </label>
                <select
                  id="dispute"
                  className={styles.select}
                  value={dispute}
                  onChange={(e) =>
                    setDispute(e.target.value as DisputeChoice)
                  }
                >
                  <option value="">Select an option</option>
                  <option value="no">No, no disputes pending</option>
                  <option value="yes">
                    Yes, I have a pending appeal or dispute
                  </option>
                  <option value="unsure">I&apos;m not sure</option>
                </select>
                <p className={styles.hint}>
                  Pending disputes can pause the collection statute clock.{' '}
                  <a
                    href={IRM_LINKS.disputes}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.inlineLink}
                  >
                    IRM 5.1.19.3
                  </a>
                </p>
              </div>

              <button
                type="button"
                className={styles.primaryBtn}
                disabled={!canContinueStep2}
                onClick={() => goTo(3)}
              >
                Continue to payment ability &rarr;
              </button>
            </section>
          )}

          {/* Step 3 — Payment capacity */}
          {step === 3 && (
            <section className={styles.section}>
              <button
                type="button"
                className={styles.backBtn}
                onClick={() => goTo(2)}
              >
                &larr; Back
              </button>
              <h2 className={styles.sectionHeading}>Your payment capacity</h2>
              <p className={styles.sectionSubhead}>
                Based on your ability to pay, let&apos;s model what actually
                happens over time.
              </p>

              <div className={styles.card}>
                <label className={styles.fieldLabel} htmlFor="monthly">
                  How much can you realistically pay monthly?
                </label>
                <div className={styles.currencyWrap}>
                  <span className={styles.currencyPrefix}>$</span>
                  <input
                    id="monthly"
                    className={styles.currencyInput}
                    type="text"
                    inputMode="numeric"
                    placeholder="450"
                    value={monthlyDisplay}
                    onChange={(e) =>
                      setMonthlyDisplay(formatCurrency(e.target.value))
                    }
                  />
                </div>
                <p className={styles.hint}>
                  Be honest — the IRS examines your actual ability to pay.{' '}
                  <a
                    href={IRM_LINKS.payCapacity}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.inlineLink}
                  >
                    IRM 5.14.1.2
                  </a>
                </p>

                <hr className={styles.divider} />

                <label className={styles.fieldLabel} htmlFor="lifeChange">
                  Any recent life changes affecting payment?
                </label>
                <select
                  id="lifeChange"
                  className={styles.select}
                  value={lifeChange}
                  onChange={(e) =>
                    setLifeChange(e.target.value as LifeChange)
                  }
                >
                  <option value="">Select an option</option>
                  <option value="stable">Stable — no major changes</option>
                  <option value="reduced">Reduced income or job loss</option>
                  <option value="improved">Improved financial situation</option>
                  <option value="uncertain">Uncertain / changing</option>
                </select>
              </div>

              <button
                type="button"
                className={styles.primaryBtn}
                disabled={!canContinueStep3}
                onClick={() => goTo(4)}
              >
                Calculate my outcome &rarr;
              </button>
            </section>
          )}

          {/* Step 4 — Results */}
          {step === 4 && outcome && (
            <section className={styles.section}>
              <button
                type="button"
                className={styles.backBtn}
                onClick={() => goTo(3)}
              >
                &larr; Back
              </button>
              <h2 className={styles.sectionHeading}>Your estimated outcome</h2>

              <div className={styles.outcomeGrid}>
                <div className={styles.outcomeCard}>
                  <div className={styles.outcomeLabel}>Estimated total paid</div>
                  <div className={styles.outcomeValue}>
                    {formatMoney(outcome.totalPaid)}
                  </div>
                  <div className={styles.outcomeSub}>
                    Before statute expiration
                  </div>
                </div>
                <div className={styles.outcomeCard}>
                  <div className={styles.outcomeLabel}>Remaining balance</div>
                  <div className={styles.outcomeValue}>
                    {formatMoney(outcome.remaining)}
                  </div>
                  <div className={styles.outcomeSub}>
                    At statute expiration
                  </div>
                </div>
                <div className={styles.outcomeCard}>
                  <div className={styles.outcomeLabel}>Oldest year expires</div>
                  <div className={styles.outcomeValue}>
                    {outcome.expirationYear}
                  </div>
                  <div className={styles.outcomeSub}>
                    {outcome.yearsUntil} year
                    {outcome.yearsUntil === 1 ? '' : 's'} remaining
                  </div>
                </div>
              </div>

              <div
                className={`${styles.scenarioBox} ${styles['scenario_' + outcome.scenario]}`}
              >
                <div className={styles.scenarioKicker}>Likely outcome</div>
                <div className={styles.scenarioTitle}>
                  {outcome.scenario === 'full' && 'Full pay scenario'}
                  {outcome.scenario === 'mixed' && 'Mixed scenario'}
                  {outcome.scenario === 'partial' && 'Partial pay scenario'}
                </div>
                <p className={styles.scenarioDesc}>
                  {outcome.scenario === 'full' &&
                    'Based on your monthly capacity and the time remaining, your balance may be fully satisfied before the collection statute expires. Staying current and confirming your plan terms are critical.'}
                  {outcome.scenario === 'mixed' &&
                    'You are on track to pay a meaningful portion of the balance, but a remainder may still be outstanding when your oldest year expires. The strategy for what happens next matters.'}
                  {outcome.scenario === 'partial' &&
                    'At your current payment capacity, a significant portion of the balance may remain when the statute expires on your oldest year. This is a strategic position — and it deserves professional review.'}
                </p>
                <span
                  className={`${styles.scenarioBadge} ${styles['badge_' + outcome.scenario]}`}
                >
                  {outcome.scenario === 'full' && 'Favorable timeline'}
                  {outcome.scenario === 'mixed' && 'Needs review'}
                  {outcome.scenario === 'partial' && 'Action required'}
                </span>
              </div>

              <p className={styles.scenarioContext}>
                Based on {years.length} tax year
                {years.length === 1 ? '' : 's'} (
                {years.sort((a, b) => a - b).join(', ')}) with{' '}
                {formatMoney(monthly)}/month payments
              </p>

              <div className={styles.insightGrid}>
                <div className={styles.insightCard}>
                  <div className={styles.insightTitle}>Payment strategy</div>
                  <p className={styles.insightBody}>
                    Depending on your situation, a structured installment
                    agreement or an Offer in Compromise may change what you
                    actually pay.
                  </p>
                  <a
                    href={IRM_LINKS.offers}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.insightLink}
                  >
                    IRM 5.8 &rarr;
                  </a>
                </div>
                <div className={styles.insightCard}>
                  <div className={styles.insightTitle}>Timing priority</div>
                  <p className={styles.insightBody}>
                    The 60&ndash;90 day window after an IRS notice is when
                    strategic decisions have the most leverage.
                  </p>
                  <a
                    href={IRM_LINKS.timing}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.insightLink}
                  >
                    IRM 5.14.1.4 &rarr;
                  </a>
                </div>
                <div className={styles.insightCard}>
                  <div className={styles.insightTitle}>Next steps</div>
                  <p className={styles.insightBody}>
                    Consult a tax professional who specializes in IRS
                    representation before making a long-term payment
                    commitment.
                  </p>
                  <Link
                    href="/directory"
                    className={styles.insightLink}
                  >
                    Browse directory &rarr;
                  </Link>
                </div>
              </div>

              <div className={styles.disclaimerBox}>
                This calculator is for educational purposes and does not
                constitute tax, legal, or financial advice. Actual outcomes
                depend on your complete financial picture, IRS approval,
                compliance history, and payment plan terms. Each tax year has
                its own collection statute expiration date (CSED) — this tool
                uses simplified estimates based on your oldest year. Results
                are estimates only. Consult a qualified tax professional for
                guidance specific to your situation. See{' '}
                <a
                  href={IRM_LINKS.installmentAgreements}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.inlineLink}
                >
                  IRM 5.14.1
                </a>{' '}
                and{' '}
                <a
                  href={IRM_LINKS.offers}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.inlineLink}
                >
                  IRM 5.8
                </a>
                .
              </div>

              <div className={styles.ctaGrid}>
                {/* Left — Lead capture */}
                <div className={styles.ctaCard}>
                  <h3 className={styles.ctaHeading}>
                    Get clarity on your IRS situation
                  </h3>
                  <p className={styles.ctaBody}>
                    A tax professional can review your transcripts, confirm
                    your collection statute timeline, and walk you through the
                    options that actually move your situation forward.
                  </p>
                  <form onSubmit={submitLead} className={styles.leadForm}>
                    <label className={styles.fieldLabel} htmlFor="leadName">
                      Full name
                    </label>
                    <input
                      id="leadName"
                      type="text"
                      className={styles.input}
                      value={leadName}
                      onChange={(e) => setLeadName(e.target.value)}
                      disabled={leadSubmitted}
                      required
                    />
                    <label className={styles.fieldLabel} htmlFor="leadEmail">
                      Email
                    </label>
                    <input
                      id="leadEmail"
                      type="email"
                      className={styles.input}
                      value={leadEmail}
                      onChange={(e) => setLeadEmail(e.target.value)}
                      disabled={leadSubmitted}
                      required
                    />
                    <label
                      className={styles.fieldLabel}
                      htmlFor="leadSituation"
                    >
                      Your situation (optional)
                    </label>
                    <textarea
                      id="leadSituation"
                      className={styles.textarea}
                      rows={4}
                      value={leadSituation}
                      onChange={(e) => setLeadSituation(e.target.value)}
                      disabled={leadSubmitted}
                      placeholder="What's going on with your IRS balance?"
                    />
                    {leadError && (
                      <p className={styles.errorText}>{leadError}</p>
                    )}
                    <button
                      type="submit"
                      className={styles.primaryBtn}
                      disabled={leadSubmitting || leadSubmitted}
                    >
                      {leadSubmitted
                        ? 'Submitted — check your email'
                        : leadSubmitting
                          ? 'Submitting...'
                          : 'Review my IRS situation'}
                    </button>
                    <p className={styles.finePrint}>
                      By submitting, you agree to be contacted about your IRS
                      situation.
                    </p>
                  </form>
                </div>

                {/* Right — Pro placeholders */}
                <div className={styles.ctaCard}>
                  <h3 className={styles.ctaHeading}>Tax professionals ready</h3>
                  <p className={styles.ctaBody}>
                    Specialists matched to your IRS situation.
                  </p>
                  <div className={styles.proList}>
                    <div className={styles.proCard}>
                      <div className={styles.proAvatar}>DR</div>
                      <div>
                        <div className={styles.proName}>
                          David Reyes, EA
                        </div>
                        <div className={styles.proTitle}>
                          Enrolled Agent
                        </div>
                        <div className={styles.proSpec}>
                          IRS collections &amp; installment agreements
                        </div>
                      </div>
                    </div>
                    <div className={styles.proCard}>
                      <div className={styles.proAvatar}>MK</div>
                      <div>
                        <div className={styles.proName}>
                          Marcy Khan, CPA
                        </div>
                        <div className={styles.proTitle}>
                          CPA &middot; Tax Resolution
                        </div>
                        <div className={styles.proSpec}>
                          Offer in Compromise &amp; penalty abatement
                        </div>
                      </div>
                    </div>
                    <div className={styles.proCard}>
                      <div className={styles.proAvatar}>JT</div>
                      <div>
                        <div className={styles.proName}>
                          Jordan Tate, Esq.
                        </div>
                        <div className={styles.proTitle}>
                          Tax Attorney
                        </div>
                        <div className={styles.proSpec}>
                          Appeals &amp; collection due process
                        </div>
                      </div>
                    </div>
                  </div>
                  <a
                    href="https://taxmonitor.pro/directory"
                    className={styles.secondaryBtn}
                  >
                    Browse all professionals &rarr;
                  </a>
                  <p className={styles.finePrint}>
                    Professionals are vetted and specialize in IRS situations
                    like yours.
                  </p>
                </div>
              </div>

              <p className={styles.footerDisclaimer}>
                Tax Monitor Pro is an educational and matching platform. We do
                not provide tax advice.
              </p>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
