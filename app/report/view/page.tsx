'use client'

/**
 * Client-facing compliance report page.
 *
 * Taxpayer-visible read-only view of a completed compliance record.
 * Reads the client-visible fields per tmp.compliance-record.read.v1.json
 * (contract lives in VLP repo).
 *
 * Uses a query parameter (?orderId=<order_id>) because output: 'export'
 * doesn't support dynamic routes with runtime-only params.
 */

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import AuthGuard from '@/components/AuthGuard'
import AppShell from '@/components/AppShell'
import {
  api,
  ApiError,
  type ComplianceReportResponse,
  type PublicProfileResponse,
} from '@/lib/api'
import styles from './page.module.css'

type Record = ComplianceReportResponse['record']
type ProfessionalInfo = {
  name: string
  credential: string
  contact_url: string | null
}

type LoadState =
  | { kind: 'loading' }
  | { kind: 'ready'; record: Record; professional: ProfessionalInfo | null }
  | { kind: 'not_ready' }
  | { kind: 'auth_required' }
  | { kind: 'error'; message: string }

function formatDate(value: string | null): string {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return value
  }
}

function accountStatusClass(status: Record['irs_account_status']): string {
  if (status === 'Compliant') return styles.statusCompliant
  if (status === 'Limited') return styles.statusLimited
  return styles.statusNonCompliant
}

function urgencyClass(
  urgency: Record['notices'][number]['urgency']
): string {
  if (urgency === 'high') return styles.noticeHigh
  if (urgency === 'medium') return styles.noticeMedium
  return styles.noticeLow
}

function extractProfessional(
  res: PublicProfileResponse
): ProfessionalInfo {
  const p = res.profile
  const credentials = p.professional.credentials ?? []
  const credential =
    credentials.length > 0
      ? credentials.join(', ')
      : (p.professional.profession ?? []).join(', ') || 'Tax Professional'
  const contactBtn = p.buttons?.contact_button
  const contactUrl =
    contactBtn && contactBtn.show && contactBtn.active ? contactBtn.url : null
  return {
    name: p.profile.name,
    credential,
    contact_url: contactUrl,
  }
}

