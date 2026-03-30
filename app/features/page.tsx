'use client'

import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { PLANS_I } from '@/lib/plans'
import styles from './page.module.css'

const planMeta: Record<string, { bestFor: string; badge: string }> = {
  Free: { bestFor: 'Best for exploring', badge: 'Entry' },
  Essential: { bestFor: 'Best for light use', badge: 'Core' },
  Plus: { bestFor: 'For active members', badge: 'Most popular' },
  Premier: { bestFor: 'For deeper needs', badge: 'Advanced' },
}

const planHighlights: Record<string, string[]> = {
  Free: [
    'App dashboard access',
    'Professional directory browsing',
    'Saved matches and professionals',
    'Upgrade anytime',
  ],
  Essential: [
    '2 transcript tokens / month',
    '5 tax tool tokens / month',
    'Professional matching and inquiry access',
    'Discount notifications from professionals',
  ],
  Plus: [
    '5 transcript tokens / month',
    '15 tax tool tokens / month',
    'Saved results and activity history',
    'Professional matching',
  ],
  Premier: [
    '10 transcript tokens / month',
    '40 tax tool tokens / month',
    'Priority professional matching',
    'Monitoring records in dashboard',
  ],
}

const planDescriptions: Record<string, string> = {
  Free: 'Start with dashboard access and professional browsing before committing to a paid membership.',
  Essential: 'Entry-level access for taxpayers who want matching, light transcript usage, and basic tax tool support.',
  Plus: 'Balanced access for members actively using transcripts, tax tools, and professional matching in one workflow.',
  Premier: 'Expanded tokens and stronger monitoring visibility for taxpayers with more active or complex situations.',
}

interface FeatureDetail {
  id: string
  number: string
  title: string
  description: string
  tiers: { tier: string; desc: string }[]
  stats: { label: string; value: string }[]
  useCases: string[]
  whyMatters: string[]
}

const featureDetails: FeatureDetail[] = [
  {
    id: 'feature-app-dashboard',
    number: 'Feature 01',
    title: 'App dashboard',
    description: 'The central member workspace for account access, saved activity, prior requests, and monitoring visibility.',
    tiers: [
      { tier: 'Free', desc: 'Basic dashboard access' },
      { tier: 'Essential', desc: 'History and request visibility' },
      { tier: 'Plus', desc: 'Saved results and activity history' },
      { tier: 'Premier', desc: 'Monitoring records in dashboard' },
    ],
    stats: [
      { label: 'Results and requests', value: 'Saved' },
      { label: 'Membership activity', value: 'Past' },
      { label: 'Monitoring visibility', value: 'Clear' },
    ],
    useCases: [
      'Tracking saved transcript results and tool outputs.',
      'Reviewing past matching requests and account activity.',
      'Keeping monitoring records in one member-visible workspace.',
    ],
    whyMatters: [
      'Members need one place to see what happened and what is available next.',
      'It reduces confusion when transcripts, tools, and matches all live under one roof.',
      'It feels like an actual product, which helps members clearly understand how the system works.',
    ],
  },
  {
    id: 'feature-professional-matching',
    number: 'Feature 02',
    title: 'Professional matching',
    description: 'Browse, filter, and match with tax professionals by services, location, and budget-aware preferences.',
    tiers: [
      { tier: 'Free', desc: 'Directory browsing' },
      { tier: 'Essential', desc: 'Matching and inquiry access' },
      { tier: 'Plus', desc: 'Matching with saved activity' },
      { tier: 'Premier', desc: 'Priority professional matching' },
    ],
    stats: [
      { label: 'Service types', value: 'Filter' },
      { label: 'Location match', value: 'Local' },
      { label: 'Budget awareness', value: 'Smart' },
    ],
    useCases: [
      'Professional discovery based on actual services needed.',
      'Budget-aware matching instead of random guesswork.',
      'Optional direct contact flow when members want outreach.',
    ],
    whyMatters: [
      'Members get relevance instead of an overwhelming directory with little guidance.',
      'The flow reflects the inquiry page, which keeps product and marketing aligned.',
      'Better fit improves trust before a taxpayer ever books or reaches out.',
    ],
  },
  {
    id: 'feature-tax-tool-tokens',
    number: 'Feature 03',
    title: 'Tax tool tokens',
    description: 'Plan-based access to supported tax tools with clear usage visibility and defined limits.',
    tiers: [
      { tier: 'Free', desc: '0 monthly tokens' },
      { tier: 'Essential', desc: '5 monthly tokens' },
      { tier: 'Plus', desc: '15 monthly tokens' },
      { tier: 'Premier', desc: '40 monthly tokens' },
    ],
    stats: [
      { label: 'Free', value: '0' },
      { label: 'Essential', value: '5' },
      { label: 'Plus', value: '15' },
      { label: 'Premier', value: '40' },
    ],
    useCases: [
      'Access to eligible tax tools with clear, predictable usage and straightforward billing.',
      'Visible token balances tied to membership tier.',
      'Saved outputs for members on higher tiers.',
    ],
    whyMatters: [
      'Members can see what is included before they start clicking around.',
      'The capacity increase from Essential to Premier is obvious and useful.',
      'It turns tool access into a structured and predictable system.',
    ],
  },
  {
    id: 'feature-transcript-tokens',
    number: 'Feature 04',
    title: 'Transcript tokens',
    description: 'Monthly transcript capacity tied to transcript jobs, result storage, and monitoring visibility across memberships.',
    tiers: [
      { tier: 'Free', desc: '0 monthly tokens' },
      { tier: 'Essential', desc: '2 monthly tokens' },
      { tier: 'Plus', desc: '5 monthly tokens' },
      { tier: 'Premier', desc: '10 monthly tokens' },
    ],
    stats: [
      { label: 'Free', value: '0' },
      { label: 'Essential', value: '2' },
      { label: 'Plus', value: '5' },
      { label: 'Premier', value: '10' },
    ],
    useCases: [
      'Transcript job access tied to member workflows.',
      'Saved transcript results for higher tiers that need continuity.',
      'Monitoring support for more complex or active tax situations.',
    ],
    whyMatters: [
      'Transcript access becomes predictable instead of one more chaotic tax chore.',
      'Premier adds the strongest ongoing visibility for heavier needs.',
      'It supports the monitoring-first TMP model without pretending every user needs the same depth.',
    ],
  },
]

