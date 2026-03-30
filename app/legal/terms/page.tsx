import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import styles from '../layout.module.css'

export const metadata = {
  title: 'Tax Monitor Pro — Terms of Service',
  description:
    'Terms of Service for Tax Monitor Pro — directory, profile visibility, verification, and platform use.',
}

export default function TermsOfServicePage() {
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
            <h2 className={styles.pageTitle}>Terms of Service</h2>
            <p className={styles.pageSubtitle}>Directory, Profile Visibility, Verification, and Platform Use</p>
            <p className={styles.lastUpdated}>Last updated: March 13, 2026</p>
          </div>

          <div className={styles.card}>
            {/* Agreement */}
            <section className={styles.section}>
              <h3 className={styles.sectionHeading}>Agreement</h3>
              <p className={styles.body}>
                These Terms of Service (&ldquo;Terms&rdquo;) govern access to and use of Tax Monitor Pro, including the website, directory, profiles, featured placements, verification workflows, inquiry routing, client pool access, and related services provided by Lenore, Inc. (&ldquo;Tax Monitor Pro,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;). By accessing or using the platform, creating an account, submitting information, purchasing a listing or related service, or using any profile or inquiry tools, you agree to be bound by these Terms.
              </p>
            </section>

            {/* Section 1 */}
            <section className={styles.section}>
              <h3 className={styles.sectionHeading}>Section 1. Platform Scope</h3>
              <p className={styles.body}>
                Tax Monitor Pro is a platform that may allow tax professionals, firms, and related service providers to create profiles, submit credentials, request visibility, participate in verification workflows, receive inquiries, and access features tied to listing or client pool participation.
              </p>
              <p className={styles.bodySpaced}>
                The platform may also allow taxpayers or prospective clients to browse profiles, review limited profile information, and submit inquiries. Tax Monitor Pro is a marketplace-style visibility and connection platform. It is not a law firm, CPA firm, enrolled agent firm, tax resolution firm, referral guarantee service, or employment agency.
              </p>
            </section>

            {/* Section 2 */}
            <section className={styles.section}>
              <h3 className={styles.sectionHeading}>Section 2. No Professional Advice or Representation</h3>
              <p className={styles.body}>
                Tax Monitor Pro does not provide tax, legal, accounting, financial, compliance, investment, or other regulated professional advice through the platform unless expressly stated in a separate written agreement.
              </p>
              <p className={styles.bodySpaced}>
                Any profile, listing, credential description, content, article, tool, or communication made available through the platform is for informational and platform-operational purposes only and does not create an attorney-client, CPA-client, EA-client, fiduciary, or other professional relationship between Tax Monitor Pro and any user.
              </p>
            </section>

            {/* Section 3 */}
            <section className={styles.section}>
              <h3 className={styles.sectionHeading}>Section 3. Eligibility and Accounts</h3>
              <ul className={styles.discList}>
                <li>You must provide accurate, current, and complete information when using the platform.</li>
                <li>You are responsible for maintaining the confidentiality of your login credentials and for activity occurring under your account.</li>
                <li>You may not impersonate another person or business, misstate your affiliation, or submit false or misleading identity, firm, credential, license, or jurisdiction information.</li>
                <li>We may suspend, restrict, or terminate access if we believe your account information is inaccurate, incomplete, misleading, expired, or otherwise creates platform, legal, or trust risk.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section className={styles.section}>
              <h3 className={styles.sectionHeading}>Section 4. Profiles, Listings, and Public Visibility</h3>
              <p className={styles.body}>
                Tax Monitor Pro may allow a user to create or submit a public or semi-public profile, including name, firm name, city, state, service categories, languages, credentials, biography, contact methods, photos, business details, and related listing information.
              </p>
              <p className={styles.bodySpaced}>
                By submitting profile information, you grant us the right to host, store, format, display, promote, index, excerpt, rank, and distribute that information within the platform and related marketing, search, directory, and inquiry surfaces.
              </p>
              <p className={styles.bodySpaced}>
                We may determine, change, limit, or remove profile visibility, category placement, featured status, ordering, search prominence, service area display, client pool access, and related presentation settings at our discretion.
              </p>
            </section>

            {/* Section 5 */}
            <section className={styles.section}>
              <h3 className={styles.sectionHeading}>Section 5. Credentials, Licensure, and Verification</h3>
              <p className={styles.body}>
                If you claim a credential, designation, license, admission, certification, firm affiliation, insurance status, or other professional qualification, you represent that the claim is truthful, current, and supportable.
              </p>
              <p className={styles.bodySpaced}>
                Tax Monitor Pro may request supporting documents or other information to review a claimed JD, attorney status, CPA license, EA status, firm identity, PTIN, state standing, or similar professional representation. You agree to provide requested materials promptly and accurately.
              </p>
              <p className={styles.bodySpaced}>
                Verification, if offered, means only that we completed some level of review based on information made available to us at the time. It does not mean endorsement, guarantee, fitness for a specific client matter, malpractice screening, disciplinary clearance, or ongoing monitoring of status unless expressly stated by us in writing.
              </p>
              <p className={styles.bodySpaced}>
                We may approve, deny, label, limit, delay, revoke, or remove verification or related visibility at any time if documentation is missing, inconsistent, expired, unverifiable, or otherwise unsatisfactory in our judgment.
              </p>
            </section>

            {/* Section 6 */}
            <section className={styles.section}>
              <h3 className={styles.sectionHeading}>Section 6. Client Pool and Inquiry Routing</h3>
              <p className={styles.body}>
                Tax Monitor Pro may route, display, or make available inquiries, leads, matches, or opportunities through a client pool or similar system. Access to these features may depend on plan level, geography, profile completeness, verification status, responsiveness, platform rules, internal quality controls, or other criteria we set.
              </p>
              <p className={styles.bodySpaced}>
                We do not guarantee any minimum number of inquiries, leads, matches, impressions, responses, conversions, clients, revenue, or business outcomes. Purchase of a plan, profile, feature, or visibility upgrade does not guarantee placement in front of any specific user or the receipt of any matter.
              </p>
              <p className={styles.bodySpaced}>
                We may reassign, withhold, limit, prioritize, or discontinue inquiry access or client pool participation in our discretion.
              </p>
            </section>

            {/* Section 7 */}
            <section className={styles.section}>
              <h3 className={styles.sectionHeading}>Section 7. Fees, Billing, Renewals, and Refunds</h3>
              <p className={styles.body}>
                Certain platform features may require payment, including listings, featured placement, enhanced visibility, verification-related review, subscriptions, or client pool access. You agree to pay the fees presented at checkout or otherwise disclosed for the selected service.
              </p>
              <p className={styles.bodySpaced}>
                If a feature renews automatically, you authorize us or our payment processor to charge the applicable payment method for renewal periods until cancellation takes effect.
              </p>
              <p className={styles.bodySpaced}>
                Refunds are governed by our Refund Policy. Unless expressly stated otherwise, fees are generally non-refundable once the applicable service, access, listing, review, or visibility workflow has begun.
              </p>
            </section>

            {/* Section 8 */}
            <section className={styles.section}>
              <h3 className={styles.sectionHeading}>Section 8. User Responsibilities and Platform Rules</h3>
              <ul className={styles.discList}>
                <li>Do not submit false, deceptive, unlawful, infringing, harassing, or defamatory content.</li>
                <li>Do not misrepresent outcomes, services, qualifications, or availability.</li>
                <li>Do not scrape, copy, harvest, or systematically extract profile, inquiry, directory, or user data without authorization.</li>
                <li>Do not use the platform in a manner that violates privacy rights, advertising rules, professional rules, tax practice rules, or other applicable laws.</li>
                <li>Do not interfere with platform operations, security, rankings, matching, or other users&apos; access.</li>
              </ul>
            </section>

            {/* Section 9 */}
            <section className={styles.section}>
              <h3 className={styles.sectionHeading}>Section 9. Content License</h3>
              <p className={styles.body}>
                You retain ownership of content you submit, but you grant Tax Monitor Pro a non-exclusive, worldwide, royalty-free license to host, reproduce, adapt, publish, display, distribute, and use that content as reasonably necessary to operate, market, improve, and provide the platform.
              </p>
              <p className={styles.bodySpaced}>
                You represent that you have the rights necessary to submit the content and to grant this license.
              </p>
            </section>

            {/* Section 10 */}
            <section className={styles.section}>
              <h3 className={styles.sectionHeading}>Section 10. Taxpayer and Visitor Use</h3>
              <p className={styles.body}>
                Taxpayers, prospects, and visitors may use the platform to browse information and submit inquiries. Users should independently evaluate whether a professional is appropriate for their needs. Tax Monitor Pro does not guarantee that any listed or visible professional is the right fit for a specific matter.
              </p>
              <p className={styles.bodySpaced}>
                We are not a party to engagements, fee agreements, representations, disputes, or outcomes between a taxpayer or prospect and a listed professional unless expressly stated in a separate written agreement.
              </p>
            </section>

            {/* Section 11 */}
            <section className={styles.section}>
              <h3 className={styles.sectionHeading}>Section 11. Suspension, Removal, and Platform Changes</h3>
              <p className={styles.body}>
                We may modify, suspend, limit, or discontinue any feature, category, listing type, verification label, placement rule, ranking method, client pool workflow, or portion of the platform at any time.
              </p>
              <p className={styles.bodySpaced}>
                We may reject, remove, unpublish, relabel, or suspend any profile, inquiry access, account, or content if we believe it creates legal, operational, trust, compliance, safety, reputational, or business risk, or violates these Terms.
              </p>
            </section>

            {/* Section 12 */}
            <section className={styles.section}>
              <h3 className={styles.sectionHeading}>Section 12. Privacy</h3>
              <p className={styles.body}>
                Your use of the platform is also subject to our Privacy Policy. Where you submit profile information, business information, inquiry data, or verification materials, you acknowledge that we may collect, use, store, and display that information as described in the Privacy Policy and as reasonably necessary to operate the platform.
              </p>
            </section>

            {/* Section 13 */}
            <section className={styles.section}>
              <h3 className={styles.sectionHeading}>Section 13. Disclaimers</h3>
              <p className={styles.body}>
                The platform is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis to the maximum extent permitted by law. We disclaim all warranties, express or implied, including implied warranties of merchantability, fitness for a particular purpose, title, non-infringement, availability, accuracy, and uninterrupted access.
              </p>
              <p className={styles.bodySpaced}>
                Without limiting the foregoing, we do not warrant that the platform will generate business, maintain any specific ranking, verify every claimed credential, prevent all misuse, or operate without delays, errors, interruptions, or third-party failures.
              </p>
            </section>

            {/* Section 14 */}
            <section className={styles.section}>
              <h3 className={styles.sectionHeading}>Section 14. Limitation of Liability</h3>
              <p className={styles.body}>
                To the maximum extent permitted by law, Tax Monitor Pro and Lenore, Inc. will not be liable for any indirect, incidental, special, consequential, punitive, or exemplary damages, or for any loss of profits, revenue, business, goodwill, data, opportunities, or professional engagements arising out of or relating to the platform, listings, visibility, verification, inquiry routing, client pool access, or these Terms.
              </p>
              <p className={styles.bodySpaced}>
                Our total aggregate liability for any claim relating to the platform or these Terms will not exceed the amount you paid to us for the specific service giving rise to the claim during the twelve months before the event giving rise to liability, or one hundred U.S. dollars (US $100) if no such payment was made, whichever is greater.
              </p>
            </section>

            {/* Section 15 */}
            <section className={styles.section}>
              <h3 className={styles.sectionHeading}>Section 15. Indemnification</h3>
              <p className={styles.bodyBeforeListSpaced}>
                You agree to indemnify, defend, and hold harmless Tax Monitor Pro, Lenore, Inc., and their affiliates, officers, directors, employees, contractors, and agents from and against claims, liabilities, damages, judgments, losses, costs, and expenses, including reasonable attorneys&apos; fees, arising out of or related to:
              </p>
              <ul className={styles.discList}>
                <li>Your content, listings, profile claims, or submitted materials.</li>
                <li>Your services, representations, or dealings with clients, prospects, or other users.</li>
                <li>Your violation of these Terms or applicable law.</li>
                <li>Your infringement, misuse, or violation of another person&apos;s rights.</li>
              </ul>
            </section>

            {/* Section 16 */}
            <section className={styles.section}>
              <h3 className={styles.sectionHeading}>Section 16. Intellectual Property</h3>
              <p className={styles.body}>
                Tax Monitor Pro and its related branding, design, software, layout, graphics, copy, workflows, and platform materials are owned by Lenore, Inc. or its licensors and are protected by intellectual property laws.
              </p>
              <p className={styles.bodySpaced}>
                Except as expressly permitted, you may not copy, modify, distribute, reverse engineer, create derivative works from, sell, lease, or exploit platform materials or functionality without prior written permission.
              </p>
            </section>

            {/* Section 17 */}
            <section className={styles.section}>
              <h3 className={styles.sectionHeading}>Section 17. Governing Law and Venue</h3>
              <p className={styles.body}>
                These Terms are governed by the laws of the jurisdiction in which Lenore, Inc. operates, without regard to conflict-of-law principles.
              </p>
              <p className={styles.bodySpaced}>
                Any dispute arising out of or relating to these Terms or the platform will be brought in the courts located in that jurisdiction unless we elect arbitration or another dispute resolution method in a separate written agreement.
              </p>
            </section>

            {/* Section 18 */}
            <section className={styles.section}>
              <h3 className={styles.sectionHeading}>Section 18. Changes to These Terms</h3>
              <p className={styles.body}>
                We may update these Terms from time to time. Continued use of the platform after the updated Terms become effective constitutes acceptance of the revised Terms.
              </p>
            </section>

            {/* Electronic Acceptance */}
            <section className={styles.sectionLast}>
              <h3 className={styles.sectionHeading}>Electronic Acceptance</h3>
              <p className={styles.body}>
                By creating an account, submitting a profile, purchasing a service, joining a listing or client pool workflow, or otherwise using Tax Monitor Pro, you acknowledge that you have read, understood, and agree to be bound by these Terms.
              </p>
            </section>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  )
}
