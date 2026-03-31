import Link from 'next/link'
import SiteBackground from '@/components/SiteBackground'
import Header from '@/components/Header'
import styles from './page.module.css'

export default function HomePage() {
  return (
    <>
      <SiteBackground />
      <Header variant="site" />

      <main>
        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <div className={styles.heroContent}>
              <div className={styles.trustBadge}>
                <svg className={styles.trustIcon} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className={styles.trustText}>Monitoring-first tax support from professionals. Intake does not create IRS representation.</span>
              </div>

              <h1 className={styles.headline}>
                Real Heroes When <span className="gradient-text">Tax Trouble</span> Shows Up
              </h1>

              <p className={styles.subheadline}>
                Tax Monitor Pro helps people find monitoring-first tax professionals who stay watchful, explain what changed, and surface issues before they become expensive surprises.
              </p>

              <div className={styles.heroCtas}>
                <Link href="/inquiry" className={styles.ctaPrimary}>
                  Find Your Tax Pro &rarr;
                </Link>
                <Link href="#how-it-works" className={styles.ctaSecondary}>
                  See How Monitoring Works
                </Link>
              </div>

              <div className={styles.heroStats}>
                <div className={styles.statCard}>
                  <div className={styles.statMicro}>Lead story</div>
                  <div className={styles.statValue}>Monitoring first</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statMicro}>Built for</div>
                  <div className={styles.statValue}>Early awareness</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statMicro}>What users get</div>
                  <div className={styles.statValue}>Clear reports and alerts</div>
                </div>
              </div>
            </div>

            <div className={styles.heroVisual}>
              <div className={styles.heroGlow} />
              <div style={{ position: 'relative' }}>
                <div className={styles.heroScene}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://taxmonitor.pro/assets/images/super-hero-building-bg.svg"
                    alt="Modern office building representing the professional environment"
                    className={styles.heroBgArt}
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://taxmonitor.pro/assets/images/super-hero-man.svg"
                    alt="Tax professional in a superhero pose revealing a TMP emblem"
                    className={styles.heroManArt}
                  />
                  <div className={styles.heroFloorGlow} />
                </div>
                <p className={styles.heroCaption}>Offering more cape appeal with structured monitoring.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Problems */}
        <section className={styles.problemsSection}>
          <div className={styles.sectionInner}>
            <h2 className={styles.sectionTitle} style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <span style={{ display: 'block' }}>Problems Build Quietly.</span>
              <span className={styles.mutedBlock} style={{ display: 'block' }}>Monitoring Is How Tax Pros Fight Back.</span>
            </h2>

            <div className={styles.grid3}>
              <div className={styles.problemCard}>
                <div className={styles.problemIcon}>
                  <svg className={styles.problemIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className={styles.problemTitle}>Surprise Balances</h3>
                <p className={styles.problemDesc}>Unknown tax debts that have been accruing penalties and interest for months.</p>
              </div>

              <div className={styles.problemCard}>
                <div className={styles.problemIcon}>
                  <svg className={styles.problemIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className={styles.problemTitle}>Missed Deadlines</h3>
                <p className={styles.problemDesc}>Response windows that expire before you even know there&apos;s an issue.</p>
              </div>

              <div className={styles.problemCard}>
                <div className={styles.problemIcon}>
                  <svg className={styles.problemIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className={styles.problemTitle}>Lost Notices</h3>
                <p className={styles.problemDesc}>Critical IRS mail that went to the wrong address or got buried in the stack.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className={styles.featuresSection} id="features">
          <div className={styles.sectionInner}>
            <div className={styles.sectionCenter}>
              <h2 className={styles.sectionTitle}>What Tax Pros <span className="gradient-text">Do Here</span></h2>
              <p className={styles.sectionSubtitle}>They monitor, translate, alert, and keep people from learning about IRS trouble the hard way.</p>
            </div>

            <div className={styles.grid2}>
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>
                  <svg className={styles.featureIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className={styles.featureTitle}>Continuous Monitoring</h3>
                  <p className={styles.featureDesc}>Your IRS account transcripts checked regularly for any changes or new activity.</p>
                </div>
              </div>

              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>
                  <svg className={styles.featureIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className={styles.featureTitle}>Plain-Language Reports</h3>
                  <p className={styles.featureDesc}>No IRS jargon. Clear explanations of what changed and what it means for you.</p>
                </div>
              </div>

              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>
                  <svg className={styles.featureIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0018 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div>
                  <h3 className={styles.featureTitle}>Early Alert System</h3>
                  <p className={styles.featureDesc}>Get notified when something needs attention before penalties compound.</p>
                </div>
              </div>

              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>
                  <svg className={styles.featureIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h3 className={styles.featureTitle}>Secure Portal Access</h3>
                  <p className={styles.featureDesc}>Your transcripts and reports available 24/7 in a private, encrypted dashboard.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Who this helps */}
        <section className={styles.whoSection}>
          <div className={styles.sectionInner}>
            <div className={styles.sectionCenter}>
              <h2 className={styles.sectionTitle}>Who This Helps <span className="gradient-text">Most</span></h2>
              <p className={styles.sectionSubtitle}>Not everyone needs monitoring. The people below usually do, which is why the right tax pro matters.</p>
            </div>

            <div className={styles.grid2}>
              <div className={styles.whoCard}>
                <div className={styles.whoCardHeader}>
                  <div className={styles.whoIcon}>
                    <svg className={styles.whoIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21h18M5 21V8l7-5 7 5v13M9 14h6M9 18h6" />
                    </svg>
                  </div>
                  <h3 className={styles.whoTitle}>Business Owners</h3>
                </div>
                <p className={styles.whoDesc}>People running companies usually do not have time to decode IRS drift, notice patterns, or transcript movement.</p>
              </div>

              <div className={styles.whoCard}>
                <div className={styles.whoCardHeader}>
                  <div className={styles.whoIcon}>
                    <svg className={styles.whoIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3v18h18M7 15l3-3 3 2 4-6" />
                    </svg>
                  </div>
                  <h3 className={styles.whoTitle}>High-Income Earners</h3>
                </div>
                <p className={styles.whoDesc}>More complexity usually means more room for mismatch, scrutiny, and ugly surprises nobody ordered.</p>
              </div>

              <div className={styles.whoCard}>
                <div className={styles.whoCardHeader}>
                  <div className={styles.whoIcon}>
                    <svg className={styles.whoIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h10" />
                    </svg>
                  </div>
                  <h3 className={styles.whoTitle}>Past IRS Issues</h3>
                </div>
                <p className={styles.whoDesc}>If a notice, audit, balance, or filing issue already happened once, monitoring becomes a smart habit, not paranoia.</p>
              </div>

              <div className={styles.whoCard}>
                <div className={styles.whoCardHeader}>
                  <div className={styles.whoIcon}>
                    <svg className={styles.whoIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M6 15l3-3 2 2 4-5 3 2M5 19h14" />
                    </svg>
                  </div>
                  <h3 className={styles.whoTitle}>Frequent Travelers</h3>
                </div>
                <p className={styles.whoDesc}>When life keeps you moving, a monitoring-first tax pro helps keep important IRS movement from slipping past you.</p>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className={styles.howSection} id="how-it-works">
          <div className={styles.sectionInner}>
            <div className={styles.sectionCenter}>
              <h2 className={styles.sectionTitle}>How The Hero Part <span className="gradient-text">Actually Works</span></h2>
              <p className={styles.sectionSubtitle}>More cape appeal, backed by structured monitoring.</p>
            </div>

            <div className={styles.steps}>
              <div className={styles.stepItem}>
                <div className={styles.stepNumber}>1</div>
                <div className={styles.stepContent}>
                  <h3 className={styles.stepTitle}>Complete Intake</h3>
                  <p className={styles.stepDesc}>Quick questionnaire to gather the information needed to access your IRS records securely.</p>
                </div>
              </div>
              <div className={styles.stepConnector} />

              <div className={styles.stepItem}>
                <div className={styles.stepNumber}>2</div>
                <div className={styles.stepContent}>
                  <h3 className={styles.stepTitle}>Initial Transcript Pull</h3>
                  <p className={styles.stepDesc}>We retrieve your complete IRS account history and establish your baseline status.</p>
                </div>
              </div>
              <div className={styles.stepConnector} />

              <div className={styles.stepItem}>
                <div className={styles.stepNumber}>3</div>
                <div className={styles.stepContent}>
                  <h3 className={styles.stepTitle}>Ongoing Monitoring</h3>
                  <p className={styles.stepDesc}>Regular transcript checks catch any changes, new filings, or IRS actions.</p>
                </div>
              </div>
              <div className={styles.stepConnector} />

              <div className={styles.stepItem}>
                <div className={styles.stepNumber}>4</div>
                <div className={styles.stepContent}>
                  <h3 className={styles.stepTitle}>Clear Reporting</h3>
                  <p className={styles.stepDesc}>Receive plain-language summaries and alerts when action is needed.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Transcript sample */}
        <section className={styles.transcriptSection} id="transcript-sample">
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <div className={styles.sectionCenter}>
              <h2 className={styles.sectionTitle}>Transcript <span className="gradient-text">Sample</span></h2>
              <p className={styles.sectionSubtitle}>A transcript is readable once you know what to look for. Tax Monitor translates it.</p>
            </div>

            <div className={styles.transcriptGrid}>
              {/* Raw transcript */}
              <div className={styles.transcriptRaw}>
                <div className={styles.transcriptHeader}>
                  <div className={styles.transcriptHeaderLabel}>Raw IRS Transcript (sample)</div>
                  <div className={styles.transcriptHeaderMeta}>Example codes</div>
                </div>
                <div className={styles.transcriptBody}>
                  <div className={styles.transcriptDivider}>--- ACCOUNT TRANSCRIPT ---</div>
                  <div className={styles.codeGrid}>
                    <div className={styles.codeHeader}>CODE</div>
                    <div className={styles.codeHeader}>DESCRIPTION</div>
                    <div className={styles.codeHeader}>DATE</div>
                    <div className={`${styles.codeHeader} ${styles.textRight}`}>AMOUNT</div>

                    <div className={styles.codeValue}>150</div><div className={styles.codeValue}>Return Filed</div><div className={styles.codeValue}>04-18-2024</div><div className={`${styles.codeValue} ${styles.textRight}`}>5,703</div>
                    <div className={styles.codeValue}>806</div><div className={styles.codeValue}>W-2 Withholding</div><div className={styles.codeValue}>04-15-2024</div><div className={`${styles.codeGreen} ${styles.textRight}`}>-$12,456</div>
                    <div className={styles.codeValue}>766</div><div className={styles.codeValue}>Account Credit</div><div className={styles.codeValue}>04-15-2024</div><div className={`${styles.codeGreen} ${styles.textRight}`}>-$3,247</div>
                    <div className={styles.codeAmber}>570</div><div style={{ color: '#fde68a' }}>Account Hold</div><div className={styles.codeValue}>06-15-2024</div><div className={`${styles.codeValue} ${styles.textRight}`}>$0.00</div>
                    <div className={styles.codeRed}>971</div><div style={{ color: '#fecaca' }}>Notice Issued</div><div className={styles.codeValue}>06-22-2024</div><div className={`${styles.codeValue} ${styles.textRight}`}>$0.00</div>
                  </div>
                  <div className={styles.codeSample}>Sample for demo.</div>
                </div>
              </div>

              {/* Summary */}
              <div className={styles.transcriptSummary}>
                <div className={`${styles.transcriptHeader} ${styles.transcriptHeaderAmber}`}>
                  <div className={styles.transcriptHeaderLabelAmber}>Tax Monitor Summary</div>
                  <div className={styles.transcriptHeaderMeta}>Plain English</div>
                </div>
                <div className={styles.summaryBody}>
                  <div className={styles.summaryItem}>
                    <div className={styles.summaryIcon}>
                      <svg className={styles.summaryIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
                      </svg>
                    </div>
                    <div>
                      <div className={styles.summaryTitle}>What changed</div>
                      <p className={styles.summaryText}>A hold appeared, then a notice. Pattern suggests IRS verification or mismatch.</p>
                    </div>
                  </div>

                  <div className={styles.summaryItem}>
                    <div className={styles.summaryIcon}>
                      <svg className={styles.summaryIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className={styles.summaryTitle}>What it means</div>
                      <ul className={styles.summaryList}>
                        <li>Wage/income verification needed</li>
                        <li>Notice was generated</li>
                        <li>Action may be required</li>
                      </ul>
                    </div>
                  </div>

                  <div className={styles.summaryItem}>
                    <div className={styles.summaryIcon}>
                      <svg className={styles.summaryIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className={styles.summaryTitle}>Next step</div>
                      <p className={styles.summaryText}>Monitor for notice details and confirm response deadline. Tax Monitor flags this early.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Inside your portal */}
        <section className={styles.portalSection} id="inside-portal">
          <div className={styles.sectionInner}>
            <div className={styles.sectionCenter}>
              <h2 className={styles.sectionTitle}>Inside Your <span className="gradient-text">Portal</span></h2>
              <p className={styles.sectionSubtitle}>Member access built around monitoring, tools, and savings.</p>
            </div>

            <div className={styles.grid3}>
              <div className={styles.portalCard}>
                <div className={styles.portalIcon}>
                  <svg className={styles.portalIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6M7 4h10a2 2 0 012 2v14l-5-3-5 3V6a2 2 0 012-2z" />
                  </svg>
                </div>
                <h3 className={styles.portalTitle}>Transcript Monitoring Tokens</h3>
                <p className={styles.portalDesc}>Use member tokens to access transcript monitoring inside your portal.</p>
              </div>

              <div className={styles.portalCard}>
                <div className={styles.portalIcon}>
                  <svg className={styles.portalIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M4 6h16M4 10h16M4 14h10" />
                  </svg>
                </div>
                <h3 className={styles.portalTitle}>Tax Tools Arcade Tokens</h3>
                <p className={styles.portalDesc}>Unlock Tax Tools Arcade access tokens directly from your member portal.</p>
              </div>

              <div className={styles.portalCard}>
                <div className={styles.portalIcon}>
                  <svg className={styles.portalIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5V4H2v16h5m10 0v-6a4 4 0 00-8 0v6m8 0H9" />
                  </svg>
                </div>
                <h3 className={styles.portalTitle}>Member Discount Access</h3>
                <p className={styles.portalDesc}>Connect with professionals offering discounts available to portal members.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Report sample */}
        <section className={styles.reportSection} id="report-sample">
          <div className={styles.sectionInnerWide}>
            <div className={styles.sectionCenter}>
              <h2 className={styles.sectionTitle}>Report <span className="gradient-text">Sample</span></h2>
              <p className={styles.sectionSubtitle}>This is what your monitoring buys: a clean story of what the IRS shows, what changed, and what happens next.</p>
            </div>

            <div className={styles.reportGrid}>
              <div className={styles.reportMain}>
                <div className={styles.reportHeader}>
                  <div className={styles.reportHeaderLeft}>
                    <div className={styles.reportLogo}>
                      <svg className={styles.reportLogoSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className={styles.reportMeta}>Monthly Status Report</div>
                      <div className={styles.reportTitle}>December 2024 Monitoring Summary</div>
                      <div className={styles.reportDate}>Updated after transcript review</div>
                    </div>
                  </div>
                  <div>
                    <div className={styles.statusBadge}>
                      <span className={styles.statusDot} />
                      All Clear
                    </div>
                  </div>
                </div>

                <div className={styles.reportStats}>
                  <div className={styles.statGrid3}>
                    <div className={styles.reportStatCard}>
                      <div className={styles.reportStatLabel}>Balance</div>
                      <div className={`${styles.reportStatValue} ${styles.reportStatValueGreen}`}>$0</div>
                      <div className={styles.reportStatHint}>Total IRS Balance</div>
                    </div>
                    <div className={styles.reportStatCard}>
                      <div className={styles.reportStatLabel}>Notices</div>
                      <div className={styles.reportStatValue}>0</div>
                      <div className={styles.reportStatHint}>IRS Notice Received</div>
                    </div>
                    <div className={styles.reportStatCard}>
                      <div className={styles.reportStatLabel}>Readiness</div>
                      <div className={styles.reportStatValue}>Stable</div>
                      <div className={styles.reportStatHint}>Resolution Readiness Status</div>
                    </div>
                  </div>
                </div>

                <div className={styles.reportBody}>
                  <div className={styles.reportDetails}>
                    <div className={styles.reportDetailCard}>
                      <div className={styles.reportStatLabel}>IRS Account Status</div>
                      <div style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text)', marginTop: '0.25rem' }}>Current</div>
                    </div>
                    <div className={styles.reportDetailCard}>
                      <div className={styles.reportStatLabel}>Unfiled Returns</div>
                      <div style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text)', marginTop: '0.25rem' }}>No</div>
                    </div>
                  </div>

                  <div className={styles.balanceCard}>
                    <div className={styles.yearGridHeader}>
                      <div>
                        <div className={styles.yearGridLabel}>Balance by year</div>
                        <div className={styles.yearGridHint}>10-year visibility summary</div>
                      </div>
                      <span className={styles.yearGridSpan}>2016 &ndash; 2025</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div className={styles.yearRow}>
                        {['2016','2017','2018','2019','2020'].map(y => (
                          <div key={y} className={styles.yearCell}>
                            <span className={styles.yearCellLabel}>{y}</span>
                            <div className={`${styles.yearCellValue} ${styles.yearCellGreen}`}>$0</div>
                          </div>
                        ))}
                      </div>
                      <div className={styles.yearRow}>
                        {['2021','2022','2023'].map(y => (
                          <div key={y} className={styles.yearCell}>
                            <span className={styles.yearCellLabel}>{y}</span>
                            <div className={`${styles.yearCellValue} ${styles.yearCellGreen}`}>$0</div>
                          </div>
                        ))}
                        <div className={styles.yearCell}>
                          <span className={styles.yearCellLabel}>2024</span>
                          <div className={`${styles.yearCellValue} ${styles.yearCellAmber}`}>Filing</div>
                        </div>
                        <div className={styles.yearCell}>
                          <span className={styles.yearCellLabel}>2025</span>
                          <div className={`${styles.yearCellValue} ${styles.yearCellMuted}`}>TBD</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <aside className={styles.reportAside}>
                <div className={styles.asideCard}>
                  <div className={styles.asideMeta}>Why this matters</div>
                  <div className={styles.asideTitle}>Less guessing, more certainty</div>
                  <p className={styles.asideDesc}>You get a simple, organized snapshot of what the IRS shows right now, what changed, and what needs attention. No decoding. No hunting for old PDFs.</p>
                  <div className={styles.asideBox}>
                    <div className={styles.asideBoxLabel}>The moment this helps</div>
                    <div className={styles.asideBoxText}>When a letter shows up, you can open your portal to see what it means or upload it for professional insight and guidance on what to do next.</div>
                  </div>
                </div>

                <div className={`${styles.asideCard} ${styles.asideCardAmber}`}>
                  <div className={styles.asideAmberHeader}>
                    <div>
                      <div className={styles.asideMetaAmber}>Interactive demo</div>
                      <div className={styles.asideTitle}>Click tabs, see the story</div>
                    </div>
                    <div className={styles.asideAmberIcon}>
                      <svg className={styles.asideAmberIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  </div>
                  <p className={styles.asideDesc}>Click the years and see how the story changes: balances, notices, filing status, and the last time your account was reviewed.</p>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className={styles.ctaSection} id="conversion-cta">
          <div className={styles.ctaInner}>
            <h2 className={styles.ctaHeadline}>Find The Tax Pro Who <span className="gradient-text">Watches Before Trouble Lands</span></h2>
            <p className={styles.ctaDesc}>Tax Monitor Pro is the discovery layer for monitoring-first professionals. The broader directory can still filter other services, but this page should lead with monitoring.</p>
            <Link href="/inquiry" className={styles.ctaButton}>
              Start Intake &rarr;
            </Link>
            <p className={styles.ctaDisclaimer}>No IRS representation created by intake. No obligation until you sign.</p>
          </div>
        </section>
      </main>

    </>
  )
}
