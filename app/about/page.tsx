'use client'

import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/Header'
import styles from './page.module.css'

const redditCards = [
  {
    subreddit: 'r/IRS',
    topic: 'No transcript updates',
    quote: 'When transcripts sit still, taxpayers are left guessing whether the silence means delay, review, or an issue building in the background.',
    why: 'Membership gives people ongoing visibility instead of a one-time look and a shrug.',
    href: 'https://www.reddit.com/r/IRS/comments/1r76xr4/everyones_reaction_to_seeing_no_updates_on_the/',
    color: 'amber' as const,
  },
  {
    subreddit: 'r/IRS',
    topic: 'Identity verification limbo',
    quote: 'Verification issues create long stretches of uncertainty, and most taxpayers do not know what changed or what happens next.',
    why: 'Members get clearer reporting and earlier context when transcript status shifts.',
    href: 'https://www.reddit.com/r/IRS/comments/1rmejlo/my_irs_identity_verification_timeline_wmr_never/',
    color: 'orange' as const,
  },
  {
    subreddit: 'r/tax',
    topic: 'Delay post explainer',
    quote: 'Manual review and special handling can stretch for months, which is exactly when taxpayers stop feeling informed and start feeling stuck.',
    why: 'The membership model is built for ongoing awareness, not just crisis entry.',
    href: 'https://www.reddit.com/r/tax/comments/1physc6/why_youre_seeing_so_many_irs_delay_posts_lately/',
    color: 'slate' as const,
  },
  {
    subreddit: 'r/IRS',
    topic: 'Transcript code confusion',
    quote: 'A code shows up before the full story arrives, and taxpayers are left trying to decode risk from fragments.',
    why: 'Members get plain-language summaries instead of code-chasing across the internet like civilized society gave up.',
    href: 'https://www.reddit.com/r/IRS/comments/1r7kevw/cp_0012_code_on_transcripts_any_estimate_of_how/',
    color: 'amber' as const,
  },
  {
    subreddit: 'r/IRS',
    topic: 'Notice disappeared online',
    quote: 'When portal messages appear or disappear without explanation, people assume the best or the worst and usually have no basis for either.',
    why: 'We designed membership access around clarity, not panic-refreshing and guesswork.',
    href: 'https://www.reddit.com/r/IRS/comments/1r9y0x3/identity_verification_notice_disappeared_from_the/',
    color: 'orange' as const,
  },
  {
    subreddit: 'r/IRS',
    topic: '4883C verification delay',
    quote: 'A taxpayer verifies identity, transcripts finally populate, and then new hold codes still leave them stuck wondering what changed.',
    why: 'Monitoring plus plain-language updates helps members understand the sequence instead of guessing after every status change.',
    href: 'https://www.reddit.com/r/IRS/comments/1rqfcb7/filed_120_verified_identity_217_4883c_transcript/',
    color: 'orange' as const,
  },
]

const avatarColors: Record<string, string> = {
  amber: 'avatarAmber',
  orange: 'avatarOrange',
  slate: 'avatarSlate',
}

