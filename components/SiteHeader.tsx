"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import styles from "./SiteHeader.module.css";

const NAV_LINKS = [
  { label: "About", href: "#about" },
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Resources", href: "/resources" },
  { label: "Contact", href: "/contact" },
];

export default function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  return (
    <>
      <header
        className={`${styles.header} ${scrolled ? styles.scrolled : ""}`}
      >
        <div className={styles.inner}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoMark}>TM</span>
            <span className={styles.logoText}>Tax Monitor Pro</span>
          </Link>

          <nav className={styles.nav}>
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={styles.navLink}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className={styles.actions}>
            <Link href="/login" className={styles.loginLink}>
              Log In
            </Link>
            <Link href="/signup" className={styles.ctaButton}>
              Start Here &rarr;
            </Link>
          </div>

          <button
            className={styles.hamburger}
            onClick={() => setDrawerOpen(!drawerOpen)}
            aria-label={drawerOpen ? "Close menu" : "Open menu"}
            aria-expanded={drawerOpen}
          >
            <span className={`${styles.bar} ${drawerOpen ? styles.barOpen : ""}`} />
            <span className={`${styles.bar} ${drawerOpen ? styles.barOpen : ""}`} />
            <span className={`${styles.bar} ${drawerOpen ? styles.barOpen : ""}`} />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className={styles.backdrop} onClick={closeDrawer} />
      )}
      <div className={`${styles.drawer} ${drawerOpen ? styles.drawerOpen : ""}`}>
        <nav className={styles.drawerNav}>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={styles.drawerLink}
              onClick={closeDrawer}
            >
              {link.label}
            </Link>
          ))}
          <hr className={styles.drawerDivider} />
          <Link href="/login" className={styles.drawerLink} onClick={closeDrawer}>
            Log In
          </Link>
          <Link href="/signup" className={styles.drawerCta} onClick={closeDrawer}>
            Start Here &rarr;
          </Link>
        </nav>
      </div>
    </>
  );
}
