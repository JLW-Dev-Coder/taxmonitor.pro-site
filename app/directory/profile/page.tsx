'use client'

/**
 * Professional profile page.
 *
 * Uses a query parameter (?id=<professional_id>) instead of a dynamic
 * Next.js route because output: 'export' doesn't support dynamic routes
 * with runtime-only params.
 *
 * Cloudflare Pages _redirects maps:
 *   /directory/:slug  →  /directory/profile?id=:slug
 * so end-users still see clean /directory/<slug> URLs.
 */

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import { api } from '@/lib/api'
import styles from './page.module.css'

interface Professional {
  professional_id: string
  name: string
  title: string
  bio: string
  specialty: string[]
  location: string
  avatar_url: string
  verified: boolean
}

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
  return styles.badgeDefault
}

function ProfileContent() {
  const searchParams = useSearchParams()
  const slug = searchParams.get('id') || ''

  const [professional, setProfessional] = useState<Professional | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!slug) {
      setError('No professional ID provided.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    api
      .getProfile(slug)
      .then((res) => {
        setProfessional(res.professional)
      })
      .catch(() => {
        setError('Profile not found or could not be loaded.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [slug])

  return (
    <main className={styles.main}>
      {/* Back nav */}
      <div className={styles.backBar}>
        <div className={styles.backBarInner}>
          <Link href="/directory" className={styles.backLink}>
            <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width="20" height="20">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Directory</span>
          </Link>

          {!loading && professional?.verified && (
            <span className={styles.verifiedPill}>
              <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width="14" height="14">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Verified
            </span>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className={styles.loadingWrap}>
          <section className={styles.heroSkeleton}>
            <div className={styles.heroSkeletonInner}>
              <div className={styles.skeletonAvatarLg} />
              <div className={styles.skeletonMeta}>
                <div className={styles.skeletonLine} />
                <div className={styles.skeletonLineShort} />
                <div className={styles.skeletonLineMed} />
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className={styles.errorWrap}>
          <h2 className={styles.errorTitle}>Profile Not Found</h2>
          <p className={styles.errorDesc}>{error}</p>
          <Link href="/directory" className={styles.errorBtn}>
            Browse Directory
          </Link>
        </div>
      )}

      {/* Profile content */}
      {!loading && !error && professional && (
        <>
          <section className={styles.hero}>
            <div className={styles.heroInner}>
              <div className={styles.heroRow}>
                <div className={styles.heroLeft}>
                  <div className={styles.avatarLg}>
                    {professional.avatar_url ? (
                      <img
                        src={professional.avatar_url}
                        alt={professional.name}
                        className={styles.avatarImg}
                      />
                    ) : (
                      <span className={styles.avatarInitials}>
                        {getInitials(professional.name)}
                      </span>
                    )}
                  </div>

                  <div className={styles.heroMeta}>
                    <div className={styles.heroNameRow}>
                      <h1 className={styles.heroName}>{professional.name}</h1>
                      {professional.verified && (
                        <span className={styles.heroVerified}>
                          <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width="20" height="20">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        </span>
                      )}
                    </div>
                    <p className={styles.heroTitle}>{professional.title}</p>
                    <div className={styles.heroLocation}>
                      <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width="16" height="16">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{professional.location}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.heroActions}>
                  <Link href={`/inquiry?professional_id=${slug}`} className={styles.contactBtn}>
                    Contact This Professional
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <section className={styles.bodySection}>
            <div className={styles.bodyGrid}>
              <div className={styles.bodyMain}>
                <div className={styles.contentCard}>
                  <h2 className={styles.cardSectionTitle}>About</h2>
                  <p className={styles.bioText}>{professional.bio}</p>
                </div>

                <div className={styles.contentCard}>
                  <h2 className={styles.cardSectionTitle}>Specialties</h2>
                  <div className={styles.specialtyList}>
                    {professional.specialty.map((s) => (
                      <span key={s} className={`${styles.badge} ${getSpecialtyClass(s)}`}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className={styles.bodySidebar}>
                <div className={styles.sidebarCard}>
                  <h3 className={styles.sidebarTitle}>Contact Information</h3>
                  <div className={styles.sidebarField}>
                    <span className={styles.sidebarLabel}>Location</span>
                    <span className={styles.sidebarValue}>{professional.location}</span>
                  </div>
                  <Link href={`/inquiry?professional_id=${slug}`} className={styles.sidebarContactBtn}>
                    Contact Now
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  )
}

export default function ProfilePage() {
  return (
    <>
      <Header variant="site" />
      <Suspense fallback={<div style={{ minHeight: '60vh' }} />}>
        <ProfileContent />
      </Suspense>
    </>
  )
}
