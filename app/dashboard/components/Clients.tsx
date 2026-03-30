'use client'

import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api'
import type { SessionUser } from '@/components/AuthGuard'
import styles from './components.module.css'

interface Client {
  professional_id: string
  name: string
  title?: string
  specialty?: string[]
  location?: string
  avatar_url?: string
  verified?: boolean
}

interface ClientsProps {
  account: SessionUser
  filterPlan?: string
}

export default function Clients({ account, filterPlan }: ClientsProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const fetchClients = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.getDirectory()
      let list = res.professionals ?? []
      if (filterPlan) {
        list = list.filter((c) =>
          (c.specialty ?? []).some((s) => s.toLowerCase().includes(filterPlan.toLowerCase()))
        )
      }
      setClients(list)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load clients')
    } finally {
      setLoading(false)
    }
  }, [filterPlan])

  useEffect(() => {
    void account
    fetchClients()
  }, [account, fetchClients])

  const filtered = clients.filter((c) => {
    const matchesSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.title ?? '').toLowerCase().includes(search.toLowerCase())
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'verified' && c.verified) ||
      (statusFilter === 'unverified' && !c.verified)
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.spinner} />
        <span className={styles.loadingText}>Loading clients…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.errorState}>
        <p className={styles.errorText}>{error}</p>
        <button className={styles.retryBtn} onClick={fetchClients}>Retry</button>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>{filterPlan ? 'Monitored Clients' : 'Clients'}</h1>

      <div className={styles.filterBar}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search by name or title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className={styles.filterSelect}
          style={{ width: 'auto' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="verified">Verified</option>
          <option value="unverified">Unverified</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className={styles.emptyTitle}>No Clients Found</h3>
          <p className={styles.emptyText}>
            {search || statusFilter !== 'all' ? 'Try adjusting your filters.' : 'Client records will appear here.'}
          </p>
        </div>
      ) : (
        <div className={styles.glassCard} style={{ padding: 0, overflow: 'hidden' }}>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Title / Plan</th>
                  <th>Location</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.professional_id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        {c.avatar_url ? (
                          <img
                            src={c.avatar_url}
                            alt={c.name}
                            style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                          />
                        ) : (
                          <div style={{
                            width: 28, height: 28, borderRadius: '50%',
                            background: 'rgba(245,158,11,0.15)', color: 'var(--accent)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.75rem', fontWeight: 700, flexShrink: 0
                          }}>
                            {c.name[0]?.toUpperCase() ?? '?'}
                          </div>
                        )}
                        <span>{c.name}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{c.title || (c.specialty?.[0] ?? '—')}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{c.location || '—'}</td>
                    <td>
                      <span className={`${styles.badge} ${c.verified ? styles.badgeSuccess : styles.badgeDefault}`}>
                        {c.verified ? 'Verified' : 'Unverified'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
