'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import SiteBackground from '@/components/SiteBackground'
import Header from '@/components/Header'
import styles from './page.module.css'

const PLAYLIST = [
  { id: 'ahvwuWvR3gM', title: 'What Is An IRS Transcript And Why Should I Care?' },
  { id: 'RSXXZznJnv0', title: 'How To Order IRS Transcripts (Online, Phone, Mail)' },
  { id: 'ktPpc4ofhX8', title: 'How To Read IRS Transcript Sections (Top to Bottom)' },
  { id: 'AFAL4qQUfW8', title: 'Common Transcript Codes and What They Mean' },
  { id: 'NW62KZYXgXo', title: 'Putting It Together: Next Steps and Practical Examples' },
]

const EBOOK_FEATURES = [
  { title: 'Printable reference guide', sub: 'Keep handy while reading your transcripts' },
  { title: 'Quick-reference code chart', sub: 'Find what codes like 150, 806, and 846 really mean' },
  { title: 'Action-step worksheet', sub: 'Plan your next steps based on your specific situation' },
  { title: 'Bonus: Red flags checklist', sub: 'Know when to escalate to a professional' },
]

export default function TranscriptCentralPage() {
  const [activeVideo, setActiveVideo] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(true)
  const [formStatus, setFormStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [formMsg, setFormMsg] = useState('')

  const scrollToVideo = useCallback(() => {
    document.getElementById('video-series')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const handleEbookSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormMsg('')

    if (!email || !email.includes('@') || !email.includes('.')) {
      setFormStatus('error')
      setFormMsg('Please enter a valid email.')
      return
    }
    if (!consent) {
      setFormStatus('error')
      setFormMsg('Please confirm you want the ebook emailed to you.')
      return
    }

    setFormStatus('sending')
    try {
      const res = await fetch('https://api.taxmonitor.pro/forms/lead-magnet/transcript-ebook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consent,
          email,
          eventId: crypto.randomUUID?.() ?? String(Date.now()),
          page: 'transcript-central',
        }),
      })
      if (!res.ok) throw new Error('Request failed')
      setFormStatus('success')
      setFormMsg('Sent. Check your inbox for the download link.')
      setEmail('')
      setTimeout(() => setShowModal(false), 900)
    } catch {
      setFormStatus('error')
      setFormMsg('Could not send right now. Try again in a minute.')
    }
  }

  const CheckIcon = () => (
    <svg className={styles.modalFeatureIcon} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  )

  return (
    <>
      <SiteBackground />
      <Header variant="site" />

      <main>
        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <div className={styles.trustBadge}>
              <svg className={styles.trustIcon} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Proactive monitoring by licensed tax professionals — intake does not create IRS representation.</span>
            </div>

            <h1 className={styles.title}>Understand and Master IRS Transcripts</h1>
            <p className={styles.subtitle}>Learn how to read, obtain, and interpret your IRS transcript in minutes.</p>

            <div className={styles.heroButtons}>
              <button className={styles.btnPrimary} onClick={scrollToVideo}>Watch Video Series</button>
              <button className={styles.btnSecondary} onClick={() => setShowModal(true)}>Get Free Ebook</button>
            </div>
            <p className={styles.heroMicro}>5-part video series + downloadable guide.</p>
          </div>
        </section>

        <div className={styles.divider} />

        {/* Video Series */}
        <section id="video-series" className={styles.videoSection}>
          <div className={styles.videoInner}>
            <div className={styles.videoGrid}>
              <div>
                <iframe
                  className={styles.videoPlayer}
                  src={`https://www.youtube-nocookie.com/embed/${PLAYLIST[activeVideo].id}?rel=0&modestbranding=1`}
                  title="IRS Transcript Video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
                <div className={styles.nowPlayingLabel}>Now Playing</div>
                <div className={styles.nowPlayingTitle}>
                  {PLAYLIST[activeVideo].title} ({activeVideo + 1} of 5)
                </div>
              </div>

              <div>
                <div className={styles.playlistHeading}>5-Part Series</div>
                <div className={styles.playlistItems}>
                  {PLAYLIST.map((v, i) => (
                    <button
                      key={v.id}
                      className={`${styles.playlistBtn} ${i === activeVideo ? styles.playlistBtnActive : ''}`}
                      onClick={() => setActiveVideo(i)}
                    >
                      <div className={styles.playlistBtnInner}>
                        <div>
                          <div className={styles.playlistPart}>Part {i + 1} of 5</div>
                          <div className={styles.playlistTitle}>{v.title}</div>
                        </div>
                        <svg className={styles.playlistPlayIcon} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M6 4l10 6-10 6V4z" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.divider} />

        {/* Methods */}
        <section className={styles.methodsSection}>
          <div className={styles.methodsInner}>
            <div className={styles.sectionCenter}>
              <h2 className={styles.sectionTitle}>How to Obtain Transcripts</h2>
              <p className={styles.sectionSub}>Pick the method that fits your situation and urgency.</p>
            </div>

            <div className={styles.methodsGrid}>
              <div className={styles.methodCard}>
                <div className={`${styles.methodIconBox} ${styles.methodIconAmber}`}>
                  <svg className={`${styles.methodIcon} ${styles.iconAmber}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <div className={`${styles.methodSpeed} ${styles.iconAmber}`}>Fastest</div>
                <h3 className={styles.methodCardTitle}>Online via IRS.gov</h3>
                <p className={styles.methodDesc}>Create an IRS account and complete identity verification for immediate access.</p>
                <ul className={styles.methodList}>
                  <li>&#10003; Download and print instantly</li>
                  <li>&#10003; Access most transcript types</li>
                  <li>&#10003; Best for speed</li>
                </ul>
              </div>

              <div className={styles.methodCard}>
                <div className={`${styles.methodIconBox} ${styles.methodIconGreen}`}>
                  <svg className={`${styles.methodIcon} ${styles.iconGreen}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3l2 5-2 1a16 16 0 007 7l1-2 5 2v3a2 2 0 01-2 2h-1C9.82 21 3 14.18 3 6V5z" />
                  </svg>
                </div>
                <div className={`${styles.methodSpeed} ${styles.iconGreen}`}>No Internet</div>
                <h3 className={styles.methodCardTitle}>Phone Request</h3>
                <p className={styles.methodDesc}>Use the IRS automated line to request transcripts mailed to your address on file.</p>
                <ul className={styles.methodList}>
                  <li>&#10003; Automated service</li>
                  <li>&#10003; Arrives by mail</li>
                  <li>&#10003; Useful for basic needs</li>
                </ul>
              </div>

              <div className={styles.methodCard}>
                <div className={`${styles.methodIconBox} ${styles.methodIconRed}`}>
                  <svg className={`${styles.methodIcon} ${styles.iconRed}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-18 9a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10z" />
                  </svg>
                </div>
                <div className={`${styles.methodSpeed} ${styles.iconRed}`}>Traditional</div>
                <h3 className={styles.methodCardTitle}>Mail via Form 4506-T</h3>
                <p className={styles.methodDesc}>Submit a transcript request by mail, including third-party recipient options.</p>
                <ul className={styles.methodList}>
                  <li>&#10003; Works for special cases</li>
                  <li>&#10003; Slower processing</li>
                  <li>&#10003; Paper trail</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.divider} />

        {/* Timeframes */}
        <section className={styles.timeframesSection}>
          <div className={styles.timeframesInner}>
            <div className={styles.sectionCenter}>
              <h2 className={styles.sectionTitle}>Availability &amp; Timeframes</h2>
              <p className={styles.sectionSub}>Availability varies by transcript type and IRS processing timelines.</p>
            </div>

            <div className={styles.timeframesGrid}>
              <div className={styles.timeCard}>
                <h3 className={styles.timeCardTitle}>Years Available</h3>
                <div className={styles.timeRows}>
                  <div className={styles.timeRow}>
                    <span className={styles.timeRowLabel}>Tax Return Transcript</span>
                    <span className={`${styles.timeRowValue} ${styles.timeRowAmber}`}>Current + 3 years</span>
                  </div>
                  <div className={styles.timeRow}>
                    <span className={styles.timeRowLabel}>Tax Account Transcript</span>
                    <span className={`${styles.timeRowValue} ${styles.timeRowGreen}`}>Current + 10 years</span>
                  </div>
                  <div className={styles.timeRow}>
                    <span className={styles.timeRowLabel}>Record of Account</span>
                    <span className={`${styles.timeRowValue} ${styles.timeRowOrange}`}>Current + 3 years</span>
                  </div>
                  <div className={styles.timeRow}>
                    <span className={styles.timeRowLabel}>Wage &amp; Income</span>
                    <span className={`${styles.timeRowValue} ${styles.timeRowGreen}`}>Current + 10 years</span>
                  </div>
                </div>
              </div>

              <div className={styles.timeCard}>
                <h3 className={styles.timeCardTitle}>When Available</h3>
                <div className={styles.timeAlerts}>
                  <div className={`${styles.timeAlert} ${styles.timeAlertGreen}`}>
                    <h4 className={styles.timeAlertTitle}>E-Filed Returns</h4>
                    <p className={styles.timeAlertDesc}>Often available within 2–3 weeks after filing.</p>
                  </div>
                  <div className={`${styles.timeAlert} ${styles.timeAlertAmber}`}>
                    <h4 className={styles.timeAlertTitle}>Paper Returns</h4>
                    <p className={styles.timeAlertDesc}>Can take 6–8 weeks (or longer) after filing.</p>
                  </div>
                  <div className={`${styles.timeAlert} ${styles.timeAlertOrange}`}>
                    <h4 className={styles.timeAlertTitle}>Wage &amp; Income Data</h4>
                    <p className={styles.timeAlertDesc}>Commonly available by mid-March for the prior year.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.proTip}>
              <svg className={styles.proTipIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2a7 7 0 00-4 12.74V17a2 2 0 002 2h4a2 2 0 002-2v-2.26A7 7 0 0012 2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 21h6" />
              </svg>
              <div>
                <h4 className={styles.proTipTitle}>Pro Tip</h4>
                <p className={styles.proTipText}>If you need a prior-year AGI to e-file and your transcript isn&apos;t available yet, you may be able to use $0 AGI in certain cases. Confirm the rule for your filing situation before submitting.</p>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.divider} />

        {/* Understanding */}
        <section className={styles.understandingSection}>
          <div className={styles.understandingInner}>
            <div className={styles.sectionCenter}>
              <h2 className={styles.sectionTitle}>Understanding Your Transcript</h2>
              <p className={styles.sectionSub}>Common terms and transaction codes you&apos;ll see.</p>
            </div>

            <div className={styles.codesGrid}>
              <div className={styles.codeCard}>
                <div className={`${styles.codeLabel} ${styles.codeLabelAmber}`}>AGI</div>
                <p className={styles.codeDesc}>Adjusted Gross Income. Often requested for verification.</p>
              </div>
              <div className={styles.codeCard}>
                <div className={`${styles.codeLabel} ${styles.codeLabelOrange}`}>Code 150</div>
                <p className={styles.codeDesc}>Return processed and tax assessed.</p>
              </div>
              <div className={styles.codeCard}>
                <div className={`${styles.codeLabel} ${styles.codeLabelGreen}`}>Code 806</div>
                <p className={styles.codeDesc}>Federal withholding credit.</p>
              </div>
              <div className={styles.codeCard}>
                <div className={`${styles.codeLabel} ${styles.codeLabelAmber}`}>Code 846</div>
                <p className={styles.codeDesc}>Refund issued or scheduled.</p>
              </div>
              <div className={styles.codeCard}>
                <div className={`${styles.codeLabel} ${styles.codeLabelRed}`}>Code 570</div>
                <p className={styles.codeDesc}>Hold or pending action.</p>
              </div>
              <div className={styles.codeCard}>
                <div className={`${styles.codeLabel} ${styles.codeLabelOrange}`}>Code 971</div>
                <p className={styles.codeDesc}>Notice/letter issued.</p>
              </div>
            </div>

            <div className={styles.tipsCard}>
              <h3 className={styles.tipsTitle}>Key Tips for Reading Your Transcript</h3>
              <div className={styles.tipsGrid}>
                <div className={styles.tipsColumn}>
                  <div className={styles.tipItem}>
                    <span className={styles.tipNumber}>1</span>
                    <div>
                      <h4 className={styles.tipTitle}>Check the Cycle Code</h4>
                      <p className={styles.tipDesc}>It can indicate when processing occurred (year/week/day pattern).</p>
                    </div>
                  </div>
                  <div className={styles.tipItem}>
                    <span className={styles.tipNumber}>2</span>
                    <div>
                      <h4 className={styles.tipTitle}>Look for Refund Dates</h4>
                      <p className={styles.tipDesc}>Code 846 often includes the refund release date.</p>
                    </div>
                  </div>
                  <div className={styles.tipItem}>
                    <span className={styles.tipNumber}>3</span>
                    <div>
                      <h4 className={styles.tipTitle}>Watch for Holds</h4>
                      <p className={styles.tipDesc}>Codes 570/810/420 can imply delay, review, or audit activity.</p>
                    </div>
                  </div>
                </div>
                <div className={styles.tipsColumn}>
                  <div className={styles.tipItem}>
                    <span className={styles.tipNumber}>4</span>
                    <div>
                      <h4 className={styles.tipTitle}>Verify Credits</h4>
                      <p className={styles.tipDesc}>Confirm credits and withholding were applied correctly.</p>
                    </div>
                  </div>
                  <div className={styles.tipItem}>
                    <span className={styles.tipNumber}>5</span>
                    <div>
                      <h4 className={styles.tipTitle}>Review Penalty Lines</h4>
                      <p className={styles.tipDesc}>Penalty/interest codes and dates help explain balances.</p>
                    </div>
                  </div>
                  <div className={styles.tipItem}>
                    <span className={styles.tipNumber}>6</span>
                    <div>
                      <h4 className={styles.tipTitle}>Get Help When Needed</h4>
                      <p className={styles.tipDesc}>If the story doesn&apos;t make sense, don&apos;t guess. Verify.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.divider} />

        {/* Help */}
        <section className={styles.helpSection}>
          <div className={styles.helpInner}>
            <div className={styles.sectionCenter}>
              <h2 className={styles.sectionTitle}>How We Can Help</h2>
              <p className={styles.sectionSub}>Clear explanations, next-step guidance, and professional support.</p>
            </div>

            <div className={styles.helpGrid}>
              <div className={styles.helpCard}>
                <div className={`${styles.helpCardBar} ${styles.helpCardBarAmber}`} />
                <div className={styles.helpCardBody}>
                  <div className={styles.helpCardHeader}>
                    <div className={`${styles.helpCardIcon} ${styles.helpCardIconAmber}`}>
                      <svg className={`${styles.helpCardIconSvg} ${styles.iconAmber}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A9 9 0 1118.879 17.8M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <h3 className={styles.helpCardTitle}>For Taxpayers</h3>
                  </div>
                  <p className={styles.helpCardDesc}>We help you interpret your transcript, understand notices, and map realistic options.</p>
                  <ul className={styles.helpList}>
                    {['Transcript analysis and explanation', 'Notice and letter guidance', 'Tax monitoring for ongoing support', 'Representation workflows'].map(item => (
                      <li key={item} className={styles.helpListItem}>
                        <svg className={styles.helpCheckIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/contact" className={styles.helpBtnPrimary}>Get Personal Help</Link>
                </div>
              </div>

              <div className={styles.helpCard}>
                <div className={`${styles.helpCardBar} ${styles.helpCardBarOrange}`} />
                <div className={styles.helpCardBody}>
                  <div className={styles.helpCardHeader}>
                    <div className={`${styles.helpCardIcon} ${styles.helpCardIconOrange}`}>
                      <svg className={`${styles.helpCardIconSvg} ${styles.iconRed}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6h4a2 2 0 012 2v1h3a2 2 0 012 2v7a2 2 0 01-2 2H3a2 2 0 01-2-2v-7a2 2 0 012-2h3V8a2 2 0 012-2z" />
                      </svg>
                    </div>
                    <h3 className={styles.helpCardTitle}>For Tax Professionals</h3>
                  </div>
                  <p className={styles.helpCardDesc}>Get sharper at transcript review, escalations, and documentation workflows.</p>
                  <ul className={styles.helpList}>
                    {['Transcript training resources', 'Complex case consults', 'Documentation systems', 'Referral partnership paths'].map(item => (
                      <li key={item} className={styles.helpListItem}>
                        <svg className={styles.helpCheckIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <a href="https://virtuallaunch.pro" target="_blank" rel="noopener noreferrer" className={styles.helpBtnSecondary}>Partner With Us</a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.divider} />

        {/* Final CTA */}
        <section className={styles.ctaSection}>
          <div className={styles.ctaInner}>
            <h2 className={styles.ctaHeadline}>Ready to <span className="gradient-text">Learn More</span>?</h2>
            <p className={styles.ctaDesc}>Start with the video series or download the free ebook.</p>
            <div className={styles.ctaButtons}>
              <button className={styles.ctaButton} onClick={scrollToVideo}>Watch Videos</button>
              <button className={styles.ctaButtonSecondary} onClick={() => setShowModal(true)}>Get Free Ebook</button>
            </div>
            <p className={styles.ctaDisclaimer}>Proactive monitoring by licensed tax professionals — intake does not create IRS representation.</p>
          </div>
        </section>
      </main>

      {/* Ebook Modal */}
      {showModal && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modalBackdrop} onClick={() => setShowModal(false)} />
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>Get Your Free IRS Transcript Guide</h3>
                <p className={styles.modalDesc}>
                  Master transcript reading with our comprehensive companion guide. This downloadable PDF walks you through every section, code, and strategy featured in the 5-part video series—plus exclusive insider tips for interpreting complex scenarios.
                </p>
              </div>
              <button className={styles.modalClose} onClick={() => setShowModal(false)} aria-label="Close">
                <svg className={styles.modalCloseSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className={styles.modalFeatures}>
              {EBOOK_FEATURES.map(f => (
                <div key={f.title} className={styles.modalFeature}>
                  <CheckIcon />
                  <div>
                    <p className={styles.modalFeatureTitle}>{f.title}</p>
                    <p className={styles.modalFeatureSub}>{f.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            <form className={styles.modalForm} onSubmit={handleEbookSubmit}>
              <div>
                <label className={styles.modalLabel} htmlFor="ebook-email">Email Address</label>
                <input
                  id="ebook-email"
                  className={styles.modalInput}
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <label className={styles.modalConsent}>
                <input
                  type="checkbox"
                  className={styles.modalCheckbox}
                  checked={consent}
                  onChange={e => setConsent(e.target.checked)}
                />
                <span>Yes, send me the free ebook and occasional transcript tips. I can unsubscribe anytime.</span>
              </label>
              {formStatus === 'error' && <div className={styles.modalError}>{formMsg}</div>}
              {formStatus === 'success' && <div className={styles.modalSuccess}>{formMsg}</div>}
              <button className={styles.modalSubmit} type="submit" disabled={formStatus === 'sending'}>
                {formStatus === 'sending' ? 'Sending...' : 'Download Free PDF'}
              </button>
              <p className={styles.modalPrivacy}>We respect your privacy. Your email is never shared or sold.</p>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