function ReportView({ orderId }: { orderId: string }) {
  const [state, setState] = useState<LoadState>({ kind: 'loading' })

  useEffect(() => {
    let cancelled = false
    setState({ kind: 'loading' })

    const load = async () => {
      try {
        const res = await api.getComplianceReport(orderId)
        if (cancelled) return
        const record = res.record

        let professional: ProfessionalInfo | null = null
        if (record.servicing_professional_id) {
          try {
            const profileRes = await api.getProfile(
              record.servicing_professional_id
            )
            if (!cancelled) professional = extractProfessional(profileRes)
          } catch {
            // Fall back to generic label below
          }
        }

        if (!cancelled) setState({ kind: 'ready', record, professional })
      } catch (err) {
        if (cancelled) return
        if (err instanceof ApiError) {
          if (err.status === 404) {
            setState({ kind: 'not_ready' })
            return
          }
          if (err.status === 401) {
            setState({ kind: 'auth_required' })
            return
          }
          setState({ kind: 'error', message: err.message })
          return
        }
        setState({
          kind: 'error',
          message: 'Unable to load your compliance report.',
        })
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [orderId])

  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print()
  }

  if (state.kind === 'loading') {
    return (
      <div className={styles.page}>
        <div className={styles.loadingBox}>Loading your report…</div>
      </div>
    )
  }

  if (state.kind === 'not_ready') {
    return (
      <div className={styles.page}>
        <div className={styles.errorBox}>
          <h1 className={styles.title}>Report not ready</h1>
          <p className={styles.muted}>
            Your compliance report is being prepared. Check back soon.
          </p>
        </div>
      </div>
    )
  }

  if (state.kind === 'auth_required') {
    return (
      <div className={styles.page}>
        <div className={styles.errorBox}>
          <h1 className={styles.title}>Sign in required</h1>
          <p className={styles.muted}>
            Please sign in to view your compliance report.
          </p>
          <p>
            <a className={styles.proContactBtn} href="/sign-in" data-noprint>
              Sign in
            </a>
          </p>
        </div>
      </div>
    )
  }

  if (state.kind === 'error') {
    return (
      <div className={styles.page}>
        <div className={styles.errorBox}>
          <h1 className={styles.title}>Report unavailable</h1>
          <p className={styles.muted}>{state.message}</p>
        </div>
      </div>
    )
  }

  const { record, professional } = state
  const isFinal = record.compliance_record_status === 'Final'
  const iaEstablished = record.ia_established === 'Yes'

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.headerMain}>
          <div className={styles.brand}>Tax Monitor Pro</div>
          <h1 className={styles.title}>Your Compliance Report</h1>
          <div className={styles.headerMeta}>
            <span className={styles.clientName}>{record.client_name}</span>
            <span className={styles.metaDivider}>•</span>
            <span>{formatDate(record.compliance_prepared_date)}</span>
          </div>
        </div>
        <div className={styles.headerSide}>
          <span
            className={`${styles.statusBadge} ${
              isFinal ? styles.badgeFinal : styles.badgeDraft
            }`}
          >
            {isFinal ? 'Final' : 'Draft'}
          </span>
          <button
            type="button"
            className={styles.printBtn}
            onClick={handlePrint}
            data-noprint
          >
            Print
          </button>
        </div>
      </header>

      {/* ── Section 1: Account Overview ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Account Overview</h2>
        <div className={styles.overviewGrid}>
          <div className={styles.overviewField}>
            <span className={styles.fieldLabel}>Filing Status</span>
            <span className={styles.fieldValue}>{record.filing_status}</span>
          </div>
          <div className={styles.overviewField}>
            <span className={styles.fieldLabel}>Tax Year</span>
            <span className={styles.fieldValue}>
              {record.compliance_tax_year}
            </span>
          </div>
          <div className={styles.balanceCard}>
            <span className={styles.fieldLabel}>Total IRS Balance</span>
            <span className={styles.balanceValue}>
              {record.total_irs_balance}
            </span>
          </div>
          <div
            className={`${styles.statusCard} ${accountStatusClass(
              record.irs_account_status
            )}`}
          >
            <span className={styles.fieldLabel}>IRS Account Status</span>
            <span className={styles.statusValue}>
              {record.irs_account_status}
            </span>
          </div>
        </div>
      </section>

      {/* ── Section 2: Return Status ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Return Status</h2>
        <div className={styles.fieldGrid}>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Processing Status</span>
            <span className={styles.fieldValue}>
              {record.return_processing_status}
            </span>
          </div>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Date Filed</span>
            <span className={styles.fieldValue}>
              {formatDate(record.return_date_filed)}
            </span>
          </div>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Tax Liability</span>
            <span className={styles.fieldValue}>
              {record.return_tax_liability}
            </span>
          </div>
        </div>
      </section>

      {/* ── Section 3: Notices ── */}
      {record.notices.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Notices</h2>
          <ul className={styles.noticeList}>
            {record.notices.map((notice, idx) => (
              <li
                key={notice.notice_id ?? `notice-${idx}`}
                className={`${styles.noticeItem} ${urgencyClass(notice.urgency)}`}
              >
                <div className={styles.noticeHead}>
                  <span className={styles.noticeType}>{notice.type}</span>
                  <span className={styles.noticeDate}>
                    {formatDate(notice.date)}
                  </span>
                </div>
                <p className={styles.noticeDetails}>{notice.details}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Section 4: Payment Plan ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Payment Plan</h2>
        <div className={styles.fieldGrid}>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Installment Agreement</span>
            <span className={styles.fieldValue}>
              {iaEstablished ? 'Established' : 'None'}
            </span>
          </div>
          {iaEstablished && (
            <>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Monthly Payment</span>
                <span className={styles.fieldValue}>
                  {record.ia_payment_amount ?? '—'}
                </span>
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Next Payment Date</span>
                <span className={styles.fieldValue}>
                  {formatDate(record.ia_payment_date)}
                </span>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── Section 5: Summary & Next Steps ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Summary &amp; Next Steps</h2>
        <p className={styles.summaryBody}>
          {record.compliance_client_summary}
        </p>
        <p className={styles.preparedDate}>
          Report prepared {formatDate(record.compliance_prepared_date)}
        </p>
      </section>

      {/* ── Section 6: Your Professional ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Your Professional</h2>
        <div className={styles.professionalCard}>
          {professional ? (
            <>
              <div>
                <div className={styles.proName}>{professional.name}</div>
                <div className={styles.proCredential}>
                  {professional.credential}
                </div>
              </div>
              {professional.contact_url && (
                <a
                  className={styles.proContactBtn}
                  href={professional.contact_url}
                  data-noprint
                >
                  Contact your professional
                </a>
              )}
            </>
          ) : (
            <div>
              <div className={styles.proName}>
                Your assigned tax professional
              </div>
              <div className={styles.proCredential}>
                Contact details unavailable
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <p className={styles.disclaimer}>
          This report is prepared by your assigned tax professional through Tax
          Monitor Pro. It is for informational purposes and does not constitute
          tax advice. Consult with your tax professional for specific guidance.
        </p>
        <div className={styles.footerBrand} data-noprint>
          <span>Tax Monitor Pro</span>
          <span className={styles.metaDivider}>•</span>
          <a href="/legal/privacy">Privacy</a>
          <span className={styles.metaDivider}>•</span>
          <a href="/legal/terms">Terms</a>
        </div>
      </footer>
    </div>
  )
}

function ReportPageInner() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('orderId') ?? ''

  if (!orderId) {
    return (
      <div className={styles.page}>
        <div className={styles.errorBox}>
          <h1 className={styles.title}>Missing report ID</h1>
          <p className={styles.muted}>
            A valid order ID is required to view a compliance report.
          </p>
        </div>
      </div>
    )
  }

  return <ReportView orderId={orderId} />
}

export default function ClientReportPage() {
  return (
    <AuthGuard>
      {({ account }) => (
        <AppShell account={account}>
          <Suspense
            fallback={<div className={styles.loadingBox}>Loading…</div>}
          >
            <ReportPageInner />
          </Suspense>
        </AppShell>
      )}
    </AuthGuard>
  )
}
