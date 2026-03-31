import Link from "next/link";
import styles from "./Footer.module.css";

const PLATFORM_LINKS = [
  { label: "About", href: "#about" },
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "/pricing" },
  { label: "Directory", href: "/directory" },
  { label: "Contact", href: "/contact" },
];

const RESOURCE_LINKS = [
  { label: "Support", href: "/support" },
  { label: "Affiliates", href: "/affiliates" },
  {
    label: "Transcript Monitor",
    href: "https://transcript.taxmonitor.pro",
    external: true,
  },
  {
    label: "Tax Tools Arcade",
    href: "https://taxtools.taxmonitor.pro",
    external: true,
  },
  {
    label: "Virtual Launch Pro",
    href: "https://virtuallaunch.pro",
    external: true,
  },
  {
    label: "Developers VLP",
    href: "https://developers.virtuallaunch.pro",
    external: true,
  },
];

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Refund Policy", href: "/refunds" },
];

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          {/* Column 1 — Brand */}
          <div className={styles.brand}>
            <div className={styles.brandHeader}>
              <div className={styles.brandIcon}>
                TM
              </div>
              <div>
                <p className={styles.brandName}>
                  Tax Monitor Pro
                </p>
                <p className={styles.brandTagline}>
                  Proactive tax monitoring
                </p>
              </div>
            </div>
            <p className={styles.brandDescription}>
              Find the right tax pro for your situation — then stay ahead of IRS
              activity with automatic monitoring, plain-English alerts, and tools
              that give you clarity before problems grow.
            </p>
            <div className={styles.brandButtons}>
              <Link
                href="/signup"
                className={styles.btnPrimary}
              >
                Start Here &rarr;
              </Link>
              <Link
                href="/pricing"
                className={styles.btnSecondary}
              >
                View Pricing
              </Link>
            </div>
          </div>

          {/* Column 2 — Platform */}
          <div className={styles.column}>
            <h4 className={styles.columnTitle}>Platform</h4>
            <ul className={styles.columnList}>
              {PLATFORM_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={styles.columnLink}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 — Resources */}
          <div className={styles.column}>
            <h4 className={styles.columnTitle}>Resources</h4>
            <ul className={styles.columnList}>
              {RESOURCE_LINKS.map((link) => (
                <li key={link.href}>
                  {"external" in link ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.columnLink}
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className={styles.columnLink}
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 — Legal */}
          <div className={styles.column}>
            <h4 className={styles.columnTitle}>Legal</h4>
            <ul className={styles.columnList}>
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={styles.columnLink}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className={styles.copyright}>
              &copy; 2026 Lenore, Inc. All rights reserved.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className={styles.bottomBar}>
          <div className={styles.bottomBarInner}>
            <p className={styles.bottomText}>
              &copy; 2026 Lenore, Inc.
            </p>
            <p className={styles.bottomText}>
              Earn 20% on every referral —{" "}
              <Link
                href="/affiliates"
                className={styles.affiliateLink}
              >
                Join the Affiliate Program
              </Link>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
