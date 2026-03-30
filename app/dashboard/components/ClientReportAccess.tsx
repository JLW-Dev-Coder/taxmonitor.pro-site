'use client'

import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api'
import type { SessionUser } from '@/components/AuthGuard'
import { ReportContent } from '@/app/report/page'
import styles from './components.module.css'

interface Client {
  professional_id: string
  name: string
}

export default function ClientReportAccess({ account }: { account: SessionUser }) {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string>('')

  const fetchClients = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.getDirectory()
      setClients(res.professionals ?? [])
    } catch {
      setClients([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void account
    fetchClients()
  }, [account, fetchClients])

  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.spinner} />
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Client Report Access</h1>

      {clients.length === 0 ? (
        <div className={styles.emptyState}>
          <h3 className={styles.emptyTitle}>No Clients</h3>
          <p className={styles.emptyText}>No clients available to view reports for.</p>
        </div>
      ) : (
        <>
          <select
            className={styles.selectInput}
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            <option value="">— Select a client —</option>
            {clients.map((c) => (
              <option key={c.professional_id} value={c.professional_id}>
                {c.name}
              </option>
            ))}
          </select>

          {selectedId ? (
            /* Render the report for the selected client using the same account
               (read-only view — the report component fetches by account_id from session) */
            <ReportContent account={{ ...account, account_id: selectedId }} />
          ) : (
            <div className={styles.emptyState} style={{ padding: '2rem' }}>
              <p className={styles.emptyText}>Select a client above to view their compliance report.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
