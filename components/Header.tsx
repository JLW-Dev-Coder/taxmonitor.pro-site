'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import styles from './Header.module.css'

interface Session {
  account_id: string
  email: string
  membership: string
}

export default function Header({
  variant = 'site',
}: {
  variant?: 'site' | 'app'
}) {
  const [session, setSession] = useState<Session | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [resourcesOpen, setResourcesOpen] = useState(false)
  const [mobileResourcesOpen, setMobileResourcesOpen] = useState(false)

  useEffect(() => {
    api
      .getSession()
      .then((res) => {
        if (res.ok && res.session) setSession(res.session)
      })
      .catch(() => {})
  }, [])

  const closeAll = useCallback(() => {
    setMobileOpen(false)
    setResourcesOpen(false)
    setMobileResourcesOpen(false)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAll()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [closeAll])

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        {/* Logo */}
        <Link href="/" className={styles.logoLink}>
          <span className={styles.logoChip}>TM</span>
          <div className={styles.logoText}>
            <span className={styles.logoTitle}>Tax Monitor Pro</span>
            <span className={styles.logoSub}>Proactive tax monitoring</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className={styles.desktopNav}>
          {variant === 'site' ? (
            <>
              <nav className={styles.navLinks}>
                <Link href="/about" className={styles.navLink}>About</Link>
                <Link href="/directory" className={styles.navLink}>Directory</Link>
                <Link href="/#features" className={styles.navLink}>Features</Link>
                <Link href="/#how-it-works" className={styles.navLink}>How It Works</Link>
                <Link href="/pricing" className={styles.navLink}>Pricing</Link>
                <Link href="/contact" className={styles.navLink}>Contact</Link>

                {/* Resources dropdown */}
                <div className={styles.resourcesWrap}>
                  <button
                    type="button"
                    className={styles.resourcesToggle}
                    onClick={() => setResourcesOpen(!resourcesOpen)}
                    aria-expanded={resourcesOpen}
                  >
                    Resources
                    <svg
                      className={`${styles.chevron} ${resourcesOpen ? styles.chevronOpen : ''}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <div className={`${styles.resourcesMenu} ${resourcesOpen ? styles.resourcesMenuOpen : ''}`}>
                    <div className={styles.menuGrid}>
                      {/* Discover */}
                      <div className={styles.menuSection}>
                        <div className={styles.menuSectionLabel}>Discover</div>
                        <div className={styles.menuSectionItems}>
                          <Link href="/about" className={styles.menuItem} onClick={closeAll}>
                            <div>
                              <div className={styles.menuItemTitle}>About</div>
                              <div className={styles.menuItemDesc}>Why Tax Monitor Pro exists</div>
                            </div>
                            <span className={styles.menuItemArrow}>&rarr;</span>
                          </Link>
                          <Link href="/contact" className={styles.menuItem} onClick={closeAll}>
                            <div>
                              <div className={styles.menuItemTitle}>Contact</div>
                              <div className={styles.menuItemDesc}>Talk to our team or start intake</div>
                            </div>
                            <span className={styles.menuItemArrow}>&rarr;</span>
                          </Link>
                          <Link href="/resources/transcript-central" className={styles.menuItem} onClick={closeAll}>
                            <div>
                              <div className={styles.menuItemTitle}>Transcript Central</div>
                              <div className={styles.menuItemDesc}>Video series, e-book, and support paths</div>
                            </div>
                            <span className={styles.menuItemArrow}>&rarr;</span>
                          </Link>
                        </div>
                      </div>

                      {/* Learn */}
                      <div className={styles.menuSection}>
                        <div className={styles.menuSectionLabel}>Learn</div>
                        <div className={styles.menuSectionItems}>
                          <Link href="/#features" className={styles.menuSimpleLink} onClick={closeAll}>Features</Link>
                          <Link href="/#how-it-works" className={styles.menuSimpleLink} onClick={closeAll}>How It Works</Link>
                          <Link href="/pricing" className={styles.menuSimpleLink} onClick={closeAll}>Pricing</Link>
                          <a href="https://transcript.taxmonitor.pro/resources/how-to-read-irs-transcripts" target="_blank" rel="noopener" className={styles.menuSimpleLink}>How to Read IRS Transcripts</a>
                          <a href="https://transcript.taxmonitor.pro/resources/transcript-types" target="_blank" rel="noopener" className={styles.menuSimpleLink}>Transcript Types</a>
                        </div>
                      </div>

                      {/* Tools & extras */}
                      <div className={styles.menuSection}>
                        <div className={styles.menuSectionLabel}>Tools &amp; extras</div>
                        <div className={styles.menuSectionItems}>
                          <Link href="/tools/irs-payment-calculator" className={styles.menuSimpleLink} onClick={closeAll}>IRS Payment Strategy Calculator</Link>
                          <a href="https://transcript.taxmonitor.pro/resources/transcript-codes" target="_blank" rel="noopener" className={styles.menuSimpleLink}>Transcript Codes Database</a>
                          <a href="https://transcript.taxmonitor.pro/resources/transcript-orders" target="_blank" rel="noopener" className={styles.menuSimpleLink}>Order Walkthrough</a>
                          <a href="https://transcript.taxmonitor.pro" target="_blank" rel="noopener" className={styles.menuSimpleLink}>Transcript Automation</a>
                          <a href="https://taxtools.taxmonitor.pro" target="_blank" rel="noopener" className={styles.menuSimpleLink}>TaxTools Arcade</a>
                        </div>
                        <div className={styles.menuCta}>
                          <div className={styles.menuCtaText}>Need human review before a transcript issue becomes a client fire drill?</div>
                          <div className={styles.menuCtaActions}>
                            <Link href="/contact#contact-options" className={styles.menuCtaPrimary} onClick={closeAll}>Start Intake &rarr;</Link>
                            <Link href="/sign-in" className={styles.menuCtaSecondary} onClick={closeAll}>Log In</Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </nav>

              <div className={styles.divider} />

              <div className={styles.actions}>
                {session ? (
                  <Link href="/dashboard" className={styles.loginLink}>Dashboard</Link>
                ) : (
                  <Link href="/sign-in" className={styles.loginLink}>Log In</Link>
                )}
                <Link href="/inquiry" className={styles.ctaButton}>
                  Start Intake &rarr;
                </Link>
              </div>
            </>
          ) : (
            <>
              <nav className={styles.navLinks}>
                <Link href="/dashboard" className={styles.navLink}>Dashboard</Link>
                <Link href="/calendar" className={styles.navLink}>Calendar</Link>
                <Link href="/messages" className={styles.navLink}>Messages</Link>
              </nav>

              <div className={styles.divider} />

              <div className={styles.actions}>
                {session && (
                  <span className={styles.userBadge}>{session.membership}</span>
                )}
                <button type="button" className={styles.bellButton} aria-label="Notifications">
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0018 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </button>
                <Link href="/dashboard" className={styles.loginLink}>Account</Link>
              </div>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          className={styles.mobileToggle}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-expanded={mobileOpen}
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      <div className={`${styles.mobileMenu} ${mobileOpen ? styles.mobileMenuOpen : ''}`}>
        {variant === 'site' ? (
          <>
            <Link href="/about" className={styles.mobileNavLink} onClick={closeAll}>About</Link>
            <Link href="/directory" className={styles.mobileNavLink} onClick={closeAll}>Directory</Link>
            <Link href="/#features" className={styles.mobileNavLink} onClick={closeAll}>Features</Link>
            <Link href="/#how-it-works" className={styles.mobileNavLink} onClick={closeAll}>How It Works</Link>
            <Link href="/pricing" className={styles.mobileNavLink} onClick={closeAll}>Pricing</Link>
            <Link href="/contact" className={styles.mobileNavLink} onClick={closeAll}>Contact</Link>

            <button
              type="button"
              className={styles.mobileResourcesToggle}
              onClick={() => setMobileResourcesOpen(!mobileResourcesOpen)}
              aria-expanded={mobileResourcesOpen}
            >
              <span>Resources</span>
              <svg
                className={`${styles.chevron} ${mobileResourcesOpen ? styles.chevronOpen : ''}`}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {mobileResourcesOpen && (
              <div className={styles.mobileResourcesList}>
                <Link href="/about" className={styles.mobileResourceLink} onClick={closeAll}>About</Link>
                <Link href="/tools/irs-payment-calculator" className={styles.mobileResourceLink} onClick={closeAll}>IRS Payment Strategy Calculator</Link>
                <a href="https://transcript.taxmonitor.pro/resources/how-to-read-irs-transcripts" target="_blank" rel="noopener" className={styles.mobileResourceLink}>How to Read IRS Transcripts</a>
                <Link href="/resources/transcript-central" className={styles.mobileResourceLink} onClick={closeAll}>Transcript Central</Link>
                <a href="https://transcript.taxmonitor.pro/resources/transcript-codes" target="_blank" rel="noopener" className={styles.mobileResourceLink}>Transcript Codes Database</a>
                <a href="https://transcript.taxmonitor.pro/resources/transcript-orders" target="_blank" rel="noopener" className={styles.mobileResourceLink}>Order Walkthrough</a>
                <a href="https://taxtools.taxmonitor.pro" target="_blank" rel="noopener" className={styles.mobileResourceLink}>TaxTools Arcade</a>
                <a href="https://transcript.taxmonitor.pro" target="_blank" rel="noopener" className={styles.mobileResourceLink}>Transcript Automation</a>
                <a href="https://transcript.taxmonitor.pro/resources/transcript-types" target="_blank" rel="noopener" className={styles.mobileResourceLink}>Transcript Types</a>
              </div>
            )}

            {session ? (
              <Link href="/dashboard" className={styles.mobileNavLink} onClick={closeAll}>Dashboard</Link>
            ) : (
              <Link href="/sign-in" className={styles.mobileNavLink} onClick={closeAll}>Log In</Link>
            )}

            <div className={styles.mobileCta}>
              <Link href="/inquiry" className={styles.mobileCtaButton} onClick={closeAll}>
                Start Intake &rarr;
              </Link>
            </div>
          </>
        ) : (
          <>
            <Link href="/dashboard" className={styles.mobileNavLink} onClick={closeAll}>Dashboard</Link>
            <Link href="/calendar" className={styles.mobileNavLink} onClick={closeAll}>Calendar</Link>
            <Link href="/messages" className={styles.mobileNavLink} onClick={closeAll}>Messages</Link>
            <Link href="/support" className={styles.mobileNavLink} onClick={closeAll}>Support</Link>
          </>
        )}
      </div>
    </header>
  )
}
