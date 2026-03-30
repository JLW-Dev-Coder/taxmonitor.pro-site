import Link from 'next/link'
import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.grid}>
          {/* Brand */}
          <div className={styles.brand}>
            <Link href="/" className={styles.logoLink}>
              <span className={styles.logoChip}>TM</span>
              <div className={styles.logoText}>
                <span className={styles.logoTitle}>Tax Monitor Pro</span>
                <span className={styles.logoSub}>Proactive tax monitoring</span>
              </div>
            </Link>

            <p className={styles.brandDesc}>
              Professional tax account monitoring services provided by a licensed tax professional.
            </p>

            <p className={styles.brandDisclaimer}>
              Monitoring does not create IRS representation. Representation, filing, and resolution are separate engagements.
            </p>

            <div className={styles.brandActions}>
              <Link href="/inquiry" className={styles.ctaPrimary}>
                Start Intake &rarr;
              </Link>
              <Link href="/pricing" className={styles.ctaSecondary}>
                View pricing
              </Link>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className={styles.columnTitle}>Links</h3>
            <nav className={styles.linkList}>
              <Link href="/about" className={styles.link}>About</Link>
              <Link href="/contact" className={styles.link}>Contact</Link>
              <Link href="/directory" className={styles.link}>Directory</Link>
              <Link href="/#features" className={styles.link}>Features</Link>
              <Link href="/#how-it-works" className={styles.link}>How It Works</Link>
              <Link href="/sign-in" className={styles.link}>Log In</Link>
              <Link href="/pricing" className={styles.link}>Pricing</Link>
            </nav>
          </div>

          {/* Resources */}
          <div className={styles.resourcesCol}>
            <h3 className={styles.columnTitle}>Resources</h3>
            <nav className={styles.linkList}>
              <a href="https://transcript.taxmonitor.pro/resources/how-to-read-irs-transcripts" target="_blank" rel="noopener" className={styles.link}>How to Read IRS Transcripts</a>
              <Link href="/resources/transcript-central" className={styles.link}>Transcript Central</Link>
              <a href="https://transcript.taxmonitor.pro/resources/transcript-types" target="_blank" rel="noopener" className={styles.link}>Transcript Types</a>
            </nav>

            <div className={styles.separator} />

            <nav className={styles.linkList}>
              <a href="https://transcript.taxmonitor.pro/resources/transcript-codes" target="_blank" rel="noopener" className={styles.link}>Transcript Codes Database</a>
              <a href="https://transcript.taxmonitor.pro/resources/transcript-orders" target="_blank" rel="noopener" className={styles.link}>Order Walkthrough</a>
              <a href="https://taxtools.taxmonitor.pro" target="_blank" rel="noopener" className={styles.link}>TaxTools Arcade</a>
              <a href="https://transcript.taxmonitor.pro" target="_blank" rel="noopener" className={styles.link}>Transcript Automation</a>
            </nav>

            <div className={styles.separator} />

            <nav className={styles.linkList}>
              <Link href="/#report-sample" className={styles.link}>Report Sample</Link>
              <Link href="/#transcript-sample" className={styles.link}>Transcript Sample</Link>
            </nav>
          </div>

          {/* Legal */}
          <div>
            <h3 className={styles.columnTitle}>Legal</h3>
            <div className={styles.linkList}>
              <Link href="/legal/privacy" className={styles.link}>Privacy</Link>
              <Link href="/legal/refund" className={styles.link}>Refund Policy</Link>
              <Link href="/legal/terms" className={styles.link}>Terms</Link>
            </div>

            <p className={styles.copyright}>
              &copy; {new Date().getFullYear()} Tax Monitor Pro
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
