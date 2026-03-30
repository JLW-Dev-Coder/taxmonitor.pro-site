'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { SessionUser } from '@/components/AuthGuard'
import styles from './components.module.css'

const FAQ_ITEMS = [
  {
    q: 'How do I add a client?',
    a: 'To add a client, navigate to the Clients section and use the directory search to find an existing taxpayer account. Client enrollment will be available through the intake pipeline once the system is fully active.',
  },
  {
    q: 'How do tokens work?',
    a: 'Tokens are used to access premium features such as transcript analysis and interactive tax tools. Each action consumes a set number of tokens. You can purchase additional tokens or receive them with a plan upgrade on the Pricing page.',
  },
  {
    q: 'How do I connect my calendar?',
    a: 'Navigate to the Calendar section from the main sidebar. From there you can connect your Google or Outlook calendar to schedule client appointments and receive reminders.',
  },
  {
    q: 'How do I generate a report?',
    a: 'Go to the Compliance Report section in this dashboard. Select the tax year, choose Primary or Spouse view, and click Generate PDF. The report is generated from live IRS data associated with the account.',
  },
  {
    q: 'How do I contact support?',
    a: 'You can reach our support team via the Support page accessible from the main sidebar. Submit a ticket with your issue and our team will respond within one business day.',
  },
]

export default function HelpCenter({ account }: { account: SessionUser }) {
  void account
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Help Center</h1>

      <div className={styles.glassCard}>
        <h2 className={styles.cardTitle}>Frequently Asked Questions</h2>
        <div className={styles.faqList}>
          {FAQ_ITEMS.map((item, idx) => (
            <div key={idx} className={styles.faqItem}>
              <button
                className={styles.faqQuestion}
                onClick={() => setOpen(open === idx ? null : idx)}
              >
                <span>{item.q}</span>
                <svg
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                  style={{
                    transform: open === idx ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                    flexShrink: 0,
                    color: 'var(--text-subtle)',
                  }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {open === idx && (
                <div className={styles.faqAnswer}>{item.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
          Can&apos;t find what you&apos;re looking for?
        </p>
        <Link href="/support">
          <button className={styles.btnPrimary}>Contact Support</button>
        </Link>
      </div>
    </div>
  )
}
