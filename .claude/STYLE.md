# STYLE.md

Tax Monitor Pro — Design System Reference

---

## 1. Header (Identity)

- **Product:** Tax Monitor Pro (TMP)
- **Last updated:** 2026-04-04

---

## 2. Stack

- **CSS approach:** CSS Modules (per-component `.module.css` files)
- **Global tokens:** `app/globals.css` (`:root` custom properties)
- **NOT used:** Tailwind, inline styles, CSS-in-JS, Sass
- **Fonts:** DM Sans (body via `--font-body`), Sora (display via `--font-display`)
- **Font loading:** Google Fonts via `<link>` in layout

---

## 3. Design Tokens

### Colors

| Name | Variable | Value | Usage |
|------|----------|-------|-------|
| Accent | `--accent` | `#F59E0B` | CTAs, active states, brand gradient start |
| Accent hover | `--accent-hover` | `#D97706` | Hover states, brand gradient end |
| Background | `--bg` | `#020617` | Page background (slate-950) |
| Surface | `--surface` | `#0F172A` | Cards, sidebar, elevated panels |
| Surface mid | `--surface-mid` | `rgba(15, 23, 42, 0.4)` | Glass cards, translucent panels |
| Surface border | `--surface-border` | `rgba(100, 116, 139, 0.3)` | Translucent borders |
| Surface border solid | `--surface-border-solid` | `#1E293B` | Opaque borders, dividers |
| Text | `--text` | `#E2E8F0` | Primary text |
| Text muted | `--text-muted` | `#94A3B8` | Secondary text, labels |
| Text subtle | `--text-subtle` | `#64748B` | Tertiary text, disclaimers |
| Error | `--error` | `#EF4444` | Error states |
| Success | `--success` | `#22C55E` | Success states |
| Warning | `--warning` | `#F59E0B` | Warning states (same as accent) |

### Typography

| Token | Value |
|-------|-------|
| `--font-body` | `'DM Sans', system-ui, sans-serif` |
| `--font-display` | `'Sora', sans-serif` |
| Base line-height | `1.7` (set on `body`) |

### Layout

| Token | Value |
|-------|-------|
| `--header-height` | `64px` |
| `--max-content` | `1200px` |
| `--radius` | `12px` |
| `--radius-sm` | `8px` |

### Breakpoints

| Name | Value | Usage |
|------|-------|-------|
| Mobile | `max-width: 768px` | Sidebar collapse, stack layouts |
| Tablet+ | `min-width: 768px` | Desktop nav, grid columns |
| Desktop | `min-width: 1024px` | 3-column grids |

---

## 4. Layout Patterns

- **Max content width:** `80rem` (1280px) on marketing pages, `var(--max-content)` (1200px) in app
- **Section padding (desktop):** `3rem 1.5rem` (footer), `32px 24px` (app content)
- **Section padding (mobile):** `20px 16px` (app content), `1.5rem` (mobile menu)
- **Grid system:** CSS Grid with `gap: 2.5rem`, responsive via `grid-template-columns` at breakpoints
- **Card pattern:** `.glass-card` utility — `background: var(--surface-mid)`, `border: 1px solid var(--surface-border)`, `border-radius: var(--radius)`, `backdrop-filter: blur(12px)`

---

## 5. Button Patterns

### Primary
- `background: linear-gradient(to right, var(--accent), var(--accent-hover))`
- `color: var(--bg)` (dark text on amber)
- `padding: 0.5rem 1rem` (standard) or `0.75rem 1rem` (full-width)
- `border-radius: 0.5rem` (standard) or `0.75rem` (card CTA)
- `font-weight: 600`, `font-size: 0.875rem`
- Hover: `opacity: 0.9`

### Secondary
- `background: rgba(2, 6, 23, 0.4)` or `rgba(30, 41, 59, 0.7)`
- `border: 1px solid rgba(30, 41, 59, 0.7)` or `var(--surface-border-solid)`
- `color: var(--text)`
- Hover: `background: var(--surface)`

### Destructive / Logout
- `border: 1px solid var(--surface-border)`
- `color: var(--text-muted)`
- Hover: `border-color: var(--error)`, `color: var(--error)`

---

## 6. Typography Patterns

| Role | Size | Weight | Color | Font |
|------|------|--------|-------|------|
| Page title (h1) | — | 600–700 | `#fff` | `--font-display` |
| Section title (h2) | `0.875rem` | 600 | `#fff` | `--font-body` |
| Body text | `0.875rem` | 400 | `var(--text)` | `--font-body` |
| Muted text | `0.875rem` | 400 | `var(--text-muted)` | `--font-body` |
| Subtle / disclaimer | `0.75rem` | 400 | `var(--text-subtle)` | `--font-body` |
| Badge / label | `0.75rem` | 500–600 | varies | `--font-body` |
| Nav link | `0.875rem` | 400–500 | `var(--text-muted)` → `#fff` on hover | `--font-body` |

---

## 7. Existing Components (reuse, do not recreate)

| Component | File | Description |
|-----------|------|-------------|
| AppShell | `components/AppShell.tsx` | Sidebar + topbar + content layout for authenticated pages |
| AuthGuard | `components/AuthGuard.tsx` | Auth check wrapper with loading/redirect |
| Footer | `components/Footer.tsx` | Site-wide footer with nav columns |
| Header | `components/Header.tsx` | Site-wide header with nav + resources dropdown |
| PlanCard | `components/PlanCard.tsx` | Pricing tier card with badge, features, CTA |
| SiteBackground | `components/SiteBackground.tsx` | Animated gradient background |
| StepProgress | `components/StepProgress.tsx` | Multi-step progress indicator |

All components live in `components/` with co-located `.module.css` files.

---

## 8. Page File Pattern

Every new page needs:
1. `app/{route}/page.tsx` — React component (default export)
2. `app/{route}/page.module.css` — Co-located CSS Module

Naming conventions:
- Route folders: kebab-case (`payment-success`, `sign-in`)
- CSS class names: camelCase in modules (`styles.glassCard`)
- Component files: PascalCase (`PlanCard.tsx`)

---

## 9. Self-Check Before Delivering

- [ ] All colors use CSS variables from `globals.css`, not hardcoded hex
- [ ] Responsive at 768px breakpoint minimum
- [ ] CSS classes use camelCase in modules
- [ ] No Tailwind classes, no inline styles
- [ ] Reuse existing components before creating new ones
- [ ] Font imports use `--font-body` / `--font-display` variables
- [ ] Buttons follow primary/secondary patterns above
- [ ] Cards use `.glass-card` utility or equivalent token-based styling
- [ ] `border-radius` uses `var(--radius)` or `var(--radius-sm)`
