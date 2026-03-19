/**
 * tailwind.config.ts
 * Tax Monitor Pro — Design Tokens
 *
 * Tokens extracted from site/index.html, site/partials/header.html,
 * and site/pricing.html (the live marketing + app HTML source).
 *
 * Color palette: dark-first (slate-950 base), amber brand, sky accent.
 * Typography: Sora (marketing/display), DM Sans (app UI).
 * Custom letter-spacing: extracted from .future-* CSS classes in site/index.html.
 */

import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ─── Colors ────────────────────────────────────────────────────────────
      // Source: radial-gradient / text color usage across site/ HTML
      colors: {
        brand: {
          DEFAULT:  '#F59E0B', // amber-500 — logo bg, gradient-text start, cta buttons
          muted:    '#D97706', // amber-600 — gradient-text end, hover states
          soft:     '#FCD34D', // amber-300 — hover links (group-hover:text-amber-300)
        },
        accent: {
          DEFAULT:  '#7DD3FC', // sky-300 — network nodes, scan sweep, bg-ring glow
          mid:      '#0EA5E9', // sky-500 — beacon gradient inner
          blue:     '#3B82F6', // blue-500 — bg-blob-2 radial gradient
        },
        surface: {
          base:     '#020617', // slate-950 — html/body bg, header bg, mega-menu bg
          elevated: '#0F172A', // slate-900 — card backgrounds, billing-toggle active
          card:     '#1E293B', // slate-800 — card borders, resource-menu card bg
        },
        // Text colors on dark surfaces
        content: {
          DEFAULT:  '#F1F5F9', // slate-100 — card headings, menu item titles
          body:     '#CBD5E1', // slate-300 — nav links, body text on dark
          muted:    '#94A3B8', // slate-400 — sub-labels, meta text, border colors
          dim:      '#475569', // slate-600 — placeholder / ghost text
          ghost:    '#334155', // slate-700 — very dim borders
        },
      },

      // ─── Font Families ────────────────────────────────────────────────────
      // Source: @import url() in site/index.html and site/pricing.html
      fontFamily: {
        sans:    ['DM Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Sora', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },

      // ─── Letter Spacing ───────────────────────────────────────────────────
      // Source: .future-eyebrow, .future-kicker, .future-micro, .future-headline,
      //         .future-section-title CSS classes in site/index.html
      letterSpacing: {
        eyebrow:  '0.28em',   // .future-eyebrow — section labels
        kicker:   '0.22em',   // .future-kicker  — feature kickers
        micro:    '0.18em',   // .future-micro   — tiny uppercase badges
        headline: '-0.045em', // .future-headline — large display headings
        section:  '-0.035em', // .future-section-title — section titles
      },

      // ─── Line Heights ─────────────────────────────────────────────────────
      // Source: .future-headline line-height: 0.96, .future-section-title 1.02
      lineHeight: {
        headline: '0.96',
        section:  '1.02',
      },

      // ─── Background gradients ─────────────────────────────────────────────
      // Source: .gradient-text in site/index.html and site/pricing.html
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #F59E0B, #D97706)',
        'gradient-logo':  'linear-gradient(to bottom right, #F59E0B, #D97706)',
      },
    },
  },
  plugins: [],
}

export default config
