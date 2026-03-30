'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import StepProgress from '@/components/StepProgress'
import styles from './page.module.css'

const STEPS = ['Inquiry', 'Intake', 'Offer', 'Agreement', 'Payment']

interface QuestionDef {
  id: string
  label: string
  type: 'text' | 'email' | 'radio' | 'checkbox' | 'date'
  required: boolean
  options?: string[]
  conditional?: { field: string; value: string }
}

const QUESTIONS: QuestionDef[] = [
  { id: 'first_name', label: 'What is your first name?', type: 'text', required: true },
  { id: 'last_name', label: 'What is your last name?', type: 'text', required: true },
  { id: 'email', label: 'What is your primary email?', type: 'email', required: true },
  { id: 'company', label: 'Company name (optional)', type: 'text', required: false },
  {
    id: 'urgency',
    label: 'How urgent is your tax situation?',
    type: 'radio',
    required: true,
    options: ['Low', 'Medium', 'High', 'Critical'],
  },
  {
    id: 'irs_notice',
    label: 'Have you received an IRS notice?',
    type: 'radio',
    required: true,
    options: ['No', 'Not Sure', 'Yes'],
  },
  {
    id: 'notice_type',
    label: 'What type of IRS notice?',
    type: 'radio',
    required: false,
    options: ['CP', 'LT', 'Letter', 'Other'],
    conditional: { field: 'irs_notice', value: 'Yes' },
  },
  {
    id: 'notice_date',
    label: 'What is the IRS notice date?',
    type: 'date',
    required: false,
    conditional: { field: 'irs_notice', value: 'Yes' },
  },
  {
    id: 'primary_concern',
    label: 'What is your primary concern?',
    type: 'radio',
    required: true,
    options: ['Balance Due', 'IRS Notices', 'Transcript Monitoring', 'Unfiled Returns'],
  },
  {
    id: 'unfiled_returns',
    label: 'Do you have unfiled returns?',
    type: 'radio',
    required: true,
    options: ['No', 'Not Sure', 'Yes'],
  },
  {
    id: 'balance_due',
    label: 'Estimated balance due?',
    type: 'radio',
    required: true,
    options: [
      '$0',
      '$1 - $5,000',
      '$5,000 - $10,000',
      '$10,000 - $25,000',
      '$25,000 - $50,000',
      '$50,000 - $100,000',
      '$100,000+',
      'Not Sure',
    ],
  },
  {
    id: 'monitoring_acknowledgment',
    label:
      'I understand this service is monitoring-only and does not constitute IRS representation, tax filing, or resolution services.',
    type: 'checkbox',
    required: true,
  },
]

function InquiryForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | boolean>>({})

  const professionalId = searchParams.get('professional_id')

  const visibleQuestions = QUESTIONS.filter((q) => {
    if (!q.conditional) return true
    return answers[q.conditional.field] === q.conditional.value
  })

  const totalVisible = visibleQuestions.length
  const safeIndex = Math.min(currentQ, totalVisible - 1)
  const question = visibleQuestions[safeIndex]
  const progress = ((safeIndex + 1) / totalVisible) * 100

  const currentAnswer = question ? answers[question.id] : undefined
  const canAdvance =
    question &&
    (!question.required ||
      (question.type === 'checkbox'
        ? currentAnswer === true
        : typeof currentAnswer === 'string' && currentAnswer.trim() !== ''))

  useEffect(() => {
    if (currentQ >= totalVisible && totalVisible > 0) {
      setCurrentQ(totalVisible - 1)
    }
  }, [currentQ, totalVisible])

  function handleNext() {
    if (safeIndex < totalVisible - 1) {
      setCurrentQ(safeIndex + 1)
    } else {
      const inquiryData: Record<string, unknown> = { ...answers }
      if (professionalId) {
        inquiryData.professional_id = professionalId
      }
      sessionStorage.setItem('inquiry_data', JSON.stringify(inquiryData))
      router.push('/intake')
    }
  }

  function handlePrev() {
    if (safeIndex > 0) setCurrentQ(safeIndex - 1)
  }

  function setValue(val: string | boolean) {
    setAnswers((prev) => ({ ...prev, [question.id]: val }))
  }

  return (
    <>
      <section className={styles.hero}>
        <h1 className={styles.heading}>
          Tax Monitoring <span className={styles.accent}>Inquiry</span>
        </h1>
        <p className={styles.subtitle}>
          Answer a few questions so we can route you to the right monitoring plan.
        </p>
      </section>

      <div className={styles.progressBarWrap}>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>
        <span className={styles.progressLabel}>
          Question {safeIndex + 1} of {totalVisible}
        </span>
      </div>

      {question && (
        <div className={styles.chatArea}>
          <div className={styles.bubble}>
            <p className={styles.bubbleLabel}>{question.label}</p>

            {question.type === 'text' && (
              <input
                type="text"
                className={styles.input}
                value={(currentAnswer as string) || ''}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Type your answer..."
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && canAdvance) handleNext()
                }}
              />
            )}

            {question.type === 'email' && (
              <input
                type="email"
                className={styles.input}
                value={(currentAnswer as string) || ''}
                onChange={(e) => setValue(e.target.value)}
                placeholder="you@example.com"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && canAdvance) handleNext()
                }}
              />
            )}

            {question.type === 'date' && (
              <input
                type="date"
                className={styles.input}
                value={(currentAnswer as string) || ''}
                onChange={(e) => setValue(e.target.value)}
                autoFocus
              />
            )}

            {question.type === 'radio' && question.options && (
              <div className={styles.radioGroup}>
                {question.options.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className={`${styles.radioBtn} ${currentAnswer === opt ? styles.radioBtnActive : ''}`}
                    onClick={() => setValue(opt)}
                  >
                    <span className={styles.radioDot}>
                      {currentAnswer === opt && <span className={styles.radioDotFill} />}
                    </span>
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {question.type === 'checkbox' && (
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={currentAnswer === true}
                  onChange={(e) => setValue(e.target.checked)}
                />
                <span className={styles.checkboxCustom}>
                  {currentAnswer === true && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </span>
                <span className={styles.checkboxText}>I acknowledge and agree</span>
              </label>
            )}
          </div>

          <div className={styles.navRow}>
            <button
              type="button"
              className={styles.navBtnSecondary}
              onClick={handlePrev}
              disabled={safeIndex === 0}
            >
              Previous
            </button>
            <button
              type="button"
              className={styles.navBtnPrimary}
              onClick={handleNext}
              disabled={!canAdvance}
            >
              {safeIndex === totalVisible - 1 ? 'Submit Inquiry' : 'Next'}
            </button>
          </div>
        </div>
      )}

      <div className={styles.disclaimer}>
        <p>
          Tax Monitor Pro provides IRS transcript monitoring services only. This does not
          constitute IRS representation, tax advice, tax preparation, or resolution services.
          Representation, filing, and resolution are separate engagements.
        </p>
      </div>
    </>
  )
}

export default function InquiryPage() {
  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className={styles.stepWrap}>
          <StepProgress steps={STEPS} current={0} />
        </div>
        <Suspense fallback={null}>
          <InquiryForm />
        </Suspense>
      </main>
      <Footer />
    </>
  )
}
