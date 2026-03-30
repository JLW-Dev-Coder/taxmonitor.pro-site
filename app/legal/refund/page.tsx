import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import styles from '../layout.module.css'

export const metadata = {
  title: 'Tax Monitor Pro — Refund Policy',
  description:
    'Refund Policy for Tax Monitor Pro subscriptions, directory visibility, featured placement, verification-related fees, and related digital purchases.',
}

export default function RefundPolicyPage() {
  return (
    <div className={styles.page}>
      <div className={styles.amberGlow}>
        <Header variant="site" />

        <main className={styles.main}>
          <div className={styles.brandBlock}>
            <Link href="/" className={styles.brandLink} aria-label="Tax Monitor Pro Home">
              <div className={styles.badge}>
                <span className={styles.badgeText}>TM</span>
              </div>
              <div className={styles.brandTextWrap}>
                <span className={styles.brandTitle}>Tax Monitor Pro</span>
                <span className={styles.brandSub}>Owned by Lenore, Inc.</span>
              </div>
            </Link>
          </div>

          <div className={styles.headingBlock}>
            <h2 className={styles.pageTitle}>Refund Policy</h2>
            <p className={styles.pageSubtitle}>Directory, Visibility, Verification, and Digital Service Purchases</p>
            <p className={styles.lastUpdated}>Last updated: March 12, 2026</p>
          </div>

          <div className={styles.card}>
            {/* Intro */}
            <section className={styles.section}>
              <p className={styles.body}>
                This Refund Policy applies to purchases made through Tax Monitor Pro, including directory subscriptions, featured listing upgrades, profile visibility fees, verification-related review fees, client pool access fees, and other related digital services or platform access purchases. For support, use{' '}
                <Link href="/contact" className={styles.link}>Contact Support</Link>.
              </p>
            </section>

            {/* A. What You're Buying */}
            <section className={styles.section}>
              <h3 className={styles.sectionHeading}>A. What You&apos;re Buying</h3>
              <ul className={styles.discList}>
                <li><span className={styles.bold}>Directory and profile products</span> are digital listing and platform visibility services.</li>
                <li><span className={styles.bold}>Featured placement, profile exposure, and client pool access</span> are access and positioning features, not guaranteed lead-generation products.</li>
                <li><span className={styles.bold}>Verification-related charges</span> may cover administrative review, document handling, and profile qualification workflows.</li>
                <li>These purchases are <span className={styles.bold}>digital services and access rights</span>, not physical goods.</li>
              </ul>
            </section>

            {/* B. General Rule */}
            <section className={styles.section}>
              <h3 className={styles.sectionHeading}>B. General Rule</h3>
              <p className={styles.body}>
                Because Tax Monitor Pro products are digital services that may be provisioned, activated, reviewed, published, or made available promptly after purchase, fees are generally <span className={styles.bold}>non-refundable once the service, access, review, or listing process has started</span>.
              </p>
            </section>

            {/* C. When We May Approve a Refund */}
            <section className={styles.section}>
              <h3 className={styles.sectionHeading}>C. When We May Approve a Refund</h3>
              <p className={styles.bodyBeforeListSpaced}>We may approve a refund, platform credit, or billing adjustment in situations such as:</p>
              <ul className={styles.discList}>
                <li><span className={styles.bold}>Duplicate charge</span> for the same order or subscription period.</li>
                <li><span className={styles.bold}>Unauthorized charge</span> that appears to be fraudulent or not approved by the account holder, subject to review.</li>
                <li><span className={styles.bold}>Technical failure</span> where the purchased service was never provisioned and the issue cannot be corrected.</li>
                <li><span className={styles.bold}>Verified billing error</span> caused by our system.</li>
                <li><span className={styles.bold}>Accidental overpayment</span> where the same feature or plan was charged more than once.</li>
              </ul>
              <p className={styles.note}>All approvals are discretionary, case-by-case, and may require supporting information.</p>
            </section>

            {/* D. When We Typically Do Not Refund */}
            <section className={styles.section}>
              <h3 className={styles.sectionHeading}>D. When We Typically Do Not Refund</h3>
              <p className={styles.bodyBeforeListSpaced}>Refunds are not typically provided for the following:</p>
              <ul className={styles.discList}>
                <li><span className={styles.bold}>Change of mind</span> after purchase.</li>
                <li><span className={styles.bold}>Directory or featured listing fees</span> once the listing has been published, queued, reviewed, or activated.</li>
                <li><span className={styles.bold}>Client pool or visibility access fees</span> where access has been granted or enabled.</li>
                <li><span className={styles.bold}>Verification review fees</span> once document review, credential screening, or profile assessment has begun, even if approval is denied, delayed, or limited.</li>
                <li><span className={styles.bold}>Lack of leads, inquiries, engagement, conversions, or revenue</span>.</li>
                <li><span className={styles.bold}>Ranking, placement, or visibility expectations</span> that were not expressly guaranteed in writing.</li>
                <li><span className={styles.bold}>Profile suspension, restriction, rejection, or removal</span> caused by inaccurate, incomplete, misleading, expired, or unverifiable credential, license, or business information.</li>
                <li><span className={styles.bold}>Failure to complete requested verification steps</span> within the required timeframe.</li>
                <li><span className={styles.bold}>User-side setup, browser, device, email, or account access issues</span> when the platform is otherwise functioning.</li>
              </ul>
            </section>

            {/* E. Verification and Credential Review */}
            <section className={styles.section}>
              <h3 className={styles.sectionHeading}>E. Verification and Credential Review</h3>
              <p className={styles.bodyBeforeListSpaced}>
                Tax Monitor Pro may request documentation to evaluate claimed credentials, licenses, professional designations, business identity, jurisdictional standing, or related profile eligibility.
              </p>
              <ul className={styles.discList}>
                <li>Payment of a fee does <span className={styles.bold}>not</span> guarantee profile approval, publication, verification status, preferred placement, or continued visibility.</li>
                <li>We may approve, deny, limit, label, unpublish, or remove a profile in our discretion, subject to applicable law and our Terms.</li>
                <li>Fees tied to review or administrative processing are generally earned when the review workflow begins.</li>
              </ul>
            </section>

            {/* F. Subscriptions and Renewals */}
            <section className={styles.section}>
              <h3 className={styles.sectionHeading}>F. Subscriptions and Renewals</h3>
              <p className={styles.bodyBeforeListSpaced}>
                If Tax Monitor Pro offers recurring subscriptions, the following rules apply unless different terms are stated at checkout:
              </p>
              <ul className={styles.discList}>
                <li>Subscription fees apply to the billing period purchased.</li>
                <li>Cancellation stops future renewals but does not usually create a refund for the current billing period.</li>
                <li>Partial-period or unused-time refunds are not typically provided.</li>
              </ul>
            </section>

            {/* G. How to Request a Refund */}
            <section className={styles.section}>
              <h3 className={styles.sectionHeading}>G. How to Request a Refund</h3>
              <ol className={styles.orderedList}>
                <li>Submit your request through <Link href="/contact" className={styles.link}>Contact Support</Link>.</li>
                <li>Include the account email, business name, and approximate purchase date.</li>
                <li>Include any receipt, invoice, transaction ID, subscription reference, or related order details available to you.</li>
                <li>Briefly explain the reason for the request and any relevant technical or billing issue.</li>
              </ol>
            </section>

            {/* H. Chargebacks and Payment Disputes */}
            <section className={styles.section}>
              <h3 className={styles.sectionHeading}>H. Chargebacks and Payment Disputes</h3>
              <p className={styles.body}>
                Initiating a chargeback or payment dispute may result in temporary restriction, suspension, or removal of platform access, listing visibility, verification status, or related services while the matter is investigated.
              </p>
            </section>

            {/* I. Policy Changes */}
            <section className={styles.sectionLast}>
              <h3 className={styles.sectionHeading}>I. Policy Changes</h3>
              <p className={styles.body}>
                We may update this Refund Policy from time to time. The &ldquo;Last updated&rdquo; date reflects the most recent revision.
              </p>
            </section>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  )
}
