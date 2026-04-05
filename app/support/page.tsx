'use client'

import { useState, FormEvent } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { api } from '@/lib/api'
import styles from './page.module.css'

const FAQ_ITEMS = [
  {
    question: 'How do I find a tax professional?',
    answer:
      'The directory at /directory lets you search by specialty, city, state, and zip code. Browse profiles and reach out directly.',
  },
  {
    question: "What's included in my membership?",
    answer:
      'Free members can browse the directory and submit inquiries. Essential ($9/mo) adds monitoring tools and 5 tool tokens + 2 transcript tokens per month. Plus ($19/mo) adds priority support and 15 tool + 5 transcript tokens. Premier ($39/mo) adds dedicated support and 40 tool + 10 transcript tokens.',
  },
  {
    question: 'How do I cancel my membership?',
    answer:
      'Log in to your dashboard, go to Account, and click Manage Subscription. Cancellations take effect at the end of your current billing period.',
  },
  {
    question: 'Is my data secure?',
    answer:
      'All processing runs locally in your browser. We never upload your tax documents to our servers. Your account data is encrypted and stored securely.',
  },
  {
    question: 'How do I contact my tax professional?',
    answer:
      'Use the messaging feature in your dashboard. Your tax professional will receive your message and respond through the same system.',
  },
  {
    question: 'What is a transcript analysis?',
    answer:
      'A transcript analysis takes your IRS transcript PDF and translates the transaction codes into plain English. It helps you and your tax professional understand what the IRS has on file for your account.',
  },
]

export default function SupportPage() {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!subject.trim() || !message.trim()) return
    setSubmitting(true)
    setError('')
    try {
      await api.createTicket({ subject: subject.trim(), message: message.trim() })
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Header variant="site" />
      <main className={styles.page}>
        <div className={styles.inner}>
          {/* Hero */}
          <div className={styles.hero}>
            <h1 className={styles.heroTitle}>How can we help?</h1>
            <p className={styles.heroSub}>
              Find answers to common questions, reach out to our team, or submit a support ticket.
            </p>
          </div>

          {/* FAQ */}
          <section className={styles.faqSection}>
            <div className={styles.sectionLabel}>Common questions</div>
            <div className={styles.faqList}>
              {FAQ_ITEMS.map((item) => (
                <details key={item.question} className={styles.faqItem}>
                  <summary>{item.question}</summary>
                  <div className={styles.faqAnswer}>{item.answer}</div>
                </details>
              ))}
            </div>
          </section>

          {/* Contact */}
          <section className={styles.contactSection}>
            <div className={styles.sectionLabel}>Contact us</div>
            <div className={styles.contactGrid}>
              <a
                href="https://cal.com/vlp/support"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.contactCard}
              >
                <div className={styles.contactIcon}>
                  <svg className={styles.contactIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className={styles.contactTitle}>Schedule a call</div>
                <div className={styles.contactDesc}>Book a time with our support team</div>
                <span className={styles.contactLink}>Open calendar &rarr;</span>
              </a>

              <a
                href="mailto:support@virtuallaunch.pro"
                className={styles.contactCard}
              >
                <div className={styles.contactIcon}>
                  <svg className={styles.contactIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className={styles.contactTitle}>Email us</div>
                <div className={styles.contactDesc}>support@virtuallaunch.pro</div>
                <span className={styles.contactLink}>Send email &rarr;</span>
              </a>

              <a
                href="https://transcript.taxmonitor.pro/resources"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.contactCard}
              >
                <div className={styles.contactIcon}>
                  <svg className={styles.contactIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div className={styles.contactTitle}>Check our resources</div>
                <div className={styles.contactDesc}>Guides, walkthroughs, and more</div>
                <span className={styles.contactLink}>Browse resources &rarr;</span>
              </a>
            </div>
          </section>

          {/* Support Ticket */}
          <section className={styles.ticketSection}>
            <div className={styles.sectionLabel}>Submit a support ticket</div>
            <div className={styles.ticketCard}>
              {submitted ? (
                <div className={styles.successMsg}>
                  Your ticket has been submitted. We&apos;ll respond within 24 hours.
                </div>
              ) : (
                <>
                  <h2 className={styles.ticketTitle}>Need help?</h2>
                  <p className={styles.ticketSub}>
                    Describe your issue and we&apos;ll get back to you as soon as possible.
                  </p>
                  {error && <div className={styles.errorMsg}>{error}</div>}
                  <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                      <label htmlFor="subject" className={styles.formLabel}>Subject</label>
                      <input
                        id="subject"
                        type="text"
                        className={styles.formInput}
                        placeholder="Brief description of your issue"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label htmlFor="message" className={styles.formLabel}>Message</label>
                      <textarea
                        id="message"
                        className={styles.formTextarea}
                        placeholder="Tell us more about what you need help with..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                      />
                    </div>
                    <button type="submit" className={styles.submitBtn} disabled={submitting}>
                      {submitting ? 'Submitting...' : 'Submit ticket'}
                    </button>
                  </form>
                </>
              )}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  )
}
