'use client'

import Link from 'next/link'
import Script from 'next/script'
import Header from '@/components/Header'
import styles from './page.module.css'

const contactOptions = [
  {
    title: 'General questions',
    description: 'Ask about the directory, taxpayer memberships, monitoring, eligibility, timelines, and what is included.',
    icon: (
      <svg className={styles.cardIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    /* TODO: Integrate Cal.com element-click embed — namespace: tax-monitor-service-intro */
    href: 'mailto:support@taxmonitor.pro?subject=General%20Question',
  },
  {
    title: 'Schedule a demo',
    description: 'See how taxpayer memberships, portal tools, reporting, and monitoring visibility work in practice.',
    icon: (
      <svg className={styles.cardIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    /* TODO: Integrate Cal.com element-click embed — namespace: demo */
    href: 'mailto:support@taxmonitor.pro?subject=Demo%20Request',
  },
  {
    title: 'Membership and onboarding',
    description: 'Start service, confirm fit, and get set up for taxpayer membership, monitoring access, or portal-based next steps.',
    icon: (
      <svg className={styles.cardIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    /* TODO: Integrate Cal.com element-click embed — namespace: tax-monitor-service-onboarding */
    href: 'mailto:support@taxmonitor.pro?subject=Membership%20%26%20Onboarding',
  },
  {
    title: 'Support and account changes',
    description: 'Use this for account updates, service changes, membership questions, transitions, or anything affecting your current setup.',
    icon: (
      <svg className={styles.cardIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    /* TODO: Integrate Cal.com element-click embed — namespace: tax-monitor-service-exit-offboarding */
    href: 'mailto:support@taxmonitor.pro?subject=Support%20%26%20Account%20Changes',
  },
]

const trustItems = [
  {
    title: 'Clearer taxpayer direction',
    description: 'We help taxpayers figure out whether they need a demo, support, membership access, or the right tax pro connection.',
  },
  {
    title: 'Monitoring-first visibility',
    description: 'TMP is built around earlier awareness, plain-language reporting, and better visibility into what may need attention.',
  },
  {
    title: 'Membership and portal access',
    description: 'Taxpayer memberships are designed to bring together monitoring, portal tools, perks, and ongoing usefulness beyond a one-time interaction.',
  },
  {
    title: 'Clear boundaries',
    description: 'Contacting TMP, booking a demo, or asking questions does not create IRS representation.',
  },
]

export default function ContactPage() {
  return (
    <>
      <Header variant="site" />

      <main>
        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <div className={styles.trustBadge}>
              <svg className={styles.trustIcon} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>We help taxpayers find the right tax pros and explore memberships with monitoring, perks, and clearer visibility. Contact does not create IRS representation.</span>
            </div>

            <h1 className={styles.headline}>Contact Tax Monitor Pro</h1>

            <p className={styles.subheadline}>
              Reach out to find the right tax pro, ask about taxpayer memberships, or see how monitoring, portal access, and member perks fit together.
            </p>

            <div className={styles.phoneWrap}>
              <a href="tel:+16198005457" className={styles.phoneNumber}>(619) 800-5457</a>
              <p className={styles.phoneSub}>Questions, demos, memberships, and service routing</p>
            </div>

            <div className={styles.heroCtas}>
              <button
                className={styles.btnPrimary}
                data-cal-link="tax-monitor-pro/tax-monitor-service-intro"
                data-cal-namespace="tax-monitor-service-intro"
                data-cal-config='{"layout":"month_view","useSlotsViewOnSmallScreen":"true"}'
              >Find Your Path</button>
              <button
                className={styles.btnSecondary}
                data-cal-link="tax-monitor-pro/tax-monitor-service-intro"
                data-cal-namespace="tax-monitor-service-intro"
                data-cal-config='{"layout":"month_view","useSlotsViewOnSmallScreen":"true"}'
              >Book a Demo</button>
            </div>

            <div className={styles.pillRow}>
              <a href="#contact-options" className={styles.pill}>Find a tax pro</a>
              <a href="#contact-options" className={styles.pill}>Membership questions</a>
              <a href="#contact-options" className={styles.pill}>Monitoring support</a>
            </div>
          </div>
        </section>

        <div className={styles.divider} />

        {/* Contact Options */}
        <section className={styles.section} id="contact-options">
          <div className={styles.sectionInner}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionHeading}>Choose the right way to connect</h2>
              <p className={styles.sectionSub}>
                Whether you are looking for a tax pro, membership details, monitoring access, or service support, start with the path that fits best.
              </p>
            </div>

            <div className={styles.optionsGrid}>
              {contactOptions.map((opt) => (
                <a key={opt.title} href={opt.href} className={styles.optionCard}>
                  <div className={styles.optionIconWrap}>{opt.icon}</div>
                  <div>
                    <div className={styles.optionTitle}>{opt.title}</div>
                    <div className={styles.optionDesc}>{opt.description}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        <div className={styles.divider} />

        {/* Choose Your Path */}
        <section className={styles.section}>
          <div className={styles.sectionInner}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionHeading}>Start with the path that fits</h2>
              <p className={styles.sectionSub}>
                Some people want a demo. Others need support, membership help, or the right tax pro. Start where it makes the most sense.
              </p>
            </div>

            <div className={styles.pathGrid}>
              <div className={styles.pathCard}>
                <div className={styles.pathIconWrap}>
                  <svg className={styles.pathIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className={styles.pathTitle}>Info, demos, and fit</h3>
                <p className={styles.pathDesc}>
                  Explore the directory, memberships, monitoring features, and whether Tax Monitor Pro fits what you need right now.
                </p>
                <button
                  className={styles.btnPrimary}
                  data-cal-link="tax-monitor-pro/tax-monitor-service-intro"
                  data-cal-namespace="tax-monitor-service-intro"
                  data-cal-config='{"layout":"month_view","useSlotsViewOnSmallScreen":"true"}'
                >Book a demo</button>
              </div>

              <div className={styles.pathCard}>
                <div className={styles.pathIconWrap}>
                  <svg className={styles.pathIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className={styles.pathTitle}>Support and account help</h3>
                <p className={styles.pathDesc}>
                  Use this path for membership questions, account changes, service updates, or support tied to your current relationship with TMP.
                </p>
                <button
                  className={styles.btnSecondaryFull}
                  data-cal-link="tax-monitor-pro/tax-monitor-service-support"
                  data-cal-namespace="tax-monitor-service-support"
                  data-cal-config='{"layout":"month_view","useSlotsViewOnSmallScreen":"true"}'
                >Contact support</button>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.divider} />

        {/* What Happens Next */}
        <section className={styles.section}>
          <div className={styles.sectionInner}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionHeading}>What happens after you reach out</h2>
              <p className={styles.sectionSub}>
                We keep the next steps simple so you know whether you are headed toward a demo, support path, membership setup, or a better-fit tax pro connection.
              </p>
            </div>

            <div className={styles.stepsGrid}>
              {[
                { step: 1, title: 'You choose a path', desc: 'Pick the option that matches your question, need, or current stage.' },
                { step: 2, title: 'We review the fit', desc: 'We review your request so it gets routed to the right conversation or support flow.' },
                { step: 3, title: 'We connect or respond', desc: 'You get the next step, whether that is a demo, guidance, onboarding, or support.' },
                { step: 4, title: 'You move forward clearly', desc: 'From there, you can move into the right relationship with more clarity and less guessing.' },
              ].map((s) => (
                <div key={s.step} className={styles.stepItem}>
                  <div className={styles.stepNumber}>{s.step}</div>
                  <h3 className={styles.stepTitle}>{s.title}</h3>
                  <p className={styles.stepDesc}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className={styles.divider} />

        {/* Trust & Clarity */}
        <section className={styles.trustSection}>
          <div className={styles.sectionInner}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionHeading}>What you can expect from TMP</h2>
              <p className={styles.sectionSub}>
                The contact experience should feel clear, useful, and aligned with how Tax Monitor Pro actually works.
              </p>
            </div>

            <div className={styles.trustGrid}>
              {trustItems.map((item) => (
                <div key={item.title} className={styles.trustCard}>
                  <div className={styles.trustCheck}>
                    <svg className={styles.checkIcon} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className={styles.trustTitle}>{item.title}</h3>
                    <p className={styles.trustDesc}>{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className={styles.divider} />

        {/* Final CTA */}
        <section className={styles.ctaSection}>
          <div className={styles.ctaInner}>
            <h2 className={styles.ctaHeadline}>Ready to find the <span className="gradient-text">right next step</span>?</h2>
            <p className={styles.ctaDesc}>
              Choose the path that fits and we will help route you toward the right tax pro, membership conversation, demo, or support flow.
            </p>
            <button
              className={styles.ctaButton}
              data-cal-link="tax-monitor-pro/tax-monitor-service-intro"
              data-cal-namespace="tax-monitor-service-intro"
              data-cal-config='{"layout":"month_view","useSlotsViewOnSmallScreen":"true"}'
            >Find Your Path &rarr;</button>
            <p className={styles.ctaDisclaimer}>
              Your inquiry stays private. Reaching out helps us guide you, but it does not create IRS representation or obligation.
            </p>
          </div>
        </section>
      </main>

      <Script id="cal-embed" strategy="afterInteractive">{`
  (function (C, A, L) { let p = function (a, ar) { a.q.push(ar); }; let d = C.document; C.Cal = C.Cal || function () { let cal = C.Cal; let ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; } if (ar[0] === L) { const api = function () { p(api, arguments); }; const namespace = ar[1]; api.q = api.q || []; if(typeof namespace === "string"){cal.ns[namespace] = cal.ns[namespace] || api;p(cal.ns[namespace], ar);p(cal, ["initNamespace", namespace]);} else p(cal, ar); return;} p(cal, ar); }; })(window, "https://app.cal.com/embed/embed.js", "init");

  Cal("init", "tax-monitor-service-intro", {origin:"https://app.cal.com"});
  Cal.ns["tax-monitor-service-intro"]("ui", {"cssVarsPerTheme":{"light":{"cal-brand":"#f59e0b"},"dark":{"cal-brand":"#f59e0b"}},"hideEventTypeDetails":false,"layout":"month_view"});

  Cal("init", "tax-monitor-service-support", {origin:"https://app.cal.com"});
  Cal.ns["tax-monitor-service-support"]("ui", {"cssVarsPerTheme":{"light":{"cal-brand":"#f59e0b"},"dark":{"cal-brand":"#f59e0b"}},"hideEventTypeDetails":false,"layout":"month_view"});
`}</Script>
    </>
  )
}
