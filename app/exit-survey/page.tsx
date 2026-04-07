'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import styles from './page.module.css'

const SATISFACTION_OPTIONS = [
  'Very satisfied',
  'Satisfied',
  'Neutral',
  'Dissatisfied',
  'Very dissatisfied',
]

const JOURNEY_STAGES = [
  'Explore (Research & Information)',
  'Cart (Decision & Purchase)',
  'Setup (Onboarding)',
  'Support (Ongoing Service)',
  'Exit (Offboarding)',
]

const EXIT_REASONS = [
  'Completed engagement',
  'No longer needs service',
  'Pricing concerns',
  'Service quality concerns',
  'Switched providers',
  'Other (please specify)',
]

const EXPECTATION_OPTIONS = [
  'Exceeded expectations',
  'Met expectations',
  'Partially met expectations',
  'Did not meet expectations',
]

export default function ExitSurveyPage() {
  const [satisfaction, setSatisfaction] = useState('')
  const [nps, setNps] = useState('')
  const [journeyStage, setJourneyStage] = useState('')
  const [exitReason, setExitReason] = useState('')
  const [expectations, setExpectations] = useState('')
  const [friction, setFriction] = useState('')
  const [positive, setPositive] = useState('')
  const [followUp, setFollowUp] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!satisfaction || !nps || !journeyStage || !exitReason || !expectations || !followUp) {
      setError('Please complete all required fields.')
      return
    }
    setSubmitting(true)
    setError('')

    // Store in-memory; no API call needed initially
    const _payload = {
      overall_satisfaction: satisfaction,
      likelihood_to_recommend: nps,
      journey_stage_improvement: journeyStage,
      exit_reason: exitReason,
      service_outcome_met: expectations,
      exit_friction_point: friction,
      exit_positive_feedback: positive,
      exit_followup_allowed: followUp,
      submitted_at: new Date().toISOString(),
    }
    void _payload

    // Simulate brief delay then show success
    setTimeout(() => {
      setSubmitting(false)
      setSubmitted(true)
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }, 600)
  }

  return (
    <>
      <Header variant="site" />
      <main className={styles.page}>
        <div className={styles.inner}>
          {submitted && (
            <div className={styles.inlineSuccess}>
              <div className={styles.successIcon}>
                <svg className={styles.successIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className={styles.successTitle}>Thank you for your feedback</h2>
              <p className={styles.successDesc}>
                We certainly appreciate the opportunity to serve you and to continue to serve you with the best quality experience.
              </p>
              <div className={styles.successActions}>
                <Link href="/" className={styles.successBtnSecondary}>Return to site</Link>
                <Link href="/dashboard" className={styles.successBtnPrimary}>Return to dashboard</Link>
              </div>
            </div>
          )}
          {/* Hero */}
          <div className={styles.hero}>
            <div className={styles.heroBadge}>
              <span>Exit Survey</span>
              <span className={styles.heroBadgeSep}>&bull;</span>
              <span>~2 minutes</span>
            </div>
            <h1 className={styles.heroTitle}>Help us improve the experience</h1>
            <p className={styles.heroSub}>
              Your feedback helps us refine onboarding, support, and offboarding.
            </p>
            <div className={styles.heroPills}>
              <span className={styles.heroPill}>
                <svg className={styles.heroPillIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Secure
              </span>
              <span className={styles.heroPill}>
                <svg className={styles.heroPillIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Confidential
              </span>
            </div>
          </div>

          {/* Content grid */}
          <div className={styles.grid}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
              <div className={styles.sidebarCard}>
                <h2 className={styles.sidebarTitle}>Why we ask this</h2>
                <p className={styles.sidebarDesc}>
                  This survey helps us pinpoint what to fix in the full client journey: explore, purchase, onboarding, support, and exit.
                </p>
                <div className={styles.sidebarSteps}>
                  <div className={styles.sidebarStep}>
                    <div className={styles.sidebarStepNum}>1</div>
                    <div>
                      <div className={styles.sidebarStepTitle}>Better onboarding</div>
                      <div className={styles.sidebarStepDesc}>Less confusion, fewer follow-ups, faster setup.</div>
                    </div>
                  </div>
                  <div className={styles.sidebarStep}>
                    <div className={styles.sidebarStepNum}>2</div>
                    <div>
                      <div className={styles.sidebarStepTitle}>Clearer expectations</div>
                      <div className={styles.sidebarStepDesc}>Better alignment between what we promise and what you experience.</div>
                    </div>
                  </div>
                  <div className={styles.sidebarStep}>
                    <div className={styles.sidebarStepNum}>3</div>
                    <div>
                      <div className={styles.sidebarStepTitle}>Smoother offboarding</div>
                      <div className={styles.sidebarStepDesc}>Clean closes and fewer lingering loose ends.</div>
                    </div>
                  </div>
                </div>
              </div>
              <p className={styles.sidebarNote}>
                Your answers are used for service improvement and offboarding quality. Monitoring does not create IRS representation.
              </p>
            </aside>

            {/* Form */}
            <div className={styles.formCard}>
              <div className={styles.formHeader}>
                <svg className={styles.formHeaderIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 11h6m-6 4h6M7 21h10a2 2 0 002-2V7a2 2 0 00-2-2h-3l-1-2H11l-1 2H7a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h2 className={styles.formTitle}>Survey</h2>
              </div>
              <p className={styles.formSub}>Please answer what you can. Required fields are marked.</p>

              <form onSubmit={handleSubmit}>
                <div className={styles.formFields}>
                  {/* Overall satisfaction */}
                  <div className={styles.fieldGroup}>
                    <label htmlFor="satisfaction" className={styles.fieldLabel}>
                      Overall, how satisfied were you with Tax Monitor Pro? <span className={styles.required}>*</span>
                    </label>
                    <div className={styles.selectWrapper}>
                      <select
                        id="satisfaction"
                        className={styles.selectInput}
                        value={satisfaction}
                        onChange={(e) => setSatisfaction(e.target.value)}
                        required
                      >
                        <option value="">Select a rating...</option>
                        {SATISFACTION_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                      <svg className={styles.selectArrow} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* NPS */}
                  <div className={styles.fieldGroup}>
                    <label htmlFor="nps" className={styles.fieldLabel}>
                      How likely are you to recommend us to a colleague or friend? (0-10) <span className={styles.required}>*</span>
                    </label>
                    <input
                      id="nps"
                      type="number"
                      min="0"
                      max="10"
                      step="1"
                      className={styles.numberInput}
                      placeholder="0-10"
                      value={nps}
                      onChange={(e) => setNps(e.target.value)}
                      required
                    />
                    <p className={styles.fieldHint}>0-6 = unlikely, 7-8 = neutral, 9-10 = likely.</p>
                  </div>

                  {/* Journey stage */}
                  <div className={styles.fieldGroup}>
                    <label htmlFor="journey" className={styles.fieldLabel}>
                      Which part of your journey needs the most improvement? <span className={styles.required}>*</span>
                    </label>
                    <div className={styles.selectWrapper}>
                      <select
                        id="journey"
                        className={styles.selectInput}
                        value={journeyStage}
                        onChange={(e) => setJourneyStage(e.target.value)}
                        required
                      >
                        <option value="">Select one...</option>
                        {JOURNEY_STAGES.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                      <svg className={styles.selectArrow} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Exit reason */}
                  <div className={styles.fieldGroup}>
                    <label htmlFor="reason" className={styles.fieldLabel}>
                      What is the primary reason you are ending service? <span className={styles.required}>*</span>
                    </label>
                    <div className={styles.selectWrapper}>
                      <select
                        id="reason"
                        className={styles.selectInput}
                        value={exitReason}
                        onChange={(e) => setExitReason(e.target.value)}
                        required
                      >
                        <option value="">Select a reason...</option>
                        {EXIT_REASONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                      <svg className={styles.selectArrow} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Expectations */}
                  <div className={styles.fieldGroup}>
                    <label htmlFor="expectations" className={styles.fieldLabel}>
                      Did our service meet your expectations? <span className={styles.required}>*</span>
                    </label>
                    <div className={styles.selectWrapper}>
                      <select
                        id="expectations"
                        className={styles.selectInput}
                        value={expectations}
                        onChange={(e) => setExpectations(e.target.value)}
                        required
                      >
                        <option value="">Select an option...</option>
                        {EXPECTATION_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                      <svg className={styles.selectArrow} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Friction */}
                  <div className={styles.fieldGroup}>
                    <label htmlFor="friction" className={styles.fieldLabel}>
                      What was the most frustrating or confusing part of your experience? <span className={styles.optional}>(optional)</span>
                    </label>
                    <textarea
                      id="friction"
                      className={styles.textareaInput}
                      rows={4}
                      placeholder="Be specific. This helps us fix real issues."
                      value={friction}
                      onChange={(e) => setFriction(e.target.value)}
                    />
                  </div>

                  {/* Positive */}
                  <div className={styles.fieldGroup}>
                    <label htmlFor="positive" className={styles.fieldLabel}>
                      What did we do particularly well? <span className={styles.optional}>(optional)</span>
                    </label>
                    <textarea
                      id="positive"
                      className={styles.textareaInput}
                      rows={4}
                      placeholder="Tell us what to keep doing."
                      value={positive}
                      onChange={(e) => setPositive(e.target.value)}
                    />
                  </div>

                  {/* Follow-up */}
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>
                      May we follow up with you about your feedback? <span className={styles.required}>*</span>
                    </label>
                    <div className={styles.radioGroup}>
                      <label className={styles.radioLabel}>
                        <input
                          type="radio"
                          name="followup"
                          value="No"
                          className={styles.radioInput}
                          checked={followUp === 'No'}
                          onChange={(e) => setFollowUp(e.target.value)}
                          required
                        />
                        <span className={styles.radioText}>No, please do not contact me</span>
                      </label>
                      <label className={styles.radioLabel}>
                        <input
                          type="radio"
                          name="followup"
                          value="Yes"
                          className={styles.radioInput}
                          checked={followUp === 'Yes'}
                          onChange={(e) => setFollowUp(e.target.value)}
                          required
                        />
                        <span className={styles.radioText}>Yes, I am open to a follow-up</span>
                      </label>
                    </div>
                  </div>

                  {/* Error */}
                  {error && <div className={styles.errorBox}>{error}</div>}

                  {/* Submit */}
                  <div className={styles.submitWrap}>
                    <button type="submit" className={styles.submitBtn} disabled={submitting}>
                      {submitting ? 'Submitting...' : 'Submit'}
                    </button>
                    <p className={styles.submitDisclaimer}>
                      Monitoring does not create IRS representation. Representation, filing, and resolution are separate engagements.
                    </p>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}
