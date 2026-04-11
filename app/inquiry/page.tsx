'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import { api } from '@/lib/api'
import styles from './page.module.css'

type Step =
  | 'choose'
  | 'state'
  | 'service'
  | 'entity'
  | 'language'
  | 'matches'
  | 'membership'
  | 'questionnaire'

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
  'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
  'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
  'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
  'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
  'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
  'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
  'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
  'West Virginia', 'Wisconsin', 'Wyoming',
]

const SERVICES = [
  'Appeals',
  'Audit Defense',
  'Business Tax Advisory',
  'Compliance',
  'Consulting',
  'Estate & Trust Tax',
  'Expert Witness',
  'Foreign Reporting (FBAR/FATCA)',
  'IRS Collections Defense',
  'Offer in Compromise',
  'Payroll Tax Defense',
  'Penalty Abatement',
  'Tax Litigation',
  'Tax Monitoring',
  'Tax Planning',
  'Tax Preparation',
  'Tax Resolution',
  'Trust Fund Recovery Defense',
]

const ENTITY_TYPES = [
  'Individuals',
  'Businesses',
  'LLCs',
  'S Corporations',
  'C Corporations',
  'Partnerships',
  'Nonprofits',
  'Executives',
]

const LANGUAGES = [
  'Arabic', 'Chinese', 'English', 'French', 'German', 'Hindi',
  'Japanese', 'Korean', 'Portuguese', 'Russian', 'Spanish',
  'Tagalog', 'Vietnamese',
]

interface MatchedProfile {
  slug: string
  name: string
  initials: string
  firm_name: string | null
  credentials: string[]
  credential_badges: Array<{ label: string; style_key: string }>
  location_label: string
  city: string | null
  state: string | null
  rating_label: string | null
  services: string[]
  languages: string[]
  match_score?: number
}

interface QuestionnaireAnswers {
  owesIrs?: 'yes' | 'no'
  needsHandler?: 'yes' | 'no' | 'not_sure'
  hasNotice?: 'yes' | 'no'
}

