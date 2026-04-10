'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import { api } from '@/lib/api'
import { filterSampleProfiles } from '@/lib/sample-profiles'
import type { DirectoryProfessional } from '@/lib/sample-profiles'
import styles from './page.module.css'

type Professional = DirectoryProfessional & {
  has_booking?: boolean
}

const PROFESSION_OPTIONS = [
  { value: '', label: 'All Professions' },
  { value: 'cpa', label: 'CPA' },
  { value: 'ea', label: 'Enrolled Agent' },
  { value: 'tax attorney', label: 'Tax Attorney' },
  { value: 'afsp', label: 'AFSP' },
  { value: 'rtrp', label: 'RTRP' },
  { value: 'tax preparer', label: 'Tax Preparer' },
  { value: 'bookkeeper', label: 'Bookkeeper' },
  { value: 'financial advisor', label: 'Financial Advisor' },
  { value: 'other', label: 'Other' },
]

const AVAILABILITY_OPTIONS = [
  { value: '', label: 'Any Availability' },
  { value: 'available', label: 'Available Now' },
]

const US_STATES = [
  ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'],
  ['CA', 'California'], ['CO', 'Colorado'], ['CT', 'Connecticut'], ['DE', 'Delaware'],
  ['DC', 'District of Columbia'], ['FL', 'Florida'], ['GA', 'Georgia'], ['HI', 'Hawaii'],
  ['ID', 'Idaho'], ['IL', 'Illinois'], ['IN', 'Indiana'], ['IA', 'Iowa'],
  ['KS', 'Kansas'], ['KY', 'Kentucky'], ['LA', 'Louisiana'], ['ME', 'Maine'],
  ['MD', 'Maryland'], ['MA', 'Massachusetts'], ['MI', 'Michigan'], ['MN', 'Minnesota'],
  ['MS', 'Mississippi'], ['MO', 'Missouri'], ['MT', 'Montana'], ['NE', 'Nebraska'],
  ['NV', 'Nevada'], ['NH', 'New Hampshire'], ['NJ', 'New Jersey'], ['NM', 'New Mexico'],
  ['NY', 'New York'], ['NC', 'North Carolina'], ['ND', 'North Dakota'], ['OH', 'Ohio'],
  ['OK', 'Oklahoma'], ['OR', 'Oregon'], ['PA', 'Pennsylvania'], ['RI', 'Rhode Island'],
  ['SC', 'South Carolina'], ['SD', 'South Dakota'], ['TN', 'Tennessee'], ['TX', 'Texas'],
  ['UT', 'Utah'], ['VT', 'Vermont'], ['VA', 'Virginia'], ['WA', 'Washington'],
  ['WV', 'West Virginia'], ['WI', 'Wisconsin'], ['WY', 'Wyoming'],
] as const

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getSpecialtyClass(specialty: string): string {
  const lower = specialty.toLowerCase()
  if (lower.includes('attorney')) return styles.badgeAttorney
  if (lower.includes('cpa')) return styles.badgeCpa
  if (lower.includes('enrolled agent') || lower === 'ea') return styles.badgeEa
  if (lower.includes('erpa')) return styles.badgeErpa
  if (lower.includes('actuary')) return styles.badgeActuary
  return styles.badgeDefault
}

