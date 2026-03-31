'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import StepProgress from '@/components/StepProgress'
import styles from './page.module.css'

const STEPS = ['Inquiry', 'Intake', 'Offer', 'Agreement', 'Payment']

const FILING_STATUS_OPTIONS = [
  'Single',
  'Married Filing Jointly',
  'Married Filing Separately',
  'Head of Household',
  'Qualifying Surviving Spouse',
]

const TAX_YEARS = ['2025', '2024', '2023', '2022', '2021', '2020', 'Prior']

interface PersonalInfo {
  first_name: string
  last_name: string
  email: string
  phone: string
}

interface TaxDetails {
  filing_status: string
  tax_years: string[]
  irs_contact_history: string
  additional_notes: string
}

export default function IntakePage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [inquiryData, setInquiryData] = useState<Record<string, unknown> | null>(null)

  const [personal, setPersonal] = useState<PersonalInfo>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
  })

  const [taxDetails, setTaxDetails] = useState<TaxDetails>({
    filing_status: '',
    tax_years: [],
    irs_contact_history: '',
    additional_notes: '',
  })

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('inquiry_data')
      if (raw) {
        const data = JSON.parse(raw)
        setInquiryData(data)
        setPersonal((prev) => ({
          ...prev,
          first_name: (data.first_name as string) || '',
          last_name: (data.last_name as string) || '',
          email: (data.email as string) || '',
        }))
      }
    } catch {
      /* no inquiry data */
    }
  }, [])

  const totalSteps = 3
  const progress = ((step + 1) / totalSteps) * 100

  function toggleTaxYear(year: string) {
    setTaxDetails((prev) => ({
      ...prev,
      tax_years: prev.tax_years.includes(year)
        ? prev.tax_years.filter((y) => y !== year)
        : [...prev.tax_years, year],
    }))
  }

  function canAdvanceStep(): boolean {
    if (step === 0) {
      return (
        personal.first_name.trim() !== '' &&
        personal.last_name.trim() !== '' &&
        personal.email.trim() !== '' &&
        personal.phone.trim() !== ''
      )
    }
    if (step === 1) {
      return personal.first_name.trim() !== '' && taxDetails.filing_status !== ''
    }
    return true
  }

  function handleNext() {
    if (step < totalSteps - 1) {
      setStep(step + 1)
    }
  }

  function handleBack() {
    if (step > 0) setStep(step - 1)
  }

  function handleSubmit() {
    const intakeData = {
      personal,
      tax_details: taxDetails,
      inquiry: inquiryData,
      submitted_at: new Date().toISOString(),
    }
    sessionStorage.setItem('intake_data', JSON.stringify(intakeData))
    router.push('/offer')
  }

  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className={styles.stepWrap}>
          <StepProgress steps={STEPS} current={1} />
        </div>

        <section className={styles.hero}>
          <h1 className={styles.heading}>
            Tax Monitoring <span className={styles.accent}>Intake</span>
          </h1>
          <p className={styles.subtitle}>
            Visibility first. Decisions second.
          </p>
        </section>

        {/* Progress bar */}
        <div className={styles.progressBarWrap}>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
          <span className={styles.progressLabel}>
            Step {step + 1} of {totalSteps}
          </span>
        </div>

        <div className={styles.formArea}>
          {/* Step 1: Personal Information */}
          {step === 0 && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Personal Information</h2>
              <p className={styles.cardDesc}>
                Confirm or complete your contact details below.
              </p>

              <div className={styles.fieldGrid}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="first_name">
                    First Name <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="first_name"
                    type="text"
                    className={styles.input}
                    value={personal.first_name}
                    onChange={(e) => setPersonal({ ...personal, first_name: e.target.value })}
                    placeholder="First name"
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="last_name">
                    Last Name <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="last_name"
                    type="text"
                    className={styles.input}
                    value={personal.last_name}
                    onChange={(e) => setPersonal({ ...personal, last_name: e.target.value })}
                    placeholder="Last name"
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="email">
                    Email <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    className={styles.input}
                    value={personal.email}
                    onChange={(e) => setPersonal({ ...personal, email: e.target.value })}
                    placeholder="you@example.com"
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="phone">
                    Phone <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    className={styles.input}
                    value={personal.phone}
                    onChange={(e) => setPersonal({ ...personal, phone: e.target.value })}
                    placeholder="(555) 555-5555"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Tax Situation Details */}
          {step === 1 && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Tax Situation Details</h2>
              <p className={styles.cardDesc}>
                Help us understand your tax situation so we can configure monitoring correctly.
              </p>

              <div className={styles.fieldStack}>
                <div className={styles.field}>
                  <label className={styles.label}>
                    Filing Status <span className={styles.required}>*</span>
                  </label>
                  <div className={styles.radioGroup}>
                    {FILING_STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        className={`${styles.radioBtn} ${taxDetails.filing_status === opt ? styles.radioBtnActive : ''}`}
                        onClick={() => setTaxDetails({ ...taxDetails, filing_status: opt })}
                      >
                        <span className={styles.radioDot}>
                          {taxDetails.filing_status === opt && <span className={styles.radioDotFill} />}
                        </span>
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Tax Years Affected</label>
                  <div className={styles.chipGroup}>
                    {TAX_YEARS.map((year) => (
                      <button
                        key={year}
                        type="button"
                        className={`${styles.chip} ${taxDetails.tax_years.includes(year) ? styles.chipActive : ''}`}
                        onClick={() => toggleTaxYear(year)}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="irs_contact">
                    IRS Contact History
                  </label>
                  <textarea
                    id="irs_contact"
                    className={styles.textarea}
                    value={taxDetails.irs_contact_history}
                    onChange={(e) =>
                      setTaxDetails({ ...taxDetails, irs_contact_history: e.target.value })
                    }
                    placeholder="Describe any recent IRS correspondence, calls, or notices..."
                    rows={4}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="notes">
                    Additional Notes
                  </label>
                  <textarea
                    id="notes"
                    className={styles.textarea}
                    value={taxDetails.additional_notes}
                    onChange={(e) =>
                      setTaxDetails({ ...taxDetails, additional_notes: e.target.value })
                    }
                    placeholder="Anything else we should know..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review & Confirm */}
          {step === 2 && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Review &amp; Confirm</h2>
              <p className={styles.cardDesc}>
                Please review the information below before proceeding.
              </p>

              <div className={styles.reviewSection}>
                <h3 className={styles.reviewHeading}>Personal Information</h3>
                <div className={styles.reviewGrid}>
                  <div className={styles.reviewItem}>
                    <span className={styles.reviewLabel}>Name</span>
                    <span className={styles.reviewValue}>
                      {personal.first_name} {personal.last_name}
                    </span>
                  </div>
                  <div className={styles.reviewItem}>
                    <span className={styles.reviewLabel}>Email</span>
                    <span className={styles.reviewValue}>{personal.email}</span>
                  </div>
                  <div className={styles.reviewItem}>
                    <span className={styles.reviewLabel}>Phone</span>
                    <span className={styles.reviewValue}>{personal.phone}</span>
                  </div>
                </div>
              </div>

              <div className={styles.reviewDivider} />

              <div className={styles.reviewSection}>
                <h3 className={styles.reviewHeading}>Tax Situation</h3>
                <div className={styles.reviewGrid}>
                  <div className={styles.reviewItem}>
                    <span className={styles.reviewLabel}>Filing Status</span>
                    <span className={styles.reviewValue}>
                      {taxDetails.filing_status || 'Not specified'}
                    </span>
                  </div>
                  <div className={styles.reviewItem}>
                    <span className={styles.reviewLabel}>Tax Years</span>
                    <span className={styles.reviewValue}>
                      {taxDetails.tax_years.length > 0
                        ? taxDetails.tax_years.join(', ')
                        : 'None selected'}
                    </span>
                  </div>
                  {taxDetails.irs_contact_history && (
                    <div className={styles.reviewItemFull}>
                      <span className={styles.reviewLabel}>IRS Contact History</span>
                      <span className={styles.reviewValue}>{taxDetails.irs_contact_history}</span>
                    </div>
                  )}
                  {taxDetails.additional_notes && (
                    <div className={styles.reviewItemFull}>
                      <span className={styles.reviewLabel}>Additional Notes</span>
                      <span className={styles.reviewValue}>{taxDetails.additional_notes}</span>
                    </div>
                  )}
                </div>
              </div>

              {inquiryData && (
                <>
                  <div className={styles.reviewDivider} />
                  <div className={styles.reviewSection}>
                    <h3 className={styles.reviewHeading}>From Inquiry</h3>
                    <div className={styles.reviewGrid}>
                      {inquiryData.urgency ? (
                        <div className={styles.reviewItem}>
                          <span className={styles.reviewLabel}>Urgency</span>
                          <span className={styles.reviewValue}>{String(inquiryData.urgency)}</span>
                        </div>
                      ) : null}
                      {inquiryData.primary_concern ? (
                        <div className={styles.reviewItem}>
                          <span className={styles.reviewLabel}>Primary Concern</span>
                          <span className={styles.reviewValue}>
                            {String(inquiryData.primary_concern)}
                          </span>
                        </div>
                      ) : null}
                      {inquiryData.balance_due ? (
                        <div className={styles.reviewItem}>
                          <span className={styles.reviewLabel}>Estimated Balance</span>
                          <span className={styles.reviewValue}>
                            {String(inquiryData.balance_due)}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className={styles.navRow}>
            <button
              type="button"
              className={styles.navBtnSecondary}
              onClick={handleBack}
              disabled={step === 0}
            >
              Back
            </button>
            {step < totalSteps - 1 ? (
              <button
                type="button"
                className={styles.navBtnPrimary}
                onClick={handleNext}
                disabled={!canAdvanceStep()}
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                className={styles.navBtnPrimary}
                onClick={handleSubmit}
              >
                Submit &amp; Continue
              </button>
            )}
          </div>
        </div>

        <div className={styles.disclaimer}>
          <p>
            Tax Monitor Pro provides IRS transcript monitoring services only. This does not
            constitute IRS representation, tax advice, tax preparation, or resolution services.
          </p>
        </div>
      </main>
    </>
  )
}
