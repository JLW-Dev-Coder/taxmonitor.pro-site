import Link from 'next/link'
import Header from '@/components/Header'
import styles from '../layout.module.css'

export const metadata = {
  title: 'Tax Monitor Pro — Privacy Policy',
  description:
    'Privacy Policy for Tax Monitor Pro — directory, profile, and inquiry data handling.',
}

export default function PrivacyPolicyPage() {
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
            <h2 className={styles.pageTitle}>Privacy Policy</h2>
            <p className={styles.pageSubtitle}>Directory, Profile, and Inquiry Data Handling</p>
            <p className={styles.lastUpdated}>Last updated: March 13, 2026</p>
          </div>

          <div className={styles.card}>
            {/* Intro */}
            <section className={styles.section}>
              <p className={styles.body}>
                This Privacy Policy explains how Lenore, Inc. (&ldquo;Tax Monitor Pro,&rdquo; &ldquo;Provider,&rdquo; &ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) collects, uses, stores, and displays information through the Tax Monitor Pro platform, including practitioner profiles, directory listings, verification submissions, inquiry routing, and related platform services.
              </p>
            </section>

            {/* A. Information We Collect */}
            <section className={styles.section}>
              <h3 className={styles.sectionHeading}>A. Information We Collect</h3>
              <p className={styles.bodyBeforeList}>We may collect information that users voluntarily provide when using the platform, including:</p>
              <ul className={styles.discList}>
                <li>Name, firm name, and professional identity information.</li>
                <li>Business contact details such as email, phone, city, and state.</li>
                <li>Professional credentials such as JD, CPA, EA, attorney admission, licenses, or related claims.</li>
                <li>Profile biography, services offered, languages spoken, and business descriptions.</li>
                <li>Verification documents or credential materials submitted for review.</li>
                <li>Inquiry messages submitted by taxpayers or prospective clients.</li>
                <li>Technical information related to platform usage such as device, browser, or interaction data.</li>
              </ul>
            </section>

            {/* B. Public Profile Information */}
            <section className={styles.section}>
              <h3 className={styles.sectionHeading}>B. Public Profile Information</h3>
              <p className={styles.body}>
                Certain information submitted to the platform may be publicly visible through the directory, search results, profile pages, or related discovery surfaces. This may include name, firm name, city, state, service categories, credentials, biography, profile photo, and similar information provided for listing purposes.
              </p>
              <p className={styles.bodySpaced}>
                Users should not submit confidential or sensitive information intended to remain private within public profile fields.
              </p>
            </section>

            {/* C. Verification Materials */}
            <section className={styles.section}>
              <h3 className={styles.sectionHeading}>C. Verification Materials</h3>
              <p className={styles.body}>
                If a user requests verification of credentials, professional status, or business identity, we may request supporting documentation. These materials may include license records, bar admissions, certification numbers, business registration documents, or other supporting evidence.
              </p>
              <p className={styles.bodySpaced}>
                Verification materials are used solely for administrative review, qualification decisions, and platform trust and safety processes.
              </p>
            </section>

            {/* D. Inquiry and Client Communication */}
            <section className={styles.section}>
              <h3 className={styles.sectionHeading}>D. Inquiry and Client Communication</h3>
              <p className={styles.body}>
                Taxpayers or prospective clients may submit inquiries through the platform. These messages may include contact details, general tax issues, or other information voluntarily provided by the sender.
              </p>
              <p className={styles.bodySpaced}>
                Inquiry information may be shared with practitioners or firms through the platform&apos;s routing or client pool systems to facilitate communication between users.
              </p>
            </section>

            {/* E. How We Use Information */}
            <section className={styles.section}>
              <h3 className={styles.sectionHeading}>E. How We Use Information</h3>
              <p className={styles.bodyBeforeList}>Information collected through the platform may be used to:</p>
              <ul className={styles.discList}>
                <li>Operate and maintain the directory and platform.</li>
                <li>Display practitioner profiles and listings.</li>
                <li>Review verification submissions.</li>
                <li>Route inquiries between users.</li>
                <li>Maintain platform safety, trust, and compliance processes.</li>
                <li>Provide support, troubleshooting, or account management.</li>
                <li>Improve platform functionality and services.</li>
              </ul>
            </section>

            {/* F. Data Sharing */}
            <section className={styles.section}>
              <h3 className={styles.sectionHeading}>F. Data Sharing</h3>
              <p className={styles.body}>
                We do not sell personal information. However, information may be shared in limited circumstances, including:
              </p>
              <ul className={`${styles.discList} ${styles.spacedList}`}>
                <li>With practitioners when inquiries are submitted through the platform.</li>
                <li>With service providers that support platform infrastructure.</li>
                <li>When required by law, legal process, or regulatory request.</li>
                <li>To protect the security, integrity, or legal rights of the platform.</li>
              </ul>
            </section>

            {/* G. Data Retention */}
            <section className={styles.section}>
              <h3 className={styles.sectionHeading}>G. Data Retention</h3>
              <p className={styles.body}>
                We retain information for as long as reasonably necessary to operate the platform, maintain business records, support verification decisions, comply with legal obligations, resolve disputes, and enforce platform rules.
              </p>
            </section>

            {/* H. Security */}
            <section className={styles.section}>
              <h3 className={styles.sectionHeading}>H. Security</h3>
              <p className={styles.body}>
                We implement commercially reasonable technical and administrative safeguards designed to protect information handled through the platform. However, no system can guarantee absolute security.
              </p>
            </section>

            {/* I. User Responsibilities */}
            <section className={styles.section}>
              <h3 className={styles.sectionHeading}>I. User Responsibilities</h3>
              <p className={styles.body}>
                Users are responsible for maintaining the confidentiality of their account credentials and for ensuring that the information they submit to the platform is accurate, lawful, and appropriate for publication.
              </p>
            </section>

            {/* Contact */}
            <section className={styles.sectionLast}>
              <h3 className={styles.sectionHeading}>Contact</h3>
              <p className={styles.body}>
                For questions regarding this Privacy Policy or our data handling practices, contact Lenore, Inc. through official business channels.
              </p>
            </section>
          </div>
        </main>

      </div>
    </div>
  )
}