export default function DirectoryPage() {
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [profession, setProfession] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [availability, setAvailability] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zip, setZip] = useState('')
  const [showSamples, setShowSamples] = useState(true)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchDirectory = useCallback(
    async (params: { specialty?: string; city?: string; state?: string; zip?: string }) => {
      setLoading(true)
      setError('')
      try {
        const clean: Record<string, string> = {}
        if (params.specialty) clean.specialty = params.specialty
        if (params.city) clean.city = params.city
        if (params.state) clean.state = params.state
        if (params.zip) clean.zip = params.zip

        let apiResults: Professional[] = []
        try {
          const res = await api.getDirectory(
            Object.keys(clean).length > 0 ? clean : undefined
          )
          apiResults = (res.professionals || []).map((p) => {
            const specArray = p.specialties
              ? p.specialties.split(',').map((s) => s.trim()).filter(Boolean)
              : []
            const loc = [p.city, p.state].filter(Boolean).join(', ')
            return {
              professional_id: p.professional_id,
              name: p.display_name,
              title: specArray.join(' / ') || 'Tax Professional',
              specialty: specArray,
              location: loc,
              avatar_url: '',
              verified: false,
              city: p.city || '',
              state: p.state || '',
              zip: p.zip || '',
              profession: specArray,
              sample: false,
              has_booking: Boolean(p.cal_booking_url),
            }
          })
        } catch {
          /* API unavailable — fall through to samples */
        }

        const sampleResults = filterSampleProfiles(
          Object.keys(clean).length > 0 ? clean : undefined
        )

        /* Merge: API results first, then samples not already present */
        const apiIds = new Set(apiResults.map((p) => p.professional_id))
        const merged = [
          ...apiResults,
          ...sampleResults.filter((s) => !apiIds.has(s.professional_id)),
        ]

        setProfessionals(merged)
      } catch {
        setError('Failed to load directory. Please try again.')
      } finally {
        setLoading(false)
      }
    },
    []
  )

  /* Initial fetch */
  useEffect(() => {
    fetchDirectory({})
  }, [fetchDirectory])

  /* Debounced filter changes — send specialty (server-side) filter */
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchDirectory({ specialty, city, state, zip })
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [specialty, city, state, zip, fetchDirectory])

  /* Client-side filtering for profession and availability */
  const visibleProfessionals = professionals.filter((p) => {
    if (!showSamples && p.sample) return false
    if (profession) {
      const profLower = profession.toLowerCase()
      const match = p.specialty.some((s) => s.toLowerCase().includes(profLower)) ||
        (Array.isArray(p.profession) && p.profession.some((pr) =>
          typeof pr === 'string' && pr.toLowerCase().includes(profLower)
        ))
      if (!match) return false
    }
    if (availability === 'available') {
      if (!p.has_booking && !p.sample) return false
    }
    return true
  })

  /* Collect distinct specialties from loaded profiles for the specialty dropdown */
  const distinctSpecialties = Array.from(
    new Set(
      professionals.flatMap((p) => p.specialty).filter(Boolean)
    )
  ).sort()

  return (
    <>
      <Header variant="site" />

      <main className={styles.main}>
        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroGlow} />
          <div className={styles.heroInner}>
            <div className={styles.heroPill}>
              <svg
                className={styles.heroPillIcon}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
                width="16"
                height="16"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <span>Find tax professionals by specialty, credentials, and fit</span>
            </div>

            <h1 className={styles.heroTitle}>
              Find the Right{' '}
              <span className={styles.gradientText}>Tax Professional</span>
            </h1>

            <p className={styles.heroSubtitle}>
              Browse licensed tax professionals, compare specialties, and explore
              profiles to find the right fit for your tax situation.
            </p>
          </div>
        </section>

        {/* Filter Bar */}
        <section className={styles.filterSection}>
          <div className={styles.filterCard}>
            <div className={styles.filterGrid}>
              <div className={styles.filterField}>
                <label className={styles.filterFieldLabel}>City</label>
                <input
                  type="text"
                  className={styles.filterInput}
                  placeholder="Search by city..."
                  list="directory-cities"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
                <datalist id="directory-cities">
                  {Array.from(
                    new Set(
                      professionals
                        .map((p) => p.city)
                        .filter((c): c is string => Boolean(c))
                    )
                  ).sort().map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>

              <div className={styles.filterField}>
                <label className={styles.filterFieldLabel}>State</label>
                <select
                  className={styles.filterSelect}
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                >
                  <option value="">All States</option>
                  {US_STATES.map(([code, name]) => (
                    <option key={code} value={code}>{name}</option>
                  ))}
                </select>
              </div>

              <div className={styles.filterField}>
                <label className={styles.filterFieldLabel}>Zip</label>
                <input
                  type="text"
                  className={styles.filterInput}
                  placeholder="Zip code"
                  maxLength={5}
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                />
              </div>

              <div className={styles.filterField}>
                <label className={styles.filterFieldLabel}>Profession</label>
                <select
                  className={styles.filterSelect}
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                >
                  {PROFESSION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.filterField}>
                <label className={styles.filterFieldLabel}>Specialty</label>
                <select
                  className={styles.filterSelect}
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                >
                  <option value="">All Specialties</option>
                  {distinctSpecialties.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className={styles.filterField}>
                <label className={styles.filterFieldLabel}>Availability</label>
                <select
                  className={styles.filterSelect}
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                >
                  {AVAILABILITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.filterActions}>
              {(profession || specialty || availability || city || state || zip) && (
                <button
                  type="button"
                  className={styles.clearBtn}
                  onClick={() => {
                    setProfession('')
                    setSpecialty('')
                    setAvailability('')
                    setCity('')
                    setState('')
                    setZip('')
                  }}
                >
                  <svg
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  Clear All
                </button>
              )}

              <label className={styles.toggleLabel}>
                <input
                  type="checkbox"
                  className={styles.toggleInput}
                  checked={showSamples}
                  onChange={(e) => setShowSamples(e.target.checked)}
                />
                <span className={styles.toggleSwitch} />
                Show sample profiles
              </label>
            </div>
          </div>
        </section>

        {/* Results */}
        <section className={styles.resultsSection}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionAccent} />
            <h2 className={styles.sectionTitle}>All Professionals</h2>
            {!loading && !error && (
              <span className={styles.resultsCount}>
                Showing {visibleProfessionals.length} professional
                {visibleProfessionals.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Loading skeleton */}
          {loading && (
            <div className={styles.grid}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={styles.skeletonCard}>
                  <div className={styles.skeletonHeader}>
                    <div className={styles.skeletonAvatar} />
                    <div className={styles.skeletonLines}>
                      <div className={styles.skeletonLine} />
                      <div className={styles.skeletonLineShort} />
                    </div>
                  </div>
                  <div className={styles.skeletonBody} />
                  <div className={styles.skeletonFooter} />
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <svg
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                  width="40"
                  height="40"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className={styles.emptyTitle}>{error}</h3>
              <button
                type="button"
                className={styles.retryBtn}
                onClick={() => fetchDirectory({ specialty, city, state, zip })}
              >
                Try Again
              </button>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && visibleProfessionals.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <svg
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                  width="40"
                  height="40"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5h-6"
                  />
                </svg>
              </div>
              <h3 className={styles.emptyTitle}>
                No professionals found matching your criteria
              </h3>
              <p className={styles.emptyDesc}>
                Try adjusting your filters or search terms.
              </p>
              <button
                type="button"
                className={styles.retryBtn}
                onClick={() => {
                  setProfession('')
                  setSpecialty('')
                  setAvailability('')
                  setCity('')
                  setState('')
                  setZip('')
                }}
              >
                Clear All Filters
              </button>
            </div>
          )}

          {/* Professional cards */}
          {!loading && !error && visibleProfessionals.length > 0 && (
            <div className={styles.grid}>
              {visibleProfessionals.map((pro) => (
                <Link
                  key={pro.professional_id}
                  href={`/directory/profile?id=${pro.professional_id}`}
                  className={styles.card}
                >
                  <div className={styles.cardHeader}>
                    <div className={styles.avatar}>
                      {pro.avatar_url ? (
                        <img
                          src={pro.avatar_url}
                          alt={pro.name}
                          className={styles.avatarImg}
                        />
                      ) : (
                        <span className={styles.avatarInitials}>
                          {getInitials(pro.name)}
                        </span>
                      )}
                    </div>
                    <div className={styles.cardMeta}>
                      <div className={styles.cardNameRow}>
                        <h3 className={styles.cardName}>{pro.name}</h3>
                        {pro.verified && (
                          <span className={styles.verifiedBadge}>
                            <svg
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2}
                              viewBox="0 0 24 24"
                              width="14"
                              height="14"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                              />
                            </svg>
                          </span>
                        )}
                      </div>
                      <p className={styles.cardTitle}>{pro.title}</p>
                    </div>
                  </div>

                  <div className={styles.cardBadges}>
                    {pro.specialty.map((s) => (
                      <span
                        key={s}
                        className={`${styles.badge} ${getSpecialtyClass(s)}`}
                      >
                        {s}
                      </span>
                    ))}
                    {pro.sample && (
                      <span className={`${styles.badge} ${styles.badgeSample}`}>
                        Sample
                      </span>
                    )}
                  </div>

                  <div className={styles.cardFooter}>
                    <div className={styles.cardLocation}>
                      <svg
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                        width="14"
                        height="14"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span>{pro.location}</span>
                    </div>
                    <span className={styles.viewLink}>
                      View
                      <svg
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                        width="16"
                        height="16"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* List Your Practice CTA */}
        <section className={styles.ctaSectionStd}>
          <div className={styles.ctaInnerStd}>
            <h2 className={styles.ctaHeadlineStd}>Are You a <span className="gradient-text">Tax Professional</span>?</h2>
            <p className={styles.ctaDescStd}>
              Join the Tax Monitor Pro directory and connect with taxpayers
              looking for licensed professionals like you. Get featured
              placement, verified badges, and client inquiries delivered
              directly to your inbox.
            </p>
            <a href="https://virtuallaunch.pro" target="_blank" rel="noopener noreferrer" className={styles.ctaButtonStd}>
              List Your Practice &rarr;
            </a>
            <p className={styles.ctaDisclaimerStd}>No obligation. <a href="https://virtuallaunch.pro/about" target="_blank" rel="noopener noreferrer">Learn more</a> about directory listings.</p>
          </div>
        </section>
      </main>

    </>
  )
}
