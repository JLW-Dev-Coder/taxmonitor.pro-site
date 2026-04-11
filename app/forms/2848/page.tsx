'use client'

/**
 * Client-facing Form 2848 eSign page.
 *
 * Taxpayers fill out and sign their Power of Attorney authorization
 * during the "eSign 2848" step in the Client Record workflow.
 *
 * Uses a query parameter (?caseId=<case_id>) because output: 'export'
 * doesn't support runtime dynamic routes.
 *
 * TODO: Determine auth flow for client-facing 2848 — may need magic link
 * or case-specific token instead of vlp_session cookie.
 */

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { api, ApiError } from '@/lib/api'
import styles from './page.module.css'

interface Representative {
  name: string
  caf_number: string
  ptin: string
  phone: string
  designation: string
  address: string
  initials: string
}

interface TaxMatter {
  description: string
  form_number: string
  years: string
}

interface Authorizations {
  access_records: boolean
  sign_consent_disclose: boolean
  sign_substitute_return: boolean
  sign_claim_refund: boolean
  receive_refund_checks: boolean
}

interface GenerateResponse {
  ok: boolean
  pdf_base64: string
  filename: string
}

// TODO: Replace placeholder with real pre-fill from the assigned pro's
// profile — likely via a /v1/tmp/cases/{caseId} endpoint that returns the
// representative block. Keeping a placeholder keeps the form reviewable
// until the Worker route is live.
const PLACEHOLDER_REP: Representative = {
  name: 'Maria Chen, EA',
  caf_number: '1234-56789R',
  ptin: 'P01234567',
  phone: '(415) 555-0142',
  designation: 'Enrolled Agent',
  address: '500 Market Street, Suite 1200, San Francisco, CA 94105',
  initials: 'MC',
}

const MATTER_TYPES = [
  'Income',
  'Employment',
  'Excise',
  'Estate',
  'Gift',
  'Civil Penalty',
  'Other',
] as const

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC',
]

function todayISO(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function formatDateHuman(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return iso
  }
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 10)
  if (digits.length < 4) return digits
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

