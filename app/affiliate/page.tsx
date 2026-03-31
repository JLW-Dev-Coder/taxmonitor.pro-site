'use client'

import { useEffect, useState, useCallback } from 'react'
import AuthGuard from '@/components/AuthGuard'
import AppShell from '@/components/AppShell'
import { api } from '@/lib/api'
import type { SessionUser } from '@/components/AuthGuard'
import styles from './page.module.css'

/* ── Types ── */
interface AffiliateData {
  referral_code: string
  connect_status: string
  balance_pending: number
  balance_paid: number
  referral_url: string
}

interface AffiliateEvent {
  platform: string
  gross_amount: number
  commission_amount: number
  status: string
  created_at: string
}

/* ── Page Export ── */
export default function AffiliatePage() {
  return (
    <AuthGuard>
      {({ account }) => (
        <AppShell account={account}>
          <AffiliateContent account={account} />
        </AppShell>
      )}
    </AuthGuard>
  )
}

function AffiliateContent({ account }: { account: SessionUser }) {
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null)
  const [events, setEvents] = useState<AffiliateEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [eventsLoading, setEventsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [payoutLoading, setPayoutLoading] = useState(false)
  const [payoutSuccess, setPayoutSuccess] = useState<string | null>(null)
  const [payoutError, setPayoutError] = useState<string | null>(null)
  const [onboardLoading, setOnboardLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setEventsLoading(true)
    setError(null)
    try {
      const [affRes, eventsRes] = await Promise.all([
        api.getAffiliate(account.account_id),
        api.getAffiliateEvents(account.account_id),
      ])
      setAffiliate(affRes)
      setEvents(eventsRes.events ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load affiliate data')
    } finally {
      setLoading(false)
      setEventsLoading(false)
    }
  }, [account.account_id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCopy = useCallback(() => {
    if (!affiliate) return
    navigator.clipboard.writeText(affiliate.referral_url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [affiliate])

  const handlePayout = useCallback(async () => {
    if (!affiliate) return
    setPayoutLoading(true)
    setPayoutError(null)
    setPayoutSuccess(null)
    try {
      const res = await api.requestPayout(affiliate.balance_pending)
      setPayoutSuccess(`Payout requested! ID: ${res.payout_id}`)
      // Refresh affiliate data to reflect new balance
      const refreshed = await api.getAffiliate(account.account_id)
      setAffiliate(refreshed)
    } catch (err) {
      setPayoutError(err instanceof Error ? err.message : 'Payout request failed')
    } finally {
      setPayoutLoading(false)
    }
  }, [affiliate, account.account_id])

  const handleOnboard = useCallback(async () => {
    setOnboardLoading(true)
    try {
      const res = await api.startAffiliateOnboarding()
      window.location.href = res.onboard_url
    } catch (err) {
      setOnboardLoading(false)
      alert(err instanceof Error ? err.message : 'Onboarding failed')
    }
  }, [])

  /* ── Loading ── */
  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.spinner} />
        <p className={styles.loadingText}>Loading affiliate data…</p>
      </div>
    )
  }

  /* ── Error ── */
  if (error || !affiliate) {
    return (
      <div className={styles.errorWrap}>
        <p className={styles.errorText}>{error ?? 'No affiliate data found.'}</p>
        <button className={styles.retryBtn} onClick={fetchData}>Retry</button>
      </div>
    )
  }

  const canPayout =
    affiliate.balance_pending >= 1000 && affiliate.connect_status === 'active'
  const payoutDisabledReason =
    affiliate.connect_status !== 'active'
      ? 'Connect your bank account to withdraw'
      : affiliate.balance_pending < 1000
        ? 'Minimum payout is $10'
        : null

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Affiliate Program</h1>
        <p className={styles.pageSub}>Earn 20% commission on every purchase your referrals make, for life.</p>
      </div>

      {/* ── Section 1: Referral Link ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Your Referral Link</h2>
        <div className={styles.referralRow}>
          <input
            type="text"
            readOnly
            value={affiliate.referral_url}
            className={styles.referralInput}
            onFocus={(e) => e.target.select()}
          />
          <button
            type="button"
            className={`${styles.copyBtn} ${copied ? styles.copyBtnCopied : ''}`}
            onClick={handleCopy}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p className={styles.referralNote}>
          Share this link. Earn 20% commission on every purchase your referrals make, for life.
        </p>
      </section>

      {/* ── Section 2: Earnings Summary ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Earnings Summary</h2>
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <div className={styles.statAmount}>
              ${(affiliate.balance_pending / 100).toFixed(2)}
            </div>
            <div className={styles.statLabel}>Pending</div>
            <div className={styles.statSub}>Available to withdraw</div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statAmount} ${styles.statAmountPaid}`}>
              ${(affiliate.balance_paid / 100).toFixed(2)}
            </div>
            <div className={styles.statLabel}>Paid Out</div>
            <div className={styles.statSub}>Total earned and paid</div>
          </div>
        </div>

        <div className={styles.payoutRow}>
          <div className={styles.payoutBtnWrap} title={payoutDisabledReason ?? undefined}>
            <button
              type="button"
              className={styles.payoutBtn}
              disabled={!canPayout || payoutLoading}
              onClick={handlePayout}
            >
              {payoutLoading ? 'Requesting…' : 'Request Payout'}
            </button>
          </div>
          {payoutDisabledReason && (
            <p className={styles.payoutHint}>{payoutDisabledReason}</p>
          )}
          {payoutSuccess && (
            <p className={styles.payoutSuccess}>{payoutSuccess}</p>
          )}
          {payoutError && (
            <p className={styles.payoutError}>{payoutError}</p>
          )}
        </div>
      </section>

      {/* ── Section 3: Stripe Connect ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Bank Account</h2>
        {affiliate.connect_status === 'active' ? (
          <div className={styles.connectedBadge}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Bank account connected
          </div>
        ) : (
          <div className={styles.onboardCard}>
            <h3 className={styles.onboardTitle}>Connect your bank account</h3>
            <p className={styles.onboardBody}>
              Connect via Stripe to receive commission payouts directly to your bank.
            </p>
            <button
              type="button"
              className={styles.onboardBtn}
              disabled={onboardLoading}
              onClick={handleOnboard}
            >
              {onboardLoading ? 'Redirecting…' : 'Connect Bank Account'}
            </button>
          </div>
        )}
      </section>

      {/* ── Section 4: Commission History ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Commission History</h2>
        {eventsLoading ? (
          <div className={styles.tableSkeleton}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className={styles.skeletonRow} />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>
              No commissions yet. Share your referral link to start earning.
            </p>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Date</th>
                  <th className={styles.th}>Platform</th>
                  <th className={styles.th}>Sale Amount</th>
                  <th className={styles.th}>Your Commission</th>
                  <th className={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev, i) => (
                  <tr key={i} className={styles.tr}>
                    <td className={styles.td}>
                      {new Date(ev.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className={styles.td}>{ev.platform}</td>
                    <td className={styles.td}>${(ev.gross_amount / 100).toFixed(2)}</td>
                    <td className={styles.td}>${(ev.commission_amount / 100).toFixed(2)}</td>
                    <td className={styles.td}>
                      <span
                        className={`${styles.statusBadge} ${
                          ev.status === 'paid' ? styles.statusPaid : styles.statusPending
                        }`}
                      >
                        {ev.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
