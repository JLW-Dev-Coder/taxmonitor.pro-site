"use client";

import styles from "./LegalPage.module.css";

const PLATFORM = {
  name: "Tax Monitor Pro",
  domain: "taxmonitor.pro",
  email: "legal@taxmonitor.pro",
  entity: "Lenore, Inc",
  effectiveDate: "March 31, 2026",
};

type LegalType = "privacy" | "terms" | "refunds";

interface LegalPageProps {
  type: LegalType;
}

function PrivacyContent() {
  return (
    <>
      <h1 className={styles.title}>Privacy Policy</h1>
      <p className={styles.effective}>Effective: {PLATFORM.effectiveDate}</p>

      <section className={styles.section}>
        <h2>1. Introduction</h2>
        <p>
          {PLATFORM.entity} (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;{PLATFORM.name}&rdquo;)
          operates the {PLATFORM.domain} platform. This Privacy Policy explains how we collect,
          use, disclose, and safeguard your information when you use our services.
        </p>
      </section>

      <section className={styles.section}>
        <h2>2. Information We Collect</h2>
        <p>We collect the following categories of information:</p>
        <ul>
          <li><strong>Account information:</strong> name, email address, and authentication credentials when you create an account.</li>
          <li><strong>Payment information:</strong> billing details processed securely through Stripe. We do not store full credit card numbers on our servers.</li>
          <li><strong>Usage data:</strong> pages visited, features used, session duration, and device/browser information collected automatically.</li>
          <li><strong>Tax-related data:</strong> information you voluntarily provide in connection with our monitoring and resolution services.</li>
          <li><strong>Communications:</strong> messages sent through our support channels and Cal.com scheduling system.</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>3. Third-Party Processors</h2>
        <p>We use the following third-party service providers to operate {PLATFORM.name}:</p>
        <ul>
          <li><strong>Stripe:</strong> payment processing and subscription management.</li>
          <li><strong>Cloudflare:</strong> hosting, content delivery, and security services.</li>
          <li><strong>Cal.com:</strong> appointment scheduling for support and consultation calls.</li>
        </ul>
        <p>
          Each processor handles data in accordance with their own privacy policies and applicable
          data protection regulations.
        </p>
      </section>

      <section className={styles.section}>
        <h2>4. How We Use Your Information</h2>
        <ul>
          <li>To provide, maintain, and improve our services.</li>
          <li>To process transactions and manage your account.</li>
          <li>To communicate service updates, security alerts, and support messages.</li>
          <li>To comply with legal obligations and respond to lawful requests.</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>5. No Advertising or Tracking</h2>
        <p>
          {PLATFORM.name} does not sell your personal information. We do not use advertising
          trackers, behavioral analytics for ad targeting, or share data with advertising networks.
        </p>
      </section>

      <section className={styles.section}>
        <h2>6. Data Retention</h2>
        <p>
          We retain your information for as long as your account is active or as needed to provide
          services. You may request deletion of your account and associated data at any time by
          contacting us at{" "}
          <a href={`mailto:${PLATFORM.email}`} className={styles.link}>{PLATFORM.email}</a>.
        </p>
      </section>

      <section className={styles.section}>
        <h2>7. Your Rights</h2>
        <p>Depending on your jurisdiction, you may have the right to:</p>
        <ul>
          <li>Access the personal data we hold about you.</li>
          <li>Request correction of inaccurate data.</li>
          <li>Request deletion of your personal data.</li>
          <li>Object to or restrict certain processing activities.</li>
          <li>Receive your data in a portable format.</li>
        </ul>
        <p>
          To exercise these rights, contact us at{" "}
          <a href={`mailto:${PLATFORM.email}`} className={styles.link}>{PLATFORM.email}</a>.
        </p>
      </section>

      <section className={styles.section}>
        <h2>8. Security</h2>
        <p>
          We implement industry-standard security measures including encryption in transit (TLS),
          secure authentication, and access controls. No method of transmission over the Internet
          is 100% secure, and we cannot guarantee absolute security.
        </p>
      </section>

      <section className={styles.section}>
        <h2>9. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify you of material
          changes by posting the updated policy on our website with a revised effective date.
        </p>
      </section>

      <section className={styles.section}>
        <h2>10. Contact</h2>
        <p>
          For questions about this Privacy Policy, contact us at{" "}
          <a href={`mailto:${PLATFORM.email}`} className={styles.link}>{PLATFORM.email}</a>.
        </p>
        <p>{PLATFORM.entity}<br />{PLATFORM.domain}</p>
      </section>
    </>
  );
}