function formatSsn(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 9)
  if (digits.length < 4) return digits
  if (digits.length < 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`
}

function formatEin(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 9)
  if (digits.length < 3) return digits
  return `${digits.slice(0, 2)}-${digits.slice(2)}`
}

function maskedTin(tin: string, tinType: 'ssn' | 'ein'): string {
  const digits = tin.replace(/\D/g, '')
  if (digits.length < 4) return tin
  const last4 = digits.slice(-4)
  return tinType === 'ssn' ? `•••-••-${last4}` : `••-•••${last4}`
}

function base64ToBlob(base64: string, mime = 'application/pdf'): Blob {
  const byteChars = atob(base64)
  const byteNumbers = new Array(byteChars.length)
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i)
  }
  return new Blob([new Uint8Array(byteNumbers)], { type: mime })
}

function Form2848({ caseId }: { caseId: string }) {
  // Section 1 — taxpayer
  const [fullName, setFullName] = useState('')
  const [tinType, setTinType] = useState<'ssn' | 'ein'>('ssn')
  const [tin, setTin] = useState('')
  const [tinRevealed, setTinRevealed] = useState(false)
  const [street, setStreet] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zip, setZip] = useState('')
  const [phone, setPhone] = useState('')

  // Section 2 — representative (pre-filled)
  const [rep, setRep] = useState<Representative>(PLACEHOLDER_REP)
  const [repLoading, setRepLoading] = useState(true)

  // Section 3 — tax matters
  const [matters, setMatters] = useState<TaxMatter[]>([
    { description: '', form_number: '', years: '' },
  ])

  // Section 4 — authorizations
  const [auths, setAuths] = useState<Authorizations>({
    access_records: true,
    sign_consent_disclose: true,
    sign_substitute_return: false,
    sign_claim_refund: false,
    receive_refund_checks: false,
  })

  // Section 5 — signature
  const [agreed, setAgreed] = useState(false)
  const [signature, setSignature] = useState('')
  const signatureDate = useMemo(() => todayISO(), [])

  // Submit state
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [authRequired, setAuthRequired] = useState(false)
  const [success, setSuccess] = useState<GenerateResponse | null>(null)

  // TODO: Replace with real case-data fetch once /v1/tmp/cases/{caseId}
  // is wired. For now, mount the placeholder so the form renders in isolation.
  useEffect(() => {
    let cancelled = false
    setRepLoading(true)
    const t = setTimeout(() => {
      if (cancelled) return
      setRep(PLACEHOLDER_REP)
      setRepLoading(false)
    }, 150)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [caseId])

  // Keep signature in sync with taxpayer name until user edits it.
  const [signatureTouched, setSignatureTouched] = useState(false)
  useEffect(() => {
    if (!signatureTouched) setSignature(fullName)
  }, [fullName, signatureTouched])

  const updateMatter = (i: number, patch: Partial<TaxMatter>) => {
    setMatters((prev) =>
      prev.map((m, idx) => (idx === i ? { ...m, ...patch } : m))
    )
  }

  const addMatter = () => {
    if (matters.length >= 4) return
    setMatters((prev) => [
      ...prev,
      { description: '', form_number: '', years: '' },
    ])
  }

  const removeMatter = (i: number) => {
    if (matters.length <= 1) return
    setMatters((prev) => prev.filter((_, idx) => idx !== i))
  }

  const toggleAuth = (key: keyof Authorizations) => {
    setAuths((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleTinChange = (value: string) => {
    setTin(tinType === 'ssn' ? formatSsn(value) : formatEin(value))
  }

  const handleTinTypeChange = (next: 'ssn' | 'ein') => {
    setTinType(next)
    setTin('')
  }

  const validate = (): string | null => {
    if (!fullName.trim()) return 'Please enter your full legal name.'
    const tinDigits = tin.replace(/\D/g, '')
    if (tinDigits.length !== 9) {
      return tinType === 'ssn'
        ? 'Please enter a valid 9-digit SSN.'
        : 'Please enter a valid 9-digit EIN.'
    }
    if (!street.trim() || !city.trim() || !state.trim() || !zip.trim()) {
      return 'Please complete your mailing address.'
    }
    if (phone.replace(/\D/g, '').length !== 10) {
      return 'Please enter a valid 10-digit phone number.'
    }
    const filledMatters = matters.filter(
      (m) => m.description.trim() || m.form_number.trim() || m.years.trim()
    )
    if (filledMatters.length === 0) {
      return 'Please describe at least one tax matter.'
    }
    for (const m of filledMatters) {
      if (!m.description.trim() || !m.form_number.trim() || !m.years.trim()) {
        return 'Each tax matter needs a description, form number, and years.'
      }
    }
    if (!agreed) {
      return 'You must agree to the authorization to continue.'
    }
    if (!signature.trim()) {
      return 'Please type your name to sign the form.'
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setAuthRequired(false)

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    const payload = {
      case_id: caseId,
      taxpayer: {
        full_legal_name: fullName.trim(),
        tin_type: tinType,
        tin: tin.replace(/\D/g, ''),
        mailing_address: {
          street: street.trim(),
          city: city.trim(),
          state,
          zip: zip.trim(),
        },
        phone: phone.replace(/\D/g, ''),
      },
      representative: {
        name: rep.name,
        caf_number: rep.caf_number,
        ptin: rep.ptin,
        phone: rep.phone,
        designation: rep.designation,
        address: rep.address,
      },
      tax_matters: matters
        .filter((m) => m.description.trim())
        .map((m) => ({
          description: m.description,
          form_number: m.form_number.trim(),
          years_or_periods: m.years.trim(),
        })),
      authorizations: auths,
      signature: {
        typed_name: signature.trim(),
        signed_date: signatureDate,
        agreed: true,
      },
    }

    setSubmitting(true)
    try {
      const res = await api.generate2848(payload)
      setSuccess(res)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setAuthRequired(true)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleDownload = () => {
    if (!success) return
    const blob = base64ToBlob(success.pdf_base64)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = success.filename || 'form-2848.pdf'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (success) {
    return (
      <div className={styles.page}>
        <div className={styles.successCard}>
          <div className={styles.successIcon} aria-hidden="true">
            ✓
          </div>
          <h1 className={styles.successTitle}>
            Your Form 2848 has been signed and submitted
          </h1>
          <p className={styles.successBody}>
            Your tax professional has been notified and will proceed with
            filing your authorization with the IRS.
          </p>
          <div className={styles.successActions}>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={handleDownload}
            >
              Download your signed Form 2848
            </button>
            <a className={styles.secondaryBtn} href="/report">
              Return to your compliance journey
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.brand}>Tax Monitor Pro</div>
        <h1 className={styles.title}>Power of Attorney — Form 2848</h1>
        <p className={styles.subtitle}>
          Authorize your tax professional to represent you before the IRS
        </p>
        <div className={styles.breadcrumb}>
          Your Compliance Journey <span aria-hidden="true">›</span> eSign 2848
        </div>
      </header>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {/* ── Section 1: Taxpayer ── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.sectionNumber}>1</span>
            Your Information
          </h2>
          <p className={styles.sectionHint}>
            The person granting authorization (the taxpayer).
          </p>

          <div className={styles.fieldGrid}>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label className={styles.label} htmlFor="full-name">
                Full legal name
              </label>
              <input
                id="full-name"
                className={styles.input}
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Q. Taxpayer"
                autoComplete="name"
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="tin">
                {tinType === 'ssn' ? 'SSN' : 'EIN'}
              </label>
              <div className={styles.tinTypeToggle}>
                <button
                  type="button"
                  className={`${styles.toggleBtn} ${
                    tinType === 'ssn' ? styles.toggleActive : ''
                  }`}
                  onClick={() => handleTinTypeChange('ssn')}
                >
                  SSN
                </button>
                <button
                  type="button"
                  className={`${styles.toggleBtn} ${
                    tinType === 'ein' ? styles.toggleActive : ''
                  }`}
                  onClick={() => handleTinTypeChange('ein')}
                >
                  EIN
                </button>
              </div>
              <div className={styles.tinRow}>
                <input
                  id="tin"
                  className={styles.input}
                  type="text"
                  value={tinRevealed ? tin : maskedTin(tin, tinType)}
                  onChange={(e) => handleTinChange(e.target.value)}
                  onFocus={() => setTinRevealed(true)}
                  onBlur={() => setTinRevealed(false)}
                  placeholder={tinType === 'ssn' ? '123-45-6789' : '12-3456789'}
                  inputMode="numeric"
                  required
                />
                <button
                  type="button"
                  className={styles.revealBtn}
                  onClick={() => setTinRevealed((v) => !v)}
                  aria-label={tinRevealed ? 'Hide' : 'Reveal'}
                >
                  {tinRevealed ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="phone">
                Daytime phone
              </label>
              <input
                id="phone"
                className={styles.input}
                type="tel"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                placeholder="(555) 123-4567"
                autoComplete="tel"
                required
              />
            </div>

            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label className={styles.label} htmlFor="street">
                Street address
              </label>
              <input
                id="street"
                className={styles.input}
                type="text"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="123 Main Street"
                autoComplete="street-address"
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="city">
                City
              </label>
              <input
                id="city"
                className={styles.input}
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                autoComplete="address-level2"
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="state">
                State
              </label>
              <select
                id="state"
                className={styles.input}
                value={state}
                onChange={(e) => setState(e.target.value)}
                required
              >
                <option value="">—</option>
                {US_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="zip">
                ZIP code
              </label>
              <input
                id="zip"
                className={styles.input}
                type="text"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                placeholder="94105"
                autoComplete="postal-code"
                maxLength={10}
                required
              />
            </div>
          </div>
        </section>

        {/* ── Section 2: Representative (read-only) ── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.sectionNumber}>2</span>
            Your Tax Professional
          </h2>
          <p className={styles.sectionHint}>
            These details come from your assigned professional and cannot be
            edited.
          </p>

          {repLoading ? (
            <div className={styles.loadingBox}>Loading representative…</div>
          ) : (
            <div className={styles.repCard}>
              <div className={styles.repHead}>
                <div className={styles.avatar} aria-hidden="true">
                  {rep.initials}
                </div>
                <div className={styles.repHeadText}>
                  <div className={styles.repName}>{rep.name}</div>
                  <div className={styles.repDesignation}>{rep.designation}</div>
                </div>
                <span className={styles.verifiedBadge}>Verified</span>
              </div>
              <div className={styles.repGrid}>
                <div className={styles.repField}>
                  <span className={styles.repLabel}>CAF number</span>
                  <span className={styles.repValue}>{rep.caf_number}</span>
                </div>
                <div className={styles.repField}>
                  <span className={styles.repLabel}>PTIN</span>
                  <span className={styles.repValue}>{rep.ptin}</span>
                </div>
                <div className={styles.repField}>
                  <span className={styles.repLabel}>Phone</span>
                  <span className={styles.repValue}>{rep.phone}</span>
                </div>
                <div className={`${styles.repField} ${styles.repFieldFull}`}>
                  <span className={styles.repLabel}>Address</span>
                  <span className={styles.repValue}>{rep.address}</span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ── Section 3: Tax Matters ── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.sectionNumber}>3</span>
            Tax Matters
          </h2>
          <p className={styles.sectionHint}>
            The tax types, forms, and periods this authorization covers
            (Line 3 of Form 2848).
          </p>

          <div className={styles.matterList}>
            {matters.map((m, i) => (
              <div key={i} className={styles.matterCard}>
                <div className={styles.matterHead}>
                  <span className={styles.matterLabel}>Matter {i + 1}</span>
                  {matters.length > 1 && (
                    <button
                      type="button"
                      className={styles.linkBtn}
                      onClick={() => removeMatter(i)}
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className={styles.matterGrid}>
                  <div className={styles.field}>
                    <label className={styles.label}>
                      Description of matter
                    </label>
                    <select
                      className={styles.input}
                      value={m.description}
                      onChange={(e) =>
                        updateMatter(i, { description: e.target.value })
                      }
                    >
                      <option value="">Select a type</option>
                      {MATTER_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Tax form number</label>
                    <input
                      className={styles.input}
                      type="text"
                      value={m.form_number}
                      onChange={(e) =>
                        updateMatter(i, { form_number: e.target.value })
                      }
                      placeholder="1040"
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>
                      Year(s) or period(s)
                    </label>
                    <input
                      className={styles.input}
                      type="text"
                      value={m.years}
                      onChange={(e) =>
                        updateMatter(i, { years: e.target.value })
                      }
                      placeholder="2020, 2021, 2022"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {matters.length < 4 && (
            <button
              type="button"
              className={styles.addMatterBtn}
              onClick={addMatter}
            >
              + Add another matter
            </button>
          )}
        </section>

        {/* ── Section 4: Authorizations ── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.sectionNumber}>4</span>
            Authorization Acts
          </h2>
          <p className={styles.sectionHint}>
            Select which actions your representative can take on your behalf
            (Line 5a of Form 2848).
          </p>

          <div className={styles.authList}>
            {[
              {
                key: 'access_records' as const,
                label: 'Access my IRS records',
                hint: 'Allows your representative to view your tax account information.',
              },
              {
                key: 'sign_consent_disclose' as const,
                label: 'Sign consent to disclose tax information',
                hint: 'Allows your representative to authorize third-party disclosure.',
              },
              {
                key: 'sign_substitute_return' as const,
                label: 'Sign a substitute return',
                hint: 'Allows your representative to file a return on your behalf.',
              },
              {
                key: 'sign_claim_refund' as const,
                label: 'Sign a claim for refund',
                hint: 'Allows your representative to request refunds.',
              },
              {
                key: 'receive_refund_checks' as const,
                label: 'Receive refund checks',
                hint: 'Allows your representative to receive your refund.',
              },
            ].map((item) => (
              <label key={item.key} className={styles.authItem}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={auths[item.key]}
                  onChange={() => toggleAuth(item.key)}
                />
                <div className={styles.authBody}>
                  <span className={styles.authLabel}>{item.label}</span>
                  <span className={styles.authHint}>{item.hint}</span>
                </div>
              </label>
            ))}
          </div>
        </section>

        {/* ── Section 5: Signature ── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.sectionNumber}>5</span>
            Electronic Signature
          </h2>

          <div className={styles.certBlock}>
            I hereby authorize the representative listed above to represent me
            before the Internal Revenue Service for the tax matters described.
            I understand this authorization will replace any prior Power of
            Attorney on file for the same tax matters and periods.
          </div>

          <label className={styles.agreeRow}>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              required
            />
            <span className={styles.agreeText}>
              I have read and agree to the above authorization
            </span>
          </label>

          <div className={styles.signatureGrid}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="signature">
                Signature (type your full legal name)
              </label>
              <input
                id="signature"
                className={`${styles.input} ${styles.signatureInput}`}
                type="text"
                value={signature}
                onChange={(e) => {
                  setSignatureTouched(true)
                  setSignature(e.target.value)
                }}
                placeholder="Jane Q. Taxpayer"
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Date</label>
              <input
                className={styles.input}
                type="text"
                value={formatDateHuman(signatureDate)}
                readOnly
              />
            </div>
          </div>
        </section>

        {/* ── Errors & submit ── */}
        {authRequired && (
          <div className={styles.authBanner}>
            Please <a href="/sign-in">sign in</a> to submit your signed Form
            2848. Your entries will be preserved.
          </div>
        )}
        {error && !authRequired && (
          <div className={styles.errorBanner}>{error}</div>
        )}

        <div className={styles.submitRow}>
          <button
            type="submit"
            className={styles.primaryBtn}
            disabled={submitting}
          >
            {submitting ? 'Submitting…' : 'Sign and Submit Form 2848'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Form2848PageInner() {
  const searchParams = useSearchParams()
  const caseId = searchParams.get('caseId') ?? ''

  if (!caseId) {
    return (
      <div className={styles.page}>
        <div className={styles.errorBox}>
          <h1 className={styles.title}>Missing case ID</h1>
          <p className={styles.muted}>
            A valid case ID is required to sign Form 2848.
          </p>
        </div>
      </div>
    )
  }

  return <Form2848 caseId={caseId} />
}

export default function Form2848Page() {
  return (
    <Suspense
      fallback={<div className={styles.loadingBox}>Loading…</div>}
    >
      <Form2848PageInner />
    </Suspense>
  )
}
