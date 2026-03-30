'use client'

import { useEffect, useState, useCallback } from 'react'
import AuthGuard from '@/components/AuthGuard'
import AppShell from '@/components/AppShell'
import { api } from '@/lib/api'
import type { SessionUser } from '@/components/AuthGuard'
import styles from './page.module.css'

const TABS = [
  'Overview',
  'Authority',
  'Compliance',
  'Notices',
  'Installment Agreement',
  'Revenue Officer',
  'Transcripts',
  'Summary',
] as const

type TabName = (typeof TABS)[number]

const currentYear = new Date().getFullYear()
const TAX_YEARS = Array.from({ length: 4 }, (_, i) => currentYear - 3 + i)

type MfjView = 'primary' | 'spouse'

/* eslint-disable @typescript-eslint/no-explicit-any */
interface ComplianceData {
  [key: string]: any
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export default function ReportPage() {
  return (
    <AuthGuard>
      {({ account }) => (
        <AppShell account={account}>
          <ReportContent account={account} />
        </AppShell>
      )}
    </AuthGuard>
  )
}

/* ─── helpers ─── */

function val(v: unknown, fallback = 'N/A'): string {
  if (v === null || v === undefined || v === '') return fallback
  return String(v)
}

/* ─── main content ─── */

function ReportContent({ account }: { account: SessionUser }) {
  const [activeTab, setActiveTab] = useState<TabName>('Overview')
  const [taxYear, setTaxYear] = useState(currentYear)
  const [mfjView, setMfjView] = useState<MfjView>('primary')
  const [data, setData] = useState<ComplianceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pdfStatus, setPdfStatus] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.getComplianceStatus(account.account_id) as ComplianceData
      setData(res)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load compliance data')
    } finally {
      setLoading(false)
    }
  }, [account.account_id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleGeneratePdf = async () => {
    setPdfStatus('Report generation pending...')
    try {
      await api.generateReport(account.account_id, taxYear)
      setPdfStatus('Report generated successfully.')
    } catch {
      setPdfStatus('Report generation failed. Please try again.')
    }
  }

  /* ─── loading skeleton ─── */
  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.headerRow}>
          <div className={`${styles.skeleton} ${styles.skeletonSelect}`} />
          <div className={`${styles.skeleton} ${styles.skeletonToggle}`} />
        </div>
        <div className={styles.tabBar}>
          {TABS.map((t) => (
            <div key={t} className={`${styles.skeleton} ${styles.skeletonTab}`} />
          ))}
        </div>
        <div className={styles.twoCol}>
          <div className={`${styles.skeleton} ${styles.skeletonCard}`} />
          <div className={`${styles.skeleton} ${styles.skeletonCard}`} />
        </div>
      </div>
    )
  }

  /* ─── error state ─── */
  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.errorBox}>
          <p className={styles.errorText}>{error}</p>
          <button className={styles.btnPrimary} onClick={fetchData}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  const yearData = data?.years?.[taxYear] ?? data ?? {}

  return (
    <div className={styles.page}>
      {/* MFJ spouse banner */}
      {mfjView === 'spouse' && (
        <div className={styles.mfjBanner}>
          Viewing associated MFJ spouse records for tax year {taxYear}
        </div>
      )}

      {/* Header row */}
      <div className={styles.headerRow}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Compliance Dashboard</h1>
          <select
            className={styles.yearSelect}
            value={taxYear}
            onChange={(e) => setTaxYear(Number(e.target.value))}
          >
            {TAX_YEARS.map((y) => (
              <option key={y} value={y}>
                Tax Year {y}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.mfjToggle}>
            <button
              className={`${styles.mfjBtn} ${mfjView === 'primary' ? styles.mfjBtnActive : ''}`}
              onClick={() => setMfjView('primary')}
            >
              Primary
            </button>
            <button
              className={`${styles.mfjBtn} ${mfjView === 'spouse' ? styles.mfjBtnActive : ''}`}
              onClick={() => setMfjView('spouse')}
            >
              Spouse
            </button>
          </div>
          <button className={styles.btnPrimary} onClick={handleGeneratePdf}>
            Generate PDF
          </button>
        </div>
      </div>

      {pdfStatus && (
        <div className={styles.pdfStatus}>
          {pdfStatus}
        </div>
      )}

      {/* Tab navigation */}
      <div className={styles.tabBar}>
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className={styles.tabContent}>
        {activeTab === 'Overview' && <OverviewTab data={yearData} />}
        {activeTab === 'Authority' && <AuthorityTab data={yearData} />}
        {activeTab === 'Compliance' && <ComplianceTab data={yearData} taxYear={taxYear} />}
        {activeTab === 'Notices' && <NoticesTab data={yearData} />}
        {activeTab === 'Installment Agreement' && <InstallmentTab data={yearData} />}
        {activeTab === 'Revenue Officer' && <RevenueOfficerTab data={yearData} />}
        {activeTab === 'Transcripts' && <TranscriptsTab data={yearData} />}
        {activeTab === 'Summary' && <SummaryTab data={yearData} />}
      </div>
    </div>
  )
}

/* ─── Tab Components ─── */

function OverviewTab({ data }: { data: ComplianceData }) {
  const overview = data?.overview ?? data
  return (
    <div className={styles.twoCol}>
      <div className={styles.colMain}>
        <div className={styles.glassCard}>
          <h2 className={styles.cardTitle}>Summary</h2>
          <div className={styles.fieldGrid}>
            <Field label="Filing Status" value={overview?.filing_status} />
            <Field label="Account Balance" value={overview?.account_balance} />
            <Field label="Last Activity" value={overview?.last_activity} />
            <Field label="Return Filed" value={overview?.return_filed} />
            <Field label="Refund Status" value={overview?.refund_status} />
            <Field label="Adjusted Gross Income" value={overview?.agi} />
          </div>
        </div>
        <div className={styles.glassCard}>
          <h2 className={styles.cardTitle}>Key Metrics</h2>
          <div className={styles.metricsGrid}>
            <MetricCard label="Total Tax" value={overview?.total_tax} />
            <MetricCard label="Payments" value={overview?.payments} />
            <MetricCard label="Penalties" value={overview?.penalties} />
            <MetricCard label="Interest" value={overview?.interest} />
          </div>
        </div>
      </div>
      <div className={styles.colAside}>
        <div className={styles.glassCard}>
          <h2 className={styles.cardTitle}>Account Info</h2>
          <div className={styles.fieldList}>
            <Field label="Account ID" value={overview?.account_id} />
            <Field label="SSN (last 4)" value={overview?.ssn_last4} />
            <Field label="Plan" value={overview?.plan} />
            <Field label="Last Updated" value={overview?.last_updated} />
          </div>
        </div>
      </div>
    </div>
  )
}

function AuthorityTab({ data }: { data: ComplianceData }) {
  const auth = data?.authority ?? data
  return (
    <div className={styles.twoCol}>
      <div className={styles.colMain}>
        <div className={styles.glassCard}>
          <h2 className={styles.cardTitle}>IRS Authority Information</h2>
          <div className={styles.fieldList}>
            <Field label="Authority" value={auth?.authority_name ?? 'Internal Revenue Service'} />
            <Field label="District Office" value={auth?.district_office} />
            <Field label="Campus" value={auth?.campus} />
            <Field label="Area Code" value={auth?.area_code} />
            <Field label="Group Number" value={auth?.group_number} />
          </div>
        </div>
      </div>
      <div className={styles.colAside}>
        <div className={styles.glassCard}>
          <h2 className={styles.cardTitle}>Assigned Agent</h2>
          <div className={styles.fieldList}>
            <Field label="Name" value={auth?.agent_name} />
            <Field label="Badge ID" value={auth?.agent_badge_id} />
            <Field label="Phone" value={auth?.agent_phone} />
            <Field label="Fax" value={auth?.agent_fax} />
            <Field label="Last Contact" value={auth?.agent_last_contact} />
          </div>
        </div>
      </div>
    </div>
  )
}

function ComplianceTab({ data, taxYear }: { data: ComplianceData; taxYear: number }) {
  const compliance = data?.compliance ?? data
  const years = compliance?.years ?? { [taxYear]: compliance }
  const availableYears = Object.keys(years).map(Number).sort((a, b) => b - a)
  const [subYear, setSubYear] = useState(taxYear)

  useEffect(() => {
    setSubYear(taxYear)
  }, [taxYear])

  const yearInfo = years[subYear] ?? {}

  return (
    <div className={styles.twoCol}>
      <div className={styles.colMain}>
        <div className={styles.glassCard}>
          <h2 className={styles.cardTitle}>Year-by-Year Compliance</h2>
          {availableYears.length > 1 && (
            <div className={styles.subTabs}>
              {availableYears.map((y) => (
                <button
                  key={y}
                  className={`${styles.subTab} ${subYear === y ? styles.subTabActive : ''}`}
                  onClick={() => setSubYear(y)}
                >
                  {y}
                </button>
              ))}
            </div>
          )}
          <div className={styles.fieldList}>
            <Field label="Filing Status" value={yearInfo?.filing_status} />
            <Field label="Return Received" value={yearInfo?.return_received} />
            <Field label="Return Processed" value={yearInfo?.return_processed} />
            <Field label="Compliance Status" value={yearInfo?.compliance_status} />
            <Field label="Collection Status" value={yearInfo?.collection_status} />
            <Field label="Examination Status" value={yearInfo?.examination_status} />
          </div>
        </div>
      </div>
      <div className={styles.colAside}>
        <div className={styles.glassCard}>
          <h2 className={styles.cardTitle}>Filing Details</h2>
          <div className={styles.fieldList}>
            <Field label="Form Type" value={yearInfo?.form_type} />
            <Field label="Date Filed" value={yearInfo?.date_filed} />
            <Field label="Method" value={yearInfo?.filing_method} />
            <Field label="Acceptance Date" value={yearInfo?.acceptance_date} />
          </div>
        </div>
      </div>
    </div>
  )
}

function NoticesTab({ data }: { data: ComplianceData }) {
  const notices: ComplianceData[] = data?.notices ?? []
  return (
    <div className={styles.twoCol}>
      <div className={styles.colMain}>
        <div className={styles.glassCard}>
          <h2 className={styles.cardTitle}>IRS Notices</h2>
          {notices.length === 0 ? (
            <p className={styles.emptyText}>No notices on record.</p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Notice Type</th>
                    <th>Description</th>
                    <th>Response Deadline</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {notices.map((n, i) => (
                    <tr key={n.notice_id ?? i}>
                      <td>{val(n.date)}</td>
                      <td>{val(n.type ?? n.notice_type)}</td>
                      <td>{val(n.description)}</td>
                      <td>{val(n.response_deadline)}</td>
                      <td>
                        <span
                          className={
                            n.status === 'resolved'
                              ? styles.badgeSuccess
                              : n.status === 'overdue'
                                ? styles.badgeError
                                : styles.badgeDefault
                          }
                        >
                          {val(n.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <div className={styles.colAside}>
        <div className={styles.glassCard}>
          <h2 className={styles.cardTitle}>Notice Summary</h2>
          <div className={styles.fieldList}>
            <Field label="Total Notices" value={notices.length} />
            <Field
              label="Pending Response"
              value={notices.filter((n) => n.status === 'pending').length}
            />
            <Field
              label="Overdue"
              value={notices.filter((n) => n.status === 'overdue').length}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function InstallmentTab({ data }: { data: ComplianceData }) {
  const ia = data?.installment_agreement ?? data
  return (
    <div className={styles.twoCol}>
      <div className={styles.colMain}>
        <div className={styles.glassCard}>
          <h2 className={styles.cardTitle}>Installment Agreement</h2>
          <div className={styles.fieldList}>
            <Field label="Status" value={ia?.ia_status ?? ia?.status} />
            <Field label="Agreement Type" value={ia?.agreement_type} />
            <Field label="Monthly Payment" value={ia?.monthly_payment} />
            <Field label="Due Date" value={ia?.due_date} />
            <Field label="Start Date" value={ia?.start_date} />
            <Field label="End Date" value={ia?.end_date} />
          </div>
        </div>
      </div>
      <div className={styles.colAside}>
        <div className={styles.glassCard}>
          <h2 className={styles.cardTitle}>Balance</h2>
          <div className={styles.fieldList}>
            <Field label="Original Balance" value={ia?.original_balance} />
            <Field label="Balance Remaining" value={ia?.balance_remaining} />
            <Field label="Payments Made" value={ia?.payments_made} />
            <Field label="Next Payment Due" value={ia?.next_payment_date} />
          </div>
        </div>
      </div>
    </div>
  )
}

function RevenueOfficerTab({ data }: { data: ComplianceData }) {
  const ro = data?.revenue_officer ?? data
  return (
    <div className={styles.twoCol}>
      <div className={styles.colMain}>
        <div className={styles.glassCard}>
          <h2 className={styles.cardTitle}>Revenue Officer Assignment</h2>
          <div className={styles.fieldList}>
            <Field label="Name" value={ro?.ro_name} />
            <Field label="Badge Number" value={ro?.ro_badge} />
            <Field label="Territory" value={ro?.territory} />
            <Field label="Group Manager" value={ro?.group_manager} />
          </div>
        </div>
      </div>
      <div className={styles.colAside}>
        <div className={styles.glassCard}>
          <h2 className={styles.cardTitle}>Contact &amp; Activity</h2>
          <div className={styles.fieldList}>
            <Field label="Phone" value={ro?.ro_phone} />
            <Field label="Fax" value={ro?.ro_fax} />
            <Field label="Email" value={ro?.ro_email} />
            <Field label="Last Interaction" value={ro?.last_interaction} />
            <Field label="Next Scheduled" value={ro?.next_scheduled} />
          </div>
        </div>
      </div>
    </div>
  )
}

function TranscriptsTab({ data }: { data: ComplianceData }) {
  const transcripts = data?.transcripts ?? {}
  const types = [
    { key: 'account', label: 'Account Transcript' },
    { key: 'return', label: 'Return Transcript' },
    { key: 'wage_income', label: 'Wage & Income Transcript' },
    { key: 'record_of_account', label: 'Record of Account' },
  ]
  return (
    <div className={styles.twoCol}>
      <div className={styles.colMain}>
        <div className={styles.glassCard}>
          <h2 className={styles.cardTitle}>Transcript Types</h2>
          <div className={styles.transcriptList}>
            {types.map((t) => {
              const info = transcripts[t.key] ?? {}
              return (
                <div key={t.key} className={styles.transcriptRow}>
                  <div className={styles.transcriptLabel}>{t.label}</div>
                  <span
                    className={
                      info.status === 'available'
                        ? styles.badgeSuccess
                        : info.status === 'unavailable'
                          ? styles.badgeError
                          : styles.badgeDefault
                    }
                  >
                    {val(info.status, 'Pending')}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      <div className={styles.colAside}>
        <div className={styles.glassCard}>
          <h2 className={styles.cardTitle}>Transcript Details</h2>
          <div className={styles.fieldList}>
            <Field label="Last Requested" value={transcripts?.last_requested} />
            <Field label="Last Received" value={transcripts?.last_received} />
            <Field label="Request Method" value={transcripts?.request_method} />
          </div>
        </div>
      </div>
    </div>
  )
}

function SummaryTab({ data }: { data: ComplianceData }) {
  const summary = data?.summary ?? data?.summary_text ?? 'No compliance summary available.'
  const summaryText = typeof summary === 'string' ? summary : JSON.stringify(summary, null, 2)
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summaryText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard API may not be available */
    }
  }

  return (
    <div className={styles.singleCol}>
      <div className={styles.glassCard}>
        <div className={styles.summaryHeader}>
          <h2 className={styles.cardTitle}>Full Compliance Summary</h2>
          <button className={styles.btnSecondary} onClick={handleCopy}>
            {copied ? 'Copied!' : 'Copy Summary'}
          </button>
        </div>
        <pre className={styles.summaryText}>{summaryText}</pre>
      </div>
    </div>
  )
}

/* ─── Reusable sub-components ─── */

function Field({ label, value }: { label: string; value: unknown }) {
  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <span className={styles.fieldValue}>{val(value)}</span>
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: unknown }) {
  return (
    <div className={styles.metricCard}>
      <span className={styles.metricValue}>{val(value, '--')}</span>
      <span className={styles.metricLabel}>{label}</span>
    </div>
  )
}
