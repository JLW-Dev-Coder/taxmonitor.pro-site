'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import { api } from '@/lib/api'
import styles from './page.module.css'

interface Professional {
  professional_id: string
  name: string
  title: string
  specialty: string[]
  location: string
  avatar_url: string
  verified: boolean
}

const SPECIALTY_OPTIONS = [
  { value: '', label: 'All Specialties' },
  { value: 'attorney', label: 'Attorney' },
  { value: 'cpa', label: 'CPA' },
  { value: 'ea', label: 'Enrolled Agent' },
  { value: 'erpa', label: 'ERPA' },
  { value: 'actuary', label: 'Enrolled Actuary' },
]

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
  const [specialty, setSpecialty] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zip, setZip] = useState('')
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

        const res = await api.getDirectory(
          Object.keys(clean).length > 0 ? clean : undefined
        )
        setProfessionals(res.professionals)
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

  /* Debounced filter changes */
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchDirectory({ specialty, city, state, zip })
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [specialty, city, state, zip, fetchDirectory])

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
            <div className={styles.searchRow}>
              <svg
                className={styles.searchIcon}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
                width="20"
                height="20"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                className={styles.locationInput}
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              <input
                type="text"
                className={styles.locationInput}
                placeholder="State"
                maxLength={2}
                value={state}
                onChange={(e) => setState(e.target.value)}
              />
              <input
                type="text"
                className={styles.locationInput}
                placeholder="Zip"
                maxLength={5}
                value={zip}
                onChange={(e) => setZip(e.target.value)}
              />
            </div>

            <div className={styles.filterRow}>
              <span className={styles.filterLabel}>
                <svg
                  className={styles.filterLabelIcon}
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
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
                Specialty:
              </span>

              <select
                className={styles.specialtySelect}
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
              >
                {SPECIALTY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              {(specialty || city || state || zip) && (
                <button
                  type="button"
                  className={styles.clearBtn}
                  onClick={() => {
                    setSpecialty('')
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
                Showing {professionals.length} professional
                {professionals.length !== 1 ? 's' : ''}
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
          {!loading && !error && professionals.length === 0 && (
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
                  setSpecialty('')
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
          {!loading && !error && professionals.length > 0 && (
            <div className={styles.grid}>
              {professionals.map((pro) => (
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
        <section className={styles.ctaSection}>
          <div className={styles.ctaCard}>
            <div className={styles.ctaGlow} />
            <div className={styles.ctaContent}>
              <h2 className={styles.ctaTitle}>
                Are You a Tax Professional?
              </h2>
              <p className={styles.ctaDesc}>
                Join the Tax Monitor Pro directory and connect with taxpayers
                looking for licensed professionals like you. Get featured
                placement, verified badges, and client inquiries delivered
                directly to your inbox.
              </p>
              <div className={styles.ctaActions}>
                <Link href="/inquiry" className={styles.ctaPrimary}>
                  List Your Practice
                  <svg
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </Link>
                <Link href="/contact" className={styles.ctaSecondary}>
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

    </>
  )
}