function TermsContent() {
  return (
    <>
      <h1 className={styles.title}>Terms of Service</h1>
      <p className={styles.effective}>Effective: {PLATFORM.effectiveDate}</p>

      <section className={styles.section}>
        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using {PLATFORM.name} (operated by {PLATFORM.entity}), you agree to be
          bound by these Terms of Service. If you do not agree to these terms, do not use our
          services.
        </p>
      </section>

      <section className={styles.section}>
        <h2>2. Eligibility</h2>
        <p>
          You must be at least 18 years of age to use {PLATFORM.name}. By using our services, you
          represent and warrant that you meet this requirement.
        </p>
      </section>

      <section className={styles.section}>
        <h2>3. Account Responsibilities</h2>
        <p>
          You are responsible for maintaining the confidentiality of your account credentials and
          for all activities that occur under your account. Notify us immediately of any
          unauthorized use.
        </p>
      </section>

      <section className={styles.section}>
        <h2>4. Services Description</h2>
        <p>
          {PLATFORM.name} provides IRS transcript monitoring, tax resolution support, and related
          tools for taxpayers and tax professionals. Our services are informational and operational
          in nature.
        </p>
      </section>

      <section className={styles.section}>
        <h2>5. Not Legal or Tax Advice</h2>
        <p>
          The information, tools, and outputs provided by {PLATFORM.name} do not constitute legal
          advice, tax advice, or professional counsel of any kind. You should consult a qualified
          tax professional or attorney for advice specific to your situation.
        </p>
      </section>

      <section className={styles.section}>
        <h2>6. Purchases and Tokens</h2>
        <p>
          Token purchases on {PLATFORM.name} are non-refundable once issued to your account.
          Subscription fees are governed by the applicable plan terms. See our Refund Policy for
          additional details.
        </p>
      </section>

      <section className={styles.section}>
        <h2>7. Prohibited Conduct</h2>
        <ul>
          <li>Using the platform for any unlawful purpose.</li>
          <li>Attempting to gain unauthorized access to any part of the service.</li>
          <li>Interfering with or disrupting the integrity or performance of the service.</li>
          <li>Submitting false or misleading information.</li>
          <li>Reselling or redistributing our services without authorization.</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>8. Intellectual Property</h2>
        <p>
          All content, features, and functionality of {PLATFORM.name} are owned by {PLATFORM.entity}
          and are protected by copyright, trademark, and other intellectual property laws.
        </p>
      </section>

      <section className={styles.section}>
        <h2>9. Limitation of Liability</h2>
        <p>
          To the fullest extent permitted by law, {PLATFORM.entity} shall not be liable for any
          indirect, incidental, special, consequential, or punitive damages arising from your use
          of {PLATFORM.name}.
        </p>
      </section>

      <section className={styles.section}>
        <h2>10. Governing Law</h2>
        <p>
          These Terms shall be governed by and construed in accordance with the laws of the State
          of Delaware, without regard to its conflict of law provisions.
        </p>
      </section>

      <section className={styles.section}>
        <h2>11. Dispute Resolution</h2>
        <p>
          Any dispute arising from these Terms or your use of {PLATFORM.name} shall be resolved
          through binding arbitration administered in accordance with the rules of the American
          Arbitration Association, conducted in the State of Delaware.
        </p>
      </section>

      <section className={styles.section}>
        <h2>12. Termination</h2>
        <p>
          We reserve the right to suspend or terminate your account at our sole discretion, with
          or without notice, for conduct that we determine violates these Terms or is harmful to
          the platform or other users.
        </p>
      </section>

      <section className={styles.section}>
        <h2>13. Changes to Terms</h2>
        <p>
          We may modify these Terms at any time. Continued use of {PLATFORM.name} after changes
          constitutes acceptance of the revised Terms.
        </p>
      </section>

      <section className={styles.section}>
        <h2>14. Contact</h2>
        <p>
          For questions about these Terms, contact us at{" "}
          <a href={`mailto:${PLATFORM.email}`} className={styles.link}>{PLATFORM.email}</a>.
        </p>
        <p>{PLATFORM.entity}<br />{PLATFORM.domain}</p>
      </section>
    </>
  );
}

function RefundsContent() {
  return (
    <>
      <h1 className={styles.title}>Refund Policy</h1>
      <p className={styles.effective}>Effective: {PLATFORM.effectiveDate}</p>

      <section className={styles.section}>
        <h2>1. Overview</h2>
        <p>
          This Refund Policy outlines the terms under which refunds may be issued for purchases
          made on {PLATFORM.name}, operated by {PLATFORM.entity}.
        </p>
      </section>

      <section className={styles.section}>
        <h2>2. Subscription Plans</h2>
        <p>
          Subscription fees (Plan I: Essential, Plus, Premier) are non-refundable. Subscriptions
          may be cancelled at any time to prevent future billing, but no partial refunds will be
          issued for the current billing period.
        </p>
      </section>

      <section className={styles.section}>
        <h2>3. Tokens</h2>
        <p>
          Token purchases are non-refundable once tokens have been issued to your account. Tokens
          represent prepaid service credits and have no cash value once allocated.
        </p>
      </section>

      <section className={styles.section}>
        <h2>4. TMP Service Plans</h2>
        <p>
          Tax Monitor Pro service plans (Plan II: Bronze, Silver, Gold, Snapshot, MFJ add-on) are
          eligible for a full refund within 72 hours of purchase, provided no tokens have been
          used or services rendered under the plan. Once token usage or service delivery has begun,
          the plan is non-refundable.
        </p>
      </section>

      <section className={styles.section}>
        <h2>5. Billing Errors</h2>
        <p>
          If you believe you have been charged in error, you have a 7-day window from the date of
          the charge to contact us and request a review. We will investigate billing discrepancies
          and issue corrections where appropriate.
        </p>
      </section>

      <section className={styles.section}>
        <h2>6. How to Request a Refund</h2>
        <p>
          To request a refund, contact us at{" "}
          <a href={`mailto:${PLATFORM.email}`} className={styles.link}>{PLATFORM.email}</a>{" "}
          with your account email, transaction details, and reason for the request. We will
          respond within 3 business days.
        </p>
      </section>

      <section className={styles.section}>
        <h2>7. Contact</h2>
        <p>
          For questions about this Refund Policy, contact us at{" "}
          <a href={`mailto:${PLATFORM.email}`} className={styles.link}>{PLATFORM.email}</a>.
        </p>
        <p>{PLATFORM.entity}<br />{PLATFORM.domain}</p>
      </section>
    </>
  );
}

const CONTENT_MAP: Record<LegalType, () => React.ReactElement> = {
  privacy: PrivacyContent,
  terms: TermsContent,
  refunds: RefundsContent,
};

export default function LegalPage({ type }: LegalPageProps) {
  const Content = CONTENT_MAP[type];

  return (
    <main className={styles.page}>
      <article className={styles.container}>
        <Content />
      </article>
    </main>
  );
}
