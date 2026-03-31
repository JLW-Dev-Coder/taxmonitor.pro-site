"use client";

import Link from "next/link";
import styles from "./SiteFooter.module.css";

const PLATFORM_LINKS = [
  { label: "About", href: "#about" },
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
];

const RESOURCE_LINKS = [
  { label: "Resources", href: "/resources" },
  { label: "Contact", href: "/contact" },
  { label: "Support", href: "/support" },
  { label: "Affiliates", href: "/affiliate" },
];

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Refund Policy", href: "/refunds" },
];

const VLP_ECOSYSTEM = [
  { label: "Virtual Launch Pro", href: "https://virtuallaunch.pro" },
  { label: "Tax Monitor Pro", href: "https://taxmonitor.pro" },
  { label: "RealBooks Pro", href: "https://realbooks.pro" },
  { label: "PayStream Pro", href: "https://paystream.pro" },
  { label: "Virtual Compliance Pro", href: "https://virtualcompliance.pro" },
  { label: "Virtual Staff Pro", href: "https://virtualstaff.pro" },
  { label: "Virtual Capital Pro", href: "https://virtualcapital.pro" },
  { label: "LeadEngine Pro", href: "https://leadengine.pro" },
];

export default function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.columns}>
          <div className={styles.column}>
            <h4 className={styles.columnTitle}>Platform</h4>
            <ul className={styles.list}>
              {PLATFORM_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={styles.link}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.column}>
            <h4 className={styles.columnTitle}>Resources</h4>
            <ul className={styles.list}>
              {RESOURCE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={styles.link}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className={styles.affiliateCallout}>
              Earn 20% — Affiliate Program
            </p>
          </div>

          <div className={styles.column}>
            <h4 className={styles.columnTitle}>Legal</h4>
            <ul className={styles.list}>
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={styles.link}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.column}>
            <h4 className={styles.columnTitle}>VLP Ecosystem</h4>
            <ul className={styles.list}>
              {VLP_ECOSYSTEM.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className={styles.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className={styles.bottom}>
          <p className={styles.copyright}>
            &copy; 2026 Lenore, Inc. All rights reserved.
          </p>
          <div className={styles.bottomLinks}>
            {LEGAL_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={styles.bottomLink}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