const comparisonRows = [
  { feature: 'App dashboard', free: 'Basic access', essential: 'History visibility', plus: 'Saved results', premier: 'Monitoring records' },
  { feature: 'Professional matching', free: 'Browse only', essential: 'Included', plus: 'Included', premier: 'Priority' },
  { feature: 'Monthly tax tool tokens', free: '0', essential: '5', plus: '15', premier: '40' },
  { feature: 'Monthly transcript tokens', free: '0', essential: '2', plus: '5', premier: '10' },
]

export default function FeaturesPage() {
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
              <span>Memberships designed around early visibility and access to tax professionals before problems grow into monsters.</span>
            </div>

            <h1 className={styles.headline}>
              TMP Taxpayer <span className="gradient-text">Membership Features</span>
            </h1>

            <p className={styles.subheadline}>
              Every taxpayer membership is built around the same core member experience. What changes is how much access, capacity, and monitoring support you unlock as your needs get more complex.
            </p>

            <div className={styles.heroCtas}>
              <a href="#core-features" className={styles.btnPrimary}>See the four features</a>
              <a href="#plans" className={styles.btnSecondary}>Compare memberships</a>
            </div>
          </div>
        </section>

        {/* Core Features */}
        <section className={styles.coreSection} id="core-features">
          <div className={styles.sectionInner}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionHeading}>
                The 4 Core <span className="gradient-text">Membership Features</span>
              </h2>
              <p className={styles.sectionSub}>
                These sections explain the core operating features that support TMP memberships and how the system works for members.
              </p>
            </div>

            <div className={styles.coreGrid}>
              {[
                { href: '#feature-app-dashboard', title: 'App dashboard', desc: 'A clean member workspace for saved activity, account visibility, feature access, and ongoing tax support records.' },
                { href: '#feature-professional-matching', title: 'Professional matching', desc: 'Match with tax professionals by service type, location, and fit instead of searching across multiple sites without clear guidance.' },
                { href: '#feature-tax-tool-tokens', title: 'Tax tool tokens', desc: 'Structured token access for eligible tools so members can use utilities without mystery charges or scattered outputs.' },
                { href: '#feature-transcript-tokens', title: 'Transcript tokens', desc: 'Monthly transcript capacity for transcript pulls, result visibility, and monitoring-driven follow-up from one place.' },
              ].map((card) => (
                <a key={card.href} href={card.href} className={styles.coreCard}>
                  <h3 className={styles.coreCardTitle}>{card.title}</h3>
                  <p className={styles.coreCardDesc}>{card.desc}</p>
                  <span className={styles.coreCardLink}>View feature details &rarr;</span>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Feature Details */}
        <section className={styles.detailSection} id="feature-details">
          <div className={styles.sectionInner}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionHeading}>
                Feature <span className="gradient-text">Details</span>
              </h2>
              <p className={styles.sectionSub}>
                Each section mirrors the TMP app feel so the page looks like product reality instead of decorative sales confetti.
              </p>
            </div>

            <div className={styles.detailStack}>
              {featureDetails.map((feat) => (
                <article key={feat.id} id={feat.id} className={styles.detailShell}>
                  <div className={styles.detailGrid}>
                    {/* Sidebar */}
                    <aside className={styles.detailSidebar}>
                      <span className={styles.badgeAmber}>{feat.number}</span>
                      <h3 className={styles.detailTitle}>{feat.title}</h3>
                      <p className={styles.detailDesc}>{feat.description}</p>
                      <div className={styles.tierList}>
                        {feat.tiers.map((t) => (
                          <div key={t.tier} className={styles.tierItem}>
                            <div className={styles.tierLabel}>{t.tier}</div>
                            <div className={styles.tierValue}>{t.desc}</div>
                          </div>
                        ))}
                      </div>
                    </aside>

                    {/* Main content */}
                    <div className={styles.detailMain}>
                      <div className={styles.glassCard}>
                        <div className={styles.statRow}>
                          {feat.stats.map((s) => (
                            <div key={s.label} className={styles.statCard}>
                              <div className={styles.statValue}>{s.value}</div>
                              <div className={styles.statLabel}>{s.label}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className={styles.detailColumns}>
                        <div className={styles.glassCard}>
                          <div className={styles.glassCardTitle}>What members use it for</div>
                          <div className={styles.glassCardList}>
                            {feat.useCases.map((uc) => (
                              <div key={uc} className={styles.glassCardItem}>{uc}</div>
                            ))}
                          </div>
                        </div>
                        <div className={styles.glassCard}>
                          <div className={styles.glassCardTitle}>Why this matters</div>
                          <div className={styles.glassCardList}>
                            {feat.whyMatters.map((wm) => (
                              <div key={wm} className={styles.glassCardItem}>{wm}</div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Plan Cards */}
        <section className={styles.planSection} id="plans">
          <div className={styles.sectionInner}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionHeading}>
                Choose the Right <span className="gradient-text">Membership</span>
              </h2>
              <p className={styles.sectionSub}>
                Same core system. Different access levels. Because not every taxpayer needs the same support on day one, since different taxpayers require different levels of support over time.
              </p>
            </div>

            <div className={styles.planGrid}>
              {PLANS_I.map((plan) => {
                const meta = planMeta[plan.name]
                const highlights = planHighlights[plan.name]
                const desc = planDescriptions[plan.name]
                const isPopular = plan.recommended

                return (
                  <article
                    key={plan.id}
                    className={`${styles.planCard} ${isPopular ? styles.planPopular : ''}`}
                  >
                    {isPopular && <div className={styles.popularTag}>Most popular</div>}
                    <div className={styles.planHeader}>
                      <div>
                        <div className={styles.planBestFor}>{meta.bestFor}</div>
                        <h3 className={styles.planName}>{plan.name}</h3>
                      </div>
                      {!isPopular && <span className={styles.planBadge}>{meta.badge}</span>}
                    </div>
                    <div className={styles.planPrice}>
                      <span className={styles.planAmount}>${plan.price}</span>
                      <span className={styles.planInterval}>/mo</span>
                    </div>
                    <p className={styles.planDesc}>{desc}</p>
                    <ul className={styles.planFeatures}>
                      {highlights?.map((h) => (
                        <li key={h} className={styles.planFeatureItem}>
                          <span className={styles.featureDot} />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href="/pricing" className={styles.planCta}>
                      {plan.price === 0 ? 'Start free' : `Start ${plan.name}`}
                    </Link>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className={styles.comparisonSection} id="comparison">
          <div className={styles.sectionInner}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionHeading}>
                Feature Access by <span className="gradient-text">Membership</span>
              </h2>
              <p className={styles.sectionSub}>
                A cleaner comparison of what changes as members move up the ladder. Clarity helps people decide, so members can easily understand the differences between plans.
              </p>
            </div>

            <div className={styles.tableWrap}>
              <div className={styles.tableScroll}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.th}>Feature</th>
                      <th className={styles.th}>Free</th>
                      <th className={styles.th}>Essential</th>
                      <th className={styles.th}>Plus</th>
                      <th className={styles.th}>Premier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonRows.map((row) => (
                      <tr key={row.feature} className={styles.tr}>
                        <td className={styles.tdFeature}>{row.feature}</td>
                        <td className={styles.td}>{row.free}</td>
                        <td className={styles.td}>{row.essential}</td>
                        <td className={styles.td}>{row.plus}</td>
                        <td className={styles.td}>{row.premier}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
