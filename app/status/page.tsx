'use client'

import { useEffect, useState, useCallback } from 'react'
import AuthGuard from '@/components/AuthGuard'
import AppShell from '@/components/AppShell'
import { api } from '@/lib/api'
import type { SessionUser } from '@/components/AuthGuard'
import styles from './page.module.css'

/* ── Types ── */
interface ComplianceData {
  intake_complete?: number
  esign_2848_complete?: number
  processing_complete?: number
  tax_record_complete?: number
  current_step?: string
  step_status?: string
  notes?: string
  assigned_professional_id?: string
  [key: string]: unknown
}

interface Phase {
  key: keyof Pick<
    ComplianceData,
    'intake_complete' | 'esign_2848_complete' | 'processing_complete' | 'tax_record_complete'
  >
  label: string
  steps: string[]
}

const PHASES: Phase[] = [
  {
    key: 'intake_complete',
    label: 'Intake',
    steps: ['Submit taxpayer information', 'Verify identity', 'Sign engagement letter'],
  },
  {
    key: 'esign_2848_complete',
    label: 'ESign 2848',
    steps: ['Review IRS Form 2848', 'Confirm representative details', 'Electronically sign POA'],
  },
  {
    key: 'processing_complete',
    label: 'Processing',
    steps: ['Request transcripts', 'Analyze compliance history', 'Prepare resolution strategy'],
  },
  {
    key: 'tax_record_complete',
    label: 'Tax Record',
    steps: ['Retrieve all tax records', 'Cross-reference with IRS data', 'Finalize compliance report'],
  },
]

type PhaseState = 'complete' | 'current' | 'locked'

interface PhaseInfo {
  phase: Phase
  index: number
  state: PhaseState
  value: number
}

/* ── Page Export ── */
export default function StatusPage() {
  return (
    <AuthGuard>
      {({ account }) => (
        <AppShell account={account}>
          <StatusContent account={account} />
        </AppShell>
      )}
    </AuthGuard>
  )
}

