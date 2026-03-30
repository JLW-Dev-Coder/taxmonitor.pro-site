'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import type { SessionUser } from '@/components/AuthGuard'
import styles from './components.module.css'

interface TokenBalance {
  transcript_tokens: number
  tax_game_tokens: number
}

export default function Tokens({ account }: { account: SessionUser }) {
  const [balance, setBalance] = useState<TokenBalance | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchBalance = useCallback(async () => {
    try {
      const res = await api.getTokenBalance(account.account_id)
      setBalance(res)
    } catch {
      setBalance(null)
    } finally {
      setLoading(false)
    }
  }, [account.account_id])

  useEffect(() => {
    fetchBalance()
  }, [fetchBalance])

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Tokens</h1>

      <div className={styles.summaryRow} style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Transcript Tokens</div>
          <div className={styles.summaryValue}>
            {loading ? '—' : (balance?.transcript_tokens ?? '—')}
          </div>
          <div className={styles.summaryNote}>Available for transcript analysis</div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Tax Game Tokens</div>
          <div className={styles.summaryValue}>
            {loading ? '—' : (balance?.tax_game_tokens ?? '—')}
          </div>
          <div className={styles.summaryNote}>Available for tax tools</div>
        </div>
      </div>

      {!loading && balance === null && (
        <div className={styles.glassCard}>
          <h2 className={styles.cardTitle}>Token Balance</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>
            Token balance could not be loaded. Purchase a plan to receive tokens.
          </p>
          <Link href="/pricing">
            <button className={styles.btnPrimary}>View Pricing Plans</button>
          </Link>
        </div>
      )}
    </div>
  )
}
