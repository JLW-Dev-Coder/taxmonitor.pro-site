import Link from "next/link";

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
    <footer className="bg-slate-950 border-t border-slate-800/60">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-10 md:grid-cols-[1.35fr_1fr_1fr_1fr] md:items-start md:gap-x-16">
          {/* Column 1 — Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 font-bold text-slate-950 text-sm">
                TM
              </div>
              <div>
                <p className="font-semibold tracking-tight text-white">
                  Tax Monitor Pro
                </p>
                <p className="text-xs text-slate-400">
                  Proactive tax monitoring
                </p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-slate-400">
              Find the right tax pro for your situation — then stay ahead of IRS
              activity with automatic monitoring, plain-English alerts, and tools
              that give you clarity before problems grow.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
              >
                Start Here &rarr;
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center rounded-lg border border-slate-800/70 bg-slate-950/40 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-900"
              >
                View Pricing
              </Link>
            </div>
          </div>

          {/* Column 2 — Platform */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white">Platform</h4>
            <ul className="space-y-2">
              {PLATFORM_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-300 transition hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 — Resources */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white">Resources</h4>
            <ul className="space-y-2">
              {RESOURCE_LINKS.map((link) => (
                <li key={link.href}>
                  {"external" in link ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-slate-300 transition hover:text-white"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-sm text-slate-300 transition hover:text-white"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 — Legal */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white">Legal</h4>
            <ul className="space-y-2">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-300 transition hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="text-xs text-slate-500 mt-4">
              &copy; 2026 Lenore, Inc. All rights reserved.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-800/60 mt-10 pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              &copy; 2026 Lenore, Inc.
            </p>
            <p className="text-sm text-slate-500">
              Earn 20% on every referral —{" "}
              <Link
                href="/affiliates"
                className="text-sm text-amber-500 hover:text-amber-400"
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