function StatusContent({ account }: { account: SessionUser }) {
  const [data, setData] = useState<ComplianceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPhase, setSelectedPhase] = useState<PhaseInfo | null>(null)

  const fetchStatus = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.getComplianceStatus(account.account_id) as ComplianceData
      setData(res ?? {})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load status')
      setData({})
    } finally {
      setLoading(false)
    }
  }, [account.account_id])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  /* ── Compute phase states ── */
  function buildPhaseInfos(d: ComplianceData): PhaseInfo[] {
    let foundCurrent = false
    return PHASES.map((phase, index) => {
      const value = Number(d[phase.key] ?? 0)
      let state: PhaseState
      if (value === 1) {
        state = 'complete'
      } else if (!foundCurrent) {
        state = 'current'
        foundCurrent = true
      } else {
        state = 'locked'
      }
      return { phase, index, state, value }
    })
  }

  /* ── Loading ── */
  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.spinner} />
        <p className={styles.loadingText}>Loading project status…</p>
      </div>
    )
  }

  /* ── Error ── */
  if (error && !data) {
    return (
      <div className={styles.errorWrap}>
        <p className={styles.errorText}>{error}</p>
        <button className={styles.retryBtn} onClick={fetchStatus}>
          Retry
        </button>
      </div>
    )
  }

  const effectiveData: ComplianceData = data ?? {}
  const phaseInfos = buildPhaseInfos(effectiveData)
  const currentPhaseInfo = phaseInfos.find((p) => p.state === 'current') ?? phaseInfos[0]

  return (
    <>
      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroCard}>
          <h1 className={styles.heroTitle}>Project Status</h1>
          <p className={styles.heroSub}>Track your tax resolution progress through each phase</p>
        </div>
      </div>

      {/* Phase indicator bar */}
      <div className={styles.phaseBar}>
        <div className={styles.phaseBarInner}>
          {phaseInfos.map((pi, idx) => (
            <div key={pi.phase.key} style={{ display: 'flex', alignItems: 'center' }}>
              <div
                className={styles.phaseNode}
                onClick={() => setSelectedPhase(pi)}
              >
                <div
                  className={`${styles.phaseCircle} ${
                    pi.state === 'complete'
                      ? styles.phaseCircleComplete
                      : pi.state === 'current'
                        ? styles.phaseCircleCurrent
                        : styles.phaseCircleLocked
                  }`}
                >
                  {pi.state === 'complete' ? (
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    idx + 1
                  )}
                </div>
                <span
                  className={`${styles.phaseLabel} ${
                    pi.state !== 'locked' ? styles.phaseLabelActive : ''
                  }`}
                >
                  {pi.phase.label}
                </span>
              </div>
              {idx < phaseInfos.length - 1 && (
                <div
                  className={`${styles.phaseConnector} ${
                    pi.state === 'complete' ? styles.phaseConnectorComplete : ''
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Phase cards */}
      <div className={styles.phaseCards}>
        {phaseInfos.map((pi) => (
          <div
            key={pi.phase.key}
            className={styles.phaseCard}
            onClick={() => setSelectedPhase(pi)}
            style={{ cursor: 'pointer' }}
          >
            <div className={styles.phaseCardHeader}>
              <div className={styles.phaseNumber}>{pi.index + 1}</div>
              <h2 className={styles.phaseCardTitle}>{pi.phase.label}</h2>
              <div style={{ marginLeft: 'auto' }}>
                <span
                  className={`${styles.stepBadge} ${
                    pi.state === 'complete'
                      ? styles.badgeComplete
                      : pi.state === 'current'
                        ? styles.badgeCurrent
                        : styles.badgeLocked
                  }`}
                  style={{ borderRadius: '999px', padding: '0.2rem 0.75rem', fontSize: '0.75rem', fontWeight: 600 }}
                >
                  {pi.state === 'complete' ? 'Complete' : pi.state === 'current' ? 'In Progress' : 'Locked'}
                </span>
              </div>
            </div>

            <div className={styles.stepsGrid}>
              {pi.phase.steps.map((step, sIdx) => {
                const isCurrent = pi.phase.key === currentPhaseInfo.phase.key
                const currentStepName = effectiveData.current_step
                const stepStatus = effectiveData.step_status

                let stepState: 'complete' | 'current' | 'locked' | 'ready' | 'blocked'
                if (pi.state === 'complete') {
                  stepState = 'complete'
                } else if (pi.state === 'locked') {
                  stepState = 'locked'
                } else if (isCurrent) {
                  if (currentStepName && step.toLowerCase().includes(currentStepName.toLowerCase())) {
                    stepState = stepStatus === 'blocked' ? 'blocked' : 'current'
                  } else if (sIdx === 0 && !currentStepName) {
                    stepState = 'current'
                  } else {
                    stepState = sIdx < 1 ? 'complete' : 'ready'
                  }
                } else {
                  stepState = 'ready'
                }

                const badgeCls =
                  stepState === 'complete'
                    ? styles.badgeComplete
                    : stepState === 'current'
                      ? styles.badgeCurrent
                      : stepState === 'blocked'
                        ? styles.badgeBlocked
                        : stepState === 'ready'
                          ? styles.badgeReady
                          : styles.badgeLocked

                return (
                  <div key={sIdx} className={styles.stepNode}>
                    <div className={`${styles.stepBadge} ${badgeCls}`}>
                      {stepState === 'complete' ? (
                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : stepState === 'blocked' ? (
                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      ) : stepState === 'locked' ? (
                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                        </svg>
                      ) : (
                        sIdx + 1
                      )}
                    </div>
                    <div className={styles.stepInfo}>
                      <p className={styles.stepName}>{step}</p>
                      <span
                        className={styles.statusLabel}
                        style={{
                          color:
                            stepState === 'complete'
                              ? 'var(--success)'
                              : stepState === 'current'
                                ? 'var(--accent)'
                                : stepState === 'blocked'
                                  ? 'var(--error)'
                                  : stepState === 'ready'
                                    ? '#3b82f6'
                                    : 'var(--text-subtle)',
                        }}
                      >
                        {stepState.charAt(0).toUpperCase() + stepState.slice(1)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Slide-over */}
      {selectedPhase && (
        <>
          <div className={styles.slideOverlay} onClick={() => setSelectedPhase(null)} />
          <div className={styles.slidePanel}>
            <div className={styles.slidePanelHeader}>
              <h2 className={styles.slidePanelTitle}>Phase {selectedPhase.index + 1}: {selectedPhase.phase.label}</h2>
              <button className={styles.closeBtn} onClick={() => setSelectedPhase(null)}>
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className={styles.slidePanelBody}>
              <div className={styles.detailMeta}>
                <span className={styles.detailPhaseLabel}>Phase {selectedPhase.index + 1}</span>
                <span
                  className={styles.detailStatusBadge}
                  style={{
                    background:
                      selectedPhase.state === 'complete'
                        ? 'rgba(34,197,94,0.15)'
                        : selectedPhase.state === 'current'
                          ? 'rgba(245,158,11,0.15)'
                          : 'rgba(100,116,139,0.15)',
                    color:
                      selectedPhase.state === 'complete'
                        ? 'var(--success)'
                        : selectedPhase.state === 'current'
                          ? 'var(--accent)'
                          : 'var(--text-muted)',
                  }}
                >
                  {selectedPhase.state === 'complete'
                    ? 'Complete'
                    : selectedPhase.state === 'current'
                      ? 'In Progress'
                      : 'Locked'}
                </span>
              </div>

              <div className={styles.detailSection}>
                <h3 className={styles.detailSectionTitle}>Steps</h3>
                <ul className={styles.detailList}>
                  {selectedPhase.phase.steps.map((step, i) => (
                    <li key={i} className={styles.detailListItem}>
                      <span className={styles.detailListBullet}>›</span>
                      {step}
                    </li>
                  ))}
                </ul>
              </div>

              {effectiveData.notes && (
                <div className={styles.detailSection}>
                  <h3 className={styles.detailSectionTitle}>Notes</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    {String(effectiveData.notes)}
                  </p>
                </div>
              )}

              {effectiveData.assigned_professional_id && (
                <div className={styles.detailSection}>
                  <h3 className={styles.detailSectionTitle}>Assigned Professional</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    ID: {String(effectiveData.assigned_professional_id)}
                  </p>
                </div>
              )}

              {effectiveData.current_step && selectedPhase.state === 'current' && (
                <div className={styles.detailSection}>
                  <h3 className={styles.detailSectionTitle}>Current Step</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    {String(effectiveData.current_step)}
                    {effectiveData.step_status && (
                      <> — <span style={{ color: 'var(--accent)' }}>{String(effectiveData.step_status)}</span></>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}
