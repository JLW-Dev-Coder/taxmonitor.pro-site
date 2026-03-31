'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import StepProgress from '@/components/StepProgress'
import styles from './page.module.css'

const STEPS = ['Inquiry', 'Intake', 'Offer', 'Agreement', 'Payment']

export default function AgreementPage() {
  const router = useRouter()
  const [agreed, setAgreed] = useState(false)

  function handleAccept() {
    if (!agreed) return

    let planId = ''
    try {
      const offerRaw = sessionStorage.getItem('offer_data')
      if (offerRaw) {
        const offerData = JSON.parse(offerRaw)
        planId = offerData.plan_id || ''
      }
    } catch {
      /* ignore */
    }

    sessionStorage.setItem(
      'agreement_data',
      JSON.stringify({
        agreed: true,
        timestamp: new Date().toISOString(),
        plan_id: planId,
      })
    )

    router.push('/payment')
  }

  return (
    <>
      <Header variant="site" />
      <main className={styles.main}>
        <div className={styles.stepperWrap}>
          <StepProgress steps={STEPS} current={3} />
        </div>

        <section className={styles.hero}>
          <h1 className={styles.heroTitle}>Service Agreement</h1>
          <p className={styles.heroSub}>Please review and accept the terms below.</p>
        </section>

        <div className={styles.content}>
          <div className={styles.logoBadge}>
            <span className={styles.logoChip}>TM</span>
          </div>

          <h2 className={styles.agreementTitle}>SERVICE AGREEMENT AND CONTRACT</h2>
          <p className={styles.agreementSubtitle}>Tax Monitor Service / Provided by Tax Monitor Pro</p>

          <div className={styles.prose}>
            <p>
              This Service Agreement (&ldquo;Agreement&rdquo;) governs the Tax Monitor Service provided by Tax Monitor Pro (&ldquo;Company&rdquo;). By submitting payment or otherwise enrolling in this service, the Client agrees to the terms outlined below.
            </p>

            <p>
              This service is limited to monitoring and reporting activities only and does not include tax resolution, negotiation, filing, representation, or enforcement intervention unless expressly agreed to in a separate written contract.
            </p>

            <h3 className={styles.sectionHeading}>Client Responsibilities</h3>

            <ol className={styles.numberedList}>
              <li>
                Client agrees to provide complete, accurate, and timely information requested for monitoring purposes within forty-eight (48) hours unless otherwise agreed.
              </li>
              <li>
                Client acknowledges responsibility for the accuracy of all information provided, including income, assets, liabilities, filing history, and IRS correspondence.
              </li>
              <li>
                Failure to respond after three (3) documented contact attempts may result in suspension or termination of monitoring services without refund.
              </li>
              <li>
                Client agrees not to alter or submit any documents prepared by the Company without written authorization.
              </li>
              <li>
                Cancellation is available within forty-eight (48) hours of payment by contacting support@taxmonitor.pro. Cancellation stops future billing. <strong>All service fees are non-refundable once services begin, including any work performed, records accessed, or insights delivered.</strong>
              </li>
            </ol>

            <h3 className={styles.sectionHeading}>Married Filing Jointly (MFJ) Years</h3>

            <p>
              If the Client&rsquo;s tax account includes any tax year filed as Married Filing Jointly (MFJ), the monitoring engagement must include both the primary and secondary taxpayers listed on the joint return for those years. This is required because the IRS treats both parties as equally liable for the full tax obligation on a jointly filed return.
            </p>

            <p>
              The Client agrees to provide the necessary identifying information and authorization for both taxpayers for any MFJ year included in the monitoring scope. This may include names, Social Security Numbers, dates of birth, and signed consent forms as needed to access account records from the IRS.
            </p>

            <p>
              If the secondary taxpayer is unwilling or unable to provide authorization, the Company reserves the right to exclude the MFJ year(s) from the monitoring scope or to limit the depth of reporting for those periods.
            </p>

            <p>
              An additional fee applies for MFJ year coverage, as outlined in the selected plan details. This fee accounts for the added complexity of monitoring two taxpayer accounts and cross-referencing joint liabilities, payments, and compliance records.
            </p>

            <p>
              The Client acknowledges that excluding MFJ years from monitoring may result in an incomplete picture of overall tax account status, and the Company is not responsible for gaps arising from incomplete authorization.
            </p>

            <h3 className={styles.sectionHeading}>Company Responsibilities</h3>

            <ol className={styles.numberedList} start={6}>
              <li>
                Tax Monitor Pro will monitor authorized tax account data and provide informational updates during the monitoring period.
              </li>
              <li>
                Original documents provided by the Client will be returned upon conclusion of the engagement. Copies retained are for documentation purposes only.
              </li>
              <li>
                The Company maintains reasonable administrative, technical, and physical safeguards to protect nonpublic personal information.
              </li>
              <li>
                Electronic data transmission and storage may involve secure third-party systems necessary to deliver services efficiently.
              </li>
            </ol>

            <h3 className={styles.sectionHeading}>Scope Limitation</h3>

            <p>
              This Agreement does not include IRS representation, negotiations, payment arrangements, offers in compromise, appeals, or enforcement resolution unless authorized in writing through a separate Representation Agreement and Power of Attorney.
            </p>

            <h3 className={styles.sectionHeading}>Acceptance</h3>

            <p>
              By signing electronically, the Client acknowledges that this Agreement is legally binding and enforceable to the same extent as a handwritten signature.
            </p>
          </div>

          <div className={styles.checkboxWrap}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <span>I have read and accept this Service Agreement.</span>
            </label>
          </div>

          <p className={styles.notice}>
            By continuing, you agree to the{' '}
            <a href="/legal/terms" className={styles.link}>Terms</a> and{' '}
            <a href="/legal/privacy" className={styles.link}>Privacy Policy</a>.
            Monitoring does not create IRS representation.
          </p>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.backButton}
              onClick={() => router.push('/offer')}
            >
              &larr; Back
            </button>
            <button
              type="button"
              className={styles.acceptButton}
              disabled={!agreed}
              onClick={handleAccept}
            >
              Accept &amp; Continue &rarr;
            </button>
          </div>
        </div>
      </main>
    </>
  )
}