export default function AboutPage() {
  return (
    <>
      <Header variant="site" />

      <main>
        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <div className={styles.trustBadge}>
              <svg className={styles.trustIcon} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>We help taxpayers find the right tax pros and access memberships with monitoring, perks, and clearer visibility. Intake does not create IRS representation.</span>
            </div>

            <h1 className={styles.headline}>
              Find <span className={styles.accentText}>tax pros</span> and smarter tax visibility
            </h1>

            <p className={styles.subheadline}>
              Tax Monitor Pro is a discovery layer for taxpayers who need the right tax professional, plus access to taxpayer memberships with transcript monitoring, plain-language reports, portal tools, and member perks.
            </p>

            <div className={styles.heroCtas}>
              <Link href="/inquiry" className={styles.btnPrimary}>Start Intake</Link>
              <Link href="/contact" className={styles.btnSecondary}>Book a Demo</Link>
            </div>
          </div>
        </section>

        <div className={styles.divider} />

        {/* Mission */}
        <section className={styles.mission}>
          <div className={styles.missionInner}>
            <div className={styles.missionGrid}>
              {/* Founder card */}
              <div className={styles.founderCard}>
                <div className={styles.founderContent}>
                  <div className={styles.founderAvatar}>
                    <Image
                      src="/images/jamie-williams.png"
                      alt="Jamie L. Williams"
                      width={112}
                      height={112}
                      className={styles.founderImg}
                    />
                  </div>
                  <p className={styles.founderName}>Jamie L. Williams</p>
                  <p className={styles.founderRole}>Founder • Systems builder</p>
                </div>
                <div className={styles.founderBadgeWrap}>
                  <span className={styles.founderBadge}>
                    <svg className={styles.founderBadgeIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Built by JLW for the taxpayer membership model
                  </span>
                </div>
              </div>

              {/* Mission text */}
              <div>
                <span className={styles.missionLabel}>
                  <svg className={styles.missionLabelIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Our mission
                </span>
                <h2 className={styles.missionHeading}>Make it easier for taxpayers to find the right help before problems grow</h2>
                <p className={styles.missionText}>
                  Tax Monitor Pro exists to help taxpayers do two things better: find tax professionals who fit their needs through a directory, and access taxpayer memberships that add ongoing value through monitoring, reports, tools, discounts, and clearer awareness. The point is not just finding help once. It is staying better informed over time.
                </p>
                <div className={styles.statGrid}>
                  <div className={styles.statBox}>
                    <p className={styles.statValue}>Directory</p>
                    <p className={styles.statLabel}>Find tax pros by fit and need</p>
                  </div>
                  <div className={styles.statBox}>
                    <p className={styles.statValue}>Memberships</p>
                    <p className={styles.statLabel}>Perks, monitoring, and portal access</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.divider} />

        {/* Real Voices */}
        <section className={styles.voices}>
          <div className={styles.voicesInner}>
            <div className={styles.voicesHeader}>
              <span className={styles.voicesLabel}>
                <svg className={styles.redditIcon} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701z" />
                </svg>
                Real voices
              </span>
              <h2 className={styles.voicesHeading}>Why the directory plus membership model matters</h2>
              <p className={styles.voicesSubtext}>
                Some taxpayers need a tax pro right now. Others also need continuing access, better explanations, transcript visibility, discounts, or tools that make staying organized easier. That is why Tax Monitor Pro brings the directory and the taxpayer membership model together.
              </p>
            </div>

            <div className={styles.cardGrid}>
              {redditCards.map((card) => (
                <a
                  key={card.href}
                  className={styles.redditCard}
                  href={card.href}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <div className={styles.redditCardHeader}>
                    <div className={`${styles.redditAvatar} ${styles[avatarColors[card.color]]}`}>R</div>
                    <div>
                      <p className={styles.redditSub}>{card.subreddit}</p>
                      <p className={styles.redditTopic}>{card.topic}</p>
                    </div>
                  </div>
                  <p className={styles.redditQuote}>{card.quote}</p>
                  <div className={styles.redditFooter}>
                    <p className={styles.redditWhyLabel}>Why it maps to Tax Monitor Pro</p>
                    <p className={styles.redditWhyText}>{card.why}</p>
                  </div>
                </a>
              ))}
            </div>

            <div className={styles.voicesCallout}>
              <div className={styles.calloutIcon}>
                <svg className={styles.calloutSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <p className={styles.calloutText}>
                We moved beyond the old positioning because taxpayers often need both: the right tax pro and a membership experience that keeps delivering value after the first step.
              </p>
            </div>
          </div>
        </section>

        <div className={styles.divider} />

        {/* Final CTA */}
        <section className={styles.cta}>
          <div className={styles.ctaInner}>
            <div className={styles.trustBadge}>
              <svg className={styles.trustIcon} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Tax Monitor Pro • Directory + taxpayer memberships
            </div>
            <h2 className={styles.ctaHeading}>Find the right tax pro and explore memberships with ongoing perks</h2>
            <p className={styles.ctaText}>
              Start intake or book a demo to see how the directory, memberships, monitoring access, and member benefits fit together.
            </p>
            <div className={styles.heroCtas}>
              <Link href="/inquiry" className={styles.btnPrimary}>Start Intake</Link>
              <Link href="/contact" className={styles.btnSecondary}>Book a Demo</Link>
            </div>
            <p className={styles.ctaDisclaimer}>
              Tax pro directory • Taxpayer memberships with perks • Monitoring-first access • Contact does not create IRS representation
            </p>
          </div>
        </section>
      </main>

    </>
  )
}