function InquiryFlow() {
  const [step, setStep] = useState<Step>('choose')
  const [history, setHistory] = useState<Step[]>([])

  // matching flow state
  const [selectedState, setSelectedState] = useState('')
  const [selectedService, setSelectedService] = useState('')
  const [selectedEntity, setSelectedEntity] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('')

  // matches state
  const [matches, setMatches] = useState<MatchedProfile[]>([])
  const [matchesLoading, setMatchesLoading] = useState(false)
  const [matchesError, setMatchesError] = useState('')

  // contact form state
  const [contactOpenFor, setContactOpenFor] = useState<string | null>(null)
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactMessage, setContactMessage] = useState('')
  const [contactSubmitting, setContactSubmitting] = useState(false)
  const [contactError, setContactError] = useState('')
  const [contactSuccess, setContactSuccess] = useState<string | null>(null)

  // questionnaire state
  const [qa, setQa] = useState<QuestionnaireAnswers>({})

  function goTo(next: Step) {
    setHistory((h) => [...h, step])
    setStep(next)
  }

  function goBack() {
    setHistory((h) => {
      if (h.length === 0) return h
      const prev = h[h.length - 1]
      setStep(prev)
      return h.slice(0, -1)
    })
  }

  async function fetchMatches() {
    setMatchesLoading(true)
    setMatchesError('')
    try {
      const res = await api.searchProfiles({
        state: selectedState,
        service: selectedService,
        client_type: selectedEntity,
        language: selectedLanguage || undefined,
        match: true,
        limit: 3,
      })
      setMatches(res.profiles || [])
    } catch {
      setMatches([])
      setMatchesError('We couldn\u2019t reach the matching service.')
    } finally {
      setMatchesLoading(false)
    }
  }

  function handleFindMatches() {
    goTo('matches')
    void fetchMatches()
  }

  async function submitContact(professionalSlug: string) {
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) {
      setContactError('Please fill out all fields.')
      return
    }
    setContactSubmitting(true)
    setContactError('')
    try {
      await api.createInquiry({
        professional_id: professionalSlug,
        name: contactName.trim(),
        email: contactEmail.trim(),
        subject: `Inquiry for ${professionalSlug}`,
        message: contactMessage.trim(),
        source_page: '/inquiry',
      })
      setContactSuccess(professionalSlug)
      setContactOpenFor(null)
      setContactName('')
      setContactEmail('')
      setContactMessage('')
    } catch {
      setContactError('Failed to send inquiry. Please try again.')
    } finally {
      setContactSubmitting(false)
    }
  }

  const STEP_ORDER: Record<Step, { label: string; index: number; total: number } | null> = {
    choose: { label: 'Choose Path', index: 1, total: 5 },
    state: { label: 'State', index: 2, total: 5 },
    service: { label: 'Service', index: 3, total: 5 },
    entity: { label: 'Entity', index: 4, total: 5 },
    language: { label: 'Language', index: 5, total: 5 },
    matches: { label: 'Matches', index: 5, total: 5 },
    membership: { label: 'Membership', index: 2, total: 2 },
    questionnaire: { label: 'Questions', index: 2, total: 2 },
  }

  const meta = STEP_ORDER[step]

  const getQuestionnaireRecommendation = () => {
    if (qa.owesIrs === 'yes' && qa.needsHandler === 'yes') {
      return {
        title: 'Find a Tax Professional or Start Plan II Monitoring',
        body:
          'You owe the IRS and want someone to handle it. We recommend connecting with a tax professional who can represent you, or starting a Plan II full-service monitoring engagement.',
        primary: { label: 'Find a Professional', action: () => goTo('state') },
        secondary: { label: 'See Plan II', href: '/pricing' },
      }
    }
    if (qa.owesIrs === 'yes' && (qa.needsHandler === 'no' || qa.needsHandler === 'not_sure')) {
      return {
        title: 'Start With a DIY Transcript Tool or Plan I',
        body:
          'If you want to stay hands-on, try our transcript parser (TTMP) or a TMP Plan I monthly membership for professional messaging support.',
        primary: { label: 'Try Transcript Tool', href: 'https://transcript.taxmonitor.pro/pricing' },
        secondary: { label: 'See Plan I', href: '/pricing' },
      }
    }
    if (qa.owesIrs === 'no') {
      return {
        title: 'Explore Our Free Tools',
        body:
          'If you don\u2019t owe the IRS, start with our free tools to stay ahead. Look up IRS codes and plan your payments before any issues arise.',
        primary: { label: 'Free Tax Tools', href: 'https://taxtools.taxmonitor.pro' },
        secondary: { label: 'Browse Directory', href: '/directory' },
      }
    }
    return null
  }

  const recommendation = step === 'questionnaire' ? getQuestionnaireRecommendation() : null

  return (
    <>
      <section className={styles.hero}>
        <h1 className={styles.heading}>
          How Can We <span className={styles.accent}>Help?</span>
        </h1>
        <p className={styles.subtitle}>
          A few quick questions will get you to the right place.
        </p>
      </section>

      {meta && (
        <div className={styles.progressBarWrap}>
          <div className={styles.progressTrack}>
            <div
              className={styles.progressFill}
              style={{ width: `${(meta.index / meta.total) * 100}%` }}
            />
          </div>
          <span className={styles.progressLabel}>
            Step {meta.index} of {meta.total} &middot; {meta.label}
          </span>
        </div>
      )}

      <div className={styles.stage}>
        {/* STEP 0 — Choose path */}
        {step === 'choose' && (
          <div className={styles.pathGrid}>
            <button
              type="button"
              className={styles.pathCard}
              onClick={() => goTo('state')}
            >
              <div className={styles.pathIcon} aria-hidden>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
                </svg>
              </div>
              <h3 className={styles.pathTitle}>Find a Tax Professional</h3>
              <p className={styles.pathDesc}>
                Get matched with tax monitors and other tax pros who specialize in your situation.
              </p>
              <span className={styles.pathCta}>Get Matched &rarr;</span>
            </button>

            <button
              type="button"
              className={styles.pathCard}
              onClick={() => goTo('membership')}
            >
              <div className={styles.pathIcon} aria-hidden>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                  <path d="M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" />
                </svg>
              </div>
              <h3 className={styles.pathTitle}>Start a Membership</h3>
              <p className={styles.pathDesc}>
                Access tax monitoring tools, professional guidance, and IRS compliance services.
              </p>
              <span className={styles.pathCta}>See Options &rarr;</span>
            </button>

            <button
              type="button"
              className={styles.pathCard}
              onClick={() => goTo('questionnaire')}
            >
              <div className={styles.pathIcon} aria-hidden>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12" y2="17" />
                </svg>
              </div>
              <h3 className={styles.pathTitle}>Not Sure Where to Start</h3>
              <p className={styles.pathDesc}>
                Answer a few questions and we&apos;ll help you decide.
              </p>
              <span className={styles.pathCta}>Answer Questions &rarr;</span>
            </button>
          </div>
        )}

        {/* STEP 1 — State */}
        {step === 'state' && (
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Select Your State</h2>
            <p className={styles.cardDesc}>
              We&apos;ll use this to match you with professionals licensed in your area.
            </p>
            <label className={styles.fieldLabel} htmlFor="stateSelect">
              State
            </label>
            <select
              id="stateSelect"
              className={styles.select}
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
            >
              <option value="">Choose a state...</option>
              {US_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <div className={styles.navRow}>
              <button type="button" className={styles.btnSecondary} onClick={goBack}>
                Back
              </button>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={() => goTo('service')}
                disabled={!selectedState}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 — Service */}
        {step === 'service' && (
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>What Do You Need Help With?</h2>
            <p className={styles.cardDesc}>
              Select the primary service you&apos;re looking for.
            </p>
            <div className={styles.chipGrid}>
              {SERVICES.map((svc) => (
                <button
                  key={svc}
                  type="button"
                  className={`${styles.chip} ${selectedService === svc ? styles.chipActive : ''}`}
                  onClick={() => setSelectedService(svc)}
                >
                  {svc}
                </button>
              ))}
            </div>
            <div className={styles.navRow}>
              <button type="button" className={styles.btnSecondary} onClick={goBack}>
                Back
              </button>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={() => goTo('entity')}
                disabled={!selectedService}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — Entity */}
        {step === 'entity' && (
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>What Type of Entity?</h2>
            <p className={styles.cardDesc}>
              Help us match you with pros who work with your type of taxpayer.
            </p>
            <div className={styles.entityGrid}>
              {ENTITY_TYPES.map((ent) => (
                <button
                  key={ent}
                  type="button"
                  className={`${styles.entityCard} ${selectedEntity === ent ? styles.entityCardActive : ''}`}
                  onClick={() => setSelectedEntity(ent)}
                >
                  {ent}
                </button>
              ))}
            </div>
            <div className={styles.navRow}>
              <button type="button" className={styles.btnSecondary} onClick={goBack}>
                Back
              </button>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={() => goTo('language')}
                disabled={!selectedEntity}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* STEP 4 — Language */}
        {step === 'language' && (
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Language Preference</h2>
            <p className={styles.cardDesc}>
              Optional. Select a preferred language, or continue with no preference.
            </p>
            <label className={styles.fieldLabel} htmlFor="languageSelect">
              Preferred Language
            </label>
            <select
              id="languageSelect"
              className={styles.select}
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
            >
              <option value="">No preference</option>
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
            <div className={styles.navRow}>
              <button type="button" className={styles.btnSecondary} onClick={goBack}>
                Back
              </button>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={handleFindMatches}
              >
                Find My Matches
              </button>
            </div>
          </div>
        )}

        {/* STEP 5 — Matches */}
        {step === 'matches' && (
          <div className={styles.matchesWrap}>
            <h2 className={styles.matchesTitle}>Your Matches</h2>
            <p className={styles.cardDesc}>
              {selectedService} &middot; {selectedEntity} &middot; {selectedState}
              {selectedLanguage ? ` \u00b7 ${selectedLanguage}` : ''}
            </p>

            {matchesLoading && (
              <div className={styles.matchesList}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className={styles.skeletonCard}>
                    <div className={styles.skeletonAvatar} />
                    <div className={styles.skeletonLines}>
                      <div className={styles.skeletonLine} />
                      <div className={styles.skeletonLineShort} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!matchesLoading && matches.length > 0 && (
              <div className={styles.matchesList}>
                {matches.map((pro) => (
                  <div key={pro.slug} className={styles.proCard}>
                    <div className={styles.proHeader}>
                      <div className={styles.proAvatar}>{pro.initials || pro.name.slice(0, 2)}</div>
                      <div className={styles.proMeta}>
                        <h3 className={styles.proName}>{pro.name}</h3>
                        {pro.firm_name && (
                          <p className={styles.proFirm}>{pro.firm_name}</p>
                        )}
                        <p className={styles.proLocation}>{pro.location_label}</p>
                      </div>
                    </div>

                    {pro.credential_badges && pro.credential_badges.length > 0 && (
                      <div className={styles.proBadges}>
                        {pro.credential_badges.map((b) => (
                          <span key={b.label} className={`${styles.proBadge} ${styles[`badge_${b.style_key}`] || ''}`}>
                            {b.label}
                          </span>
                        ))}
                      </div>
                    )}

                    {pro.services && pro.services.length > 0 && (
                      <p className={styles.proServices}>
                        {pro.services.slice(0, 4).join(' \u2022 ')}
                      </p>
                    )}

                    {pro.rating_label && (
                      <p className={styles.proRating}>{pro.rating_label}</p>
                    )}

                    <div className={styles.proActions}>
                      <Link
                        href={`/directory/profile?id=${pro.slug}`}
                        className={styles.btnSecondarySmall}
                      >
                        View Profile
                      </Link>
                      <button
                        type="button"
                        className={styles.btnPrimarySmall}
                        onClick={() => {
                          setContactOpenFor(pro.slug)
                          setContactError('')
                        }}
                      >
                        Contact
                      </button>
                    </div>

                    {contactSuccess === pro.slug && (
                      <div className={styles.contactSuccess}>
                        Message sent. The professional will reach out to you soon.
                      </div>
                    )}

                    {contactOpenFor === pro.slug && (
                      <div className={styles.contactForm}>
                        <label className={styles.fieldLabel} htmlFor={`name_${pro.slug}`}>
                          Your Name
                        </label>
                        <input
                          id={`name_${pro.slug}`}
                          type="text"
                          className={styles.input}
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                        />

                        <label className={styles.fieldLabel} htmlFor={`email_${pro.slug}`}>
                          Email
                        </label>
                        <input
                          id={`email_${pro.slug}`}
                          type="email"
                          className={styles.input}
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                        />

                        <label className={styles.fieldLabel} htmlFor={`msg_${pro.slug}`}>
                          Brief description of your situation
                        </label>
                        <textarea
                          id={`msg_${pro.slug}`}
                          className={styles.textarea}
                          rows={4}
                          value={contactMessage}
                          onChange={(e) => setContactMessage(e.target.value)}
                        />

                        {contactError && <p className={styles.errorText}>{contactError}</p>}

                        <div className={styles.navRow}>
                          <button
                            type="button"
                            className={styles.btnSecondarySmall}
                            onClick={() => setContactOpenFor(null)}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className={styles.btnPrimarySmall}
                            onClick={() => submitContact(pro.slug)}
                            disabled={contactSubmitting}
                          >
                            {contactSubmitting ? 'Sending...' : 'Send Inquiry'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!matchesLoading && matches.length === 0 && (
              <div className={styles.noMatches}>
                <h3 className={styles.noMatchesTitle}>
                  We couldn&apos;t find a match in our directory, but we can help.
                </h3>
                <p className={styles.cardDesc}>
                  {matchesError || 'Our team can connect you with a qualified professional directly.'}
                </p>
                <Link href="/contact" className={styles.btnPrimary}>
                  Contact Tax Monitor Pro
                </Link>
              </div>
            )}

            <div className={styles.navRow}>
              <button type="button" className={styles.btnSecondary} onClick={goBack}>
                Back
              </button>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => {
                  setHistory([])
                  setStep('choose')
                }}
              >
                Start Over
              </button>
            </div>
          </div>
        )}

        {/* STEP M — Membership */}
        {step === 'membership' && (
          <div className={styles.membershipWrap}>
            <h2 className={styles.cardTitle}>Choose Your Membership</h2>
            <p className={styles.cardDesc}>
              Pick the service that fits how hands-on you want to be.
            </p>
            <div className={styles.membershipGrid}>
              <Link href="/pricing" className={styles.membershipCard}>
                <h3 className={styles.membershipName}>TMP Plan I</h3>
                <p className={styles.membershipTag}>Monthly Memberships</p>
                <p className={styles.membershipDesc}>
                  DIY with professional messaging support when you need it.
                </p>
                <span className={styles.pathCta}>See Plans &rarr;</span>
              </Link>

              <Link href="/pricing" className={styles.membershipCard}>
                <h3 className={styles.membershipName}>TMP Plan II</h3>
                <p className={styles.membershipTag}>Monitoring Services</p>
                <p className={styles.membershipDesc}>
                  Full-service tax monitoring managed by a dedicated professional.
                </p>
                <span className={styles.pathCta}>See Plans &rarr;</span>
              </Link>

              <a
                href="https://transcript.taxmonitor.pro/pricing"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.membershipCard}
              >
                <h3 className={styles.membershipName}>TTMP</h3>
                <p className={styles.membershipTag}>Transcript Tools</p>
                <p className={styles.membershipDesc}>
                  Parse your own IRS transcripts and export clean reports.
                </p>
                <span className={styles.pathCta}>Visit TTMP &rarr;</span>
              </a>

              <a
                href="https://taxtools.taxmonitor.pro"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.membershipCard}
              >
                <h3 className={styles.membershipName}>TTTMP</h3>
                <p className={styles.membershipTag}>Learn Through Play</p>
                <p className={styles.membershipDesc}>
                  Learn taxes through gameplay and interactive tools.
                </p>
                <span className={styles.pathCta}>Visit TTTMP &rarr;</span>
              </a>
            </div>
            <div className={styles.navRow}>
              <button type="button" className={styles.btnSecondary} onClick={goBack}>
                Back
              </button>
            </div>
          </div>
        )}

        {/* STEP Q — Questionnaire */}
        {step === 'questionnaire' && (
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>A Few Quick Questions</h2>
            <p className={styles.cardDesc}>
              Answer these and we&apos;ll recommend the best path.
            </p>

            <div className={styles.qBlock}>
              <p className={styles.qLabel}>Do you owe the IRS or have a tax issue?</p>
              <div className={styles.qOptions}>
                {(['yes', 'no'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    className={`${styles.qBtn} ${qa.owesIrs === v ? styles.qBtnActive : ''}`}
                    onClick={() => setQa((a) => ({ ...a, owesIrs: v }))}
                  >
                    {v === 'yes' ? 'Yes' : 'No'}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.qBlock}>
              <p className={styles.qLabel}>Do you need someone to handle it for you?</p>
              <div className={styles.qOptions}>
                {(['yes', 'no', 'not_sure'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    className={`${styles.qBtn} ${qa.needsHandler === v ? styles.qBtnActive : ''}`}
                    onClick={() => setQa((a) => ({ ...a, needsHandler: v }))}
                  >
                    {v === 'yes' ? 'Yes' : v === 'no' ? 'No' : 'Not sure'}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.qBlock}>
              <p className={styles.qLabel}>Have you received an IRS notice?</p>
              <div className={styles.qOptions}>
                {(['yes', 'no'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    className={`${styles.qBtn} ${qa.hasNotice === v ? styles.qBtnActive : ''}`}
                    onClick={() => setQa((a) => ({ ...a, hasNotice: v }))}
                  >
                    {v === 'yes' ? 'Yes' : 'No'}
                  </button>
                ))}
              </div>
            </div>

            {recommendation && (
              <div className={styles.recommendation}>
                <h3 className={styles.recTitle}>{recommendation.title}</h3>
                <p className={styles.recBody}>{recommendation.body}</p>
                <div className={styles.recActions}>
                  {'action' in recommendation.primary ? (
                    <button
                      type="button"
                      className={styles.btnPrimary}
                      onClick={recommendation.primary.action}
                    >
                      {recommendation.primary.label}
                    </button>
                  ) : (
                    <a
                      href={recommendation.primary.href}
                      className={styles.btnPrimary}
                      target={recommendation.primary.href.startsWith('http') ? '_blank' : undefined}
                      rel={recommendation.primary.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    >
                      {recommendation.primary.label}
                    </a>
                  )}
                  {recommendation.secondary && (
                    <a
                      href={recommendation.secondary.href}
                      className={styles.btnSecondary}
                      target={recommendation.secondary.href.startsWith('http') ? '_blank' : undefined}
                      rel={recommendation.secondary.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    >
                      {recommendation.secondary.label}
                    </a>
                  )}
                </div>
              </div>
            )}

            <div className={styles.navRow}>
              <button type="button" className={styles.btnSecondary} onClick={goBack}>
                Back
              </button>
            </div>
          </div>
        )}
      </div>

      <div className={styles.disclaimer}>
        <p>
          Tax Monitor Pro provides a directory and tax monitoring services only.
          Matches are informational. Representation, filing, and resolution are
          separate engagements arranged directly with the professional you choose.
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
        <Suspense fallback={null}>
          <InquiryFlow />
        </Suspense>
      </main>
    </>
  )
}
