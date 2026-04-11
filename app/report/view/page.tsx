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
import { api, type ComplianceReportResponse } from '@/lib/api'
import styles from './page.module.css'

type Record = ComplianceReportResponse['record']

// TODO: Remove placeholder when Worker route is live
const PLACEHOLDER: Record = {
  order_id: 'ord_placeholder_0001',
  status: 'final',
  client_name: 'Jordan Rivera',
  report_date: '2026-04-08',
  prepared_at: '2026-04-08T15:30:00Z',
  account_overview: {
    filing_status: 'Single',
    tax_year: 2024,
    total_irs_balance: 12480.55,
    irs_account_status: 'limited',
  },
  return_status: {
    processing_status: 'Return processed',
    date_filed: '2025-04-12',
    tax_liability: 11240.00,
  },
  notices: [
    {
      notice_id: 'n1',
      type: 'CP14 — Balance Due',
      date: '2025-05-20',
      urgency: 'medium',
      details:
        'IRS notice of balance due for tax year 2024. Response required within 21 days of notice date to avoid additional penalties and interest.',
    },
    {
      notice_id: 'n2',
      type: 'CP501 — Reminder',
      date: '2025-06-24',
      urgency: 'low',
      details:
        'First reminder notice regarding outstanding balance. Review and respond or set up a payment arrangement.',
    },
  ],
  payment_plan: {
    ia_status: 'established',
    monthly_payment: 225.0,
    payment_schedule: '15th of each month',
    start_date: '2025-08-15',
  },
  summary: {
    compliance_client_summary:
      'Your 2024 return has been processed and is currently in Limited Compliance status due to an outstanding balance of $12,480.55. We have established an installment agreement of $225/month beginning August 15, 2025. Continue making on-time payments to avoid default. No immediate action is required on the CP14 notice — it is being tracked through the installment agreement.',
    report_prepared_date: '2026-04-08',
  },
  professional: {
    name: 'Maria Chen, EA',
    credential: 'Enrolled Agent',
    contact_consent: true,
    contact_url: '/messages',
  },
}

function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return '—'
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  })
}

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

function accountStatusLabel(status: Record['account_overview']['irs_account_status']): string {
  if (status === 'compliant') return 'Compliant'
  if (status === 'limited') return 'Limited'
  return 'Non-Compliant'
}

function accountStatusClass(
  status: Record['account_overview']['irs_account_status']
): string {
  if (status === 'compliant') return styles.statusCompliant
  if (status === 'limited') return styles.statusLimited
  return styles.statusNonCompliant
}

function urgencyClass(
  urgency: Record['notices'][number]['urgency']
): string {
  if (urgency === 'high') return styles.noticeHigh
  if (urgency === 'medium') return styles.noticeMedium
  return styles.noticeLow
}

function iaStatusLabel(status: Record['payment_plan']['ia_status']): string {
  if (status === 'established') return 'Established'
  if (status === 'pending') return 'Pending'
  if (status === 'defaulted') return 'Defaulted'
  return 'None'
}

function ReportView({ orderId }: { orderId: string }) {
  const [record, setRecord] = useState<Record | null>(null)
  const [loading, setLoading] = useState(true)
  const [usingPlaceholder, setUsingPlaceholder] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api
      .getComplianceReport(orderId)
      .then((res) => {
        if (cancelled) return
        setRecord(res.record)
        setUsingPlaceholder(false)
      })
      .catch(() => {
        if (cancelled) return
        // TODO: Remove placeholder when Worker route is live
        setRecord({ ...PLACEHOLDER, order_id: orderId })
        setUsingPlaceholder(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [orderId])

  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print()
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingBox}>Loading your report…</div>
      </div>
    )
  }

  if (!record) {
    return (
      <div className={styles.page}>
        <div className={styles.errorBox}>
          <h1 className={styles.title}>Report unavailable</h1>
          <p className={styles.muted}>
            We couldn&apos;t load this compliance report. Please try again or
            contact your tax professional.
          </p>
        </div>
      </div>
    )
  }

  const isFinal = record.status === 'final'

  return (
    <div className={styles.page}>
      {usingPlaceholder && (
        <div className={styles.devBanner} data-noprint>
          Preview mode — showing placeholder data until the Worker route ships.
        </div>
      )}

      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.headerMain}>
          <div className={styles.brand}>Tax Monitor Pro</div>
          <h1 className={styles.title}>Your Compliance Report</h1>
          <div className={styles.headerMeta}>
            <span className={styles.clientName}>{record.client_name}</span>
            <span className={styles.metaDivider}>•</span>
            <span>{formatDate(record.report_date)}</span>
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
            <span className={styles.fieldValue}>
              {record.account_overview.filing_status}
            </span>
          </div>
          <div className={styles.overviewField}>
            <span className={styles.fieldLabel}>Tax Year</span>
            <span className={styles.fieldValue}>
              {record.account_overview.tax_year}
            </span>
          </div>
          <div className={styles.balanceCard}>
            <span className={styles.fieldLabel}>Total IRS Balance</span>
            <span className={styles.balanceValue}>
              {formatCurrency(record.account_overview.total_irs_balance)}
            </span>
          </div>
          <div
            className={`${styles.statusCard} ${accountStatusClass(
              record.account_overview.irs_account_status
            )}`}
          >
            <span className={styles.fieldLabel}>IRS Account Status</span>
            <span className={styles.statusValue}>
              {accountStatusLabel(record.account_overview.irs_account_status)}
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
              {record.return_status.processing_status}
            </span>
          </div>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Date Filed</span>
            <span className={styles.fieldValue}>
              {formatDate(record.return_status.date_filed)}
            </span>
          </div>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Tax Liability</span>
            <span className={styles.fieldValue}>
              {formatCurrency(record.return_status.tax_liability)}
            </span>
          </div>
        </div>
      </section>

      {/* ── Section 3: Notices ── */}
      {record.notices.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Notices</h2>
          <ul className={styles.noticeList}>
            {record.notices.map((notice) => (
              <li
                key={notice.notice_id}
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
              {iaStatusLabel(record.payment_plan.ia_status)}
            </span>
          </div>
          {record.payment_plan.ia_status === 'established' && (
            <>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Monthly Payment</span>
                <span className={styles.fieldValue}>
                  {formatCurrency(record.payment_plan.monthly_payment)}
                </span>
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Schedule</span>
                <span className={styles.fieldValue}>
                  {record.payment_plan.payment_schedule ?? '—'}
                </span>
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Start Date</span>
                <span className={styles.fieldValue}>
                  {formatDate(record.payment_plan.start_date)}
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
          {record.summary.compliance_client_summary}
        </p>
        <p className={styles.preparedDate}>
          Report prepared {formatDate(record.summary.report_prepared_date)}
        </p>
      </section>

      {/* ── Section 6: Your Professional ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Your Professional</h2>
        <div className={styles.professionalCard}>
          <div>
            <div className={styles.proName}>{record.professional.name}</div>
            <div className={styles.proCredential}>
              {record.professional.credential}
            </div>
          </div>
          {record.professional.contact_consent &&
            record.professional.contact_url && (
              <a
                className={styles.proContactBtn}
                href={record.professional.contact_url}
                data-noprint
              >
                Contact your professional
              </a>
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
