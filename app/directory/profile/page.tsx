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
import { getSampleProfile } from '@/lib/sample-profiles'
import type { FullProfile } from '@/lib/sample-profiles'
import styles from './page.module.css'

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

function StarRating({ rating }: { rating: number }) {
  return (
    <span className={styles.stars}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={i < rating ? styles.starFilled : styles.starEmpty}
          fill={i < rating ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
          width="14"
          height="14"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
      ))}
    </span>
  )
}

function ProfileContent() {
  const searchParams = useSearchParams()
  const slug = searchParams.get('id') || ''

  const [profile, setProfile] = useState<FullProfile | null>(null)
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
        /* API returned a result — wrap into FullProfile shape */
        const sample = getSampleProfile(slug)
        if (sample) {
          setProfile(sample)
          return
        }

        const p = res.profile
        const locationLabel =
          p.hero?.location_label ||
          [p.location?.city, p.location?.state].filter(Boolean).join(', ')
        const bios = p.bio?.bio_full_paragraphs || []
        const scheduleBtn = p.buttons?.schedule_button
        const bookingUrl =
          scheduleBtn?.show && scheduleBtn?.active ? scheduleBtn.url || '' : ''
        const verified =
          p.profile?.status_badge_label === 'Verified' ||
          p.profile?.status_badge_label === 'Featured'

        setProfile({
          professional_id: slug,
          name: p.profile?.name || '',
          title: p.hero?.headline || p.professional?.profession?.[0] || '',
          specialty: p.professional?.profession || [],
          location: locationLabel,
          avatar_url: '',
          verified,
          city: p.location?.city || '',
          state: p.location?.state || '',
          zip: p.location?.zip || '',
          profession: p.professional?.profession || [],
          bio_short: p.bio?.bio_short || '',
          bio_full: bios.length > 0 ? bios : [p.bio?.bio_short || ''],
          firm_name: p.professional?.firm_name || '',
          years_experience: p.professional?.years_experience || 0,
          headline: p.hero?.headline || '',
          credential_badges:
            p.hero?.credential_badges ||
            (p.professional?.profession || []).map((s) => ({
              label: s,
              style_key: s.toLowerCase(),
            })),
          services: (p.services_offered?.items || []).map((s) => ({
            title: s.title,
            description: s.description,
            icon: s.icon,
          })),
          reviews: (p.reviews?.items || []).map((r) => ({
            name: r.name,
            rating: r.rating,
            text: r.text,
          })),
          review_summary: {
            average_rating: p.reviews?.summary?.average_rating || 0,
            review_count: p.reviews?.summary?.review_count || 0,
          },
          quick_stats: p.quick_stats || [],
          client_types: p.specializations?.client_types || [],
          credentials: p.professional?.credentials || [],
          experience: (p.credentials_experience?.background_items || []).map(
            (b) => ({
              title: b.title,
              date_label: b.date_label,
              description: b.description,
            })
          ),
          licenses: (
            p.credentials_experience?.licenses_certifications || []
          ).map((l) => ({
            title: l.title,
            subtitle: l.subtitle || '',
          })),
          contact_email: p.contact?.contact_email || '',
          phone: p.contact?.phone || '',
          website: p.contact?.website || '',
          availability: p.contact?.availability_display || '',
          languages: p.contact?.languages || [],
          years_experience_label: p.hero?.years_experience_label || '',
          rating_label: p.hero?.rating_label || '',
          booking_url: bookingUrl,
          sample: false,
        })
      })
      .catch(() => {
        /* API failed — try sample profiles */
        const sample = getSampleProfile(slug)
        if (sample) {
          setProfile(sample)
        } else {
          setError('Profile not found or could not be loaded.')
        }
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

          {!loading && profile?.verified && (
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
      {!loading && !error && profile && (
        <>
          {/* Hero */}
          <section className={styles.hero}>
            <div className={styles.heroInner}>
              <div className={styles.heroRow}>
                <div className={styles.heroLeft}>
                  <div className={styles.avatarLg}>
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.name}
                        className={styles.avatarImg}
                      />
                    ) : (
                      <span className={styles.avatarInitials}>
                        {getInitials(profile.name)}
                      </span>
                    )}
                  </div>

                  <div className={styles.heroMeta}>
                    <div className={styles.heroNameRow}>
                      <h1 className={styles.heroName}>{profile.name}</h1>
                      {profile.verified && (
                        <span className={styles.heroVerified}>
                          <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width="20" height="20">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        </span>
                      )}
                    </div>
                    <p className={styles.heroTitle}>{profile.headline}</p>
                    <div className={styles.heroBadges}>
                      {profile.credential_badges.map((b) => (
                        <span key={b.label} className={`${styles.badge} ${getSpecialtyClass(b.label)}`}>
                          {b.label}
                        </span>
                      ))}
                    </div>
                    <div className={styles.heroLocation}>
                      <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" width="16" height="16">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{profile.location}</span>
                      {profile.years_experience_label && (
                        <>
                          <span className={styles.heroDivider}>|</span>
                          <span>{profile.years_experience_label}</span>
                        </>
                      )}
                      {profile.rating_label && (
                        <>
                          <span className={styles.heroDivider}>|</span>
                          <span>{profile.rating_label}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className={styles.heroActions}>
                  <Link href={`/inquiry?professional_id=${slug}`} className={styles.contactBtn}>
                    Contact This Professional
                  </Link>
                  {profile.booking_url && (
                    <a href={profile.booking_url} target="_blank" rel="noopener noreferrer" className={styles.bookingBtn}>
                      Schedule Consultation
                    </a>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Quick Stats */}
          {profile.quick_stats.length > 0 && (
            <section className={styles.statsSection}>
              <div className={styles.statsInner}>
                {profile.quick_stats.map((stat) => (
                  <div key={stat.label} className={styles.statCard}>
                    <span className={styles.statValue}>{stat.value}</span>
                    <span className={styles.statLabel}>{stat.label}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Body */}
          <section className={styles.bodySection}>
            <div className={styles.bodyGrid}>
              <div className={styles.bodyMain}>
                {/* About */}
                <div className={styles.contentCard}>
                  <h2 className={styles.cardSectionTitle}>About</h2>
                  {profile.bio_full.map((p, i) => (
                    <p key={i} className={styles.bioText}>{p}</p>
                  ))}
                </div>

                {/* Services */}
                {profile.services.length > 0 && (
                  <div className={styles.contentCard}>
                    <h2 className={styles.cardSectionTitle}>Services Offered</h2>
                    <div className={styles.serviceGrid}>
                      {profile.services.map((svc) => (
                        <div key={svc.title} className={styles.serviceItem}>
                          <h3 className={styles.serviceTitle}>{svc.title}</h3>
                          <p className={styles.serviceDesc}>{svc.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Specialties */}
                <div className={styles.contentCard}>
                  <h2 className={styles.cardSectionTitle}>Specialties</h2>
                  <div className={styles.specialtyList}>
                    {profile.specialty.map((s) => (
                      <span key={s} className={`${styles.badge} ${getSpecialtyClass(s)}`}>
                        {s}
                      </span>
                    ))}
                  </div>
                  <h3 className={styles.subSectionTitle}>Client Types</h3>
                  {profile.client_types.length > 0 ? (
                    <div className={styles.tagList}>
                      {profile.client_types.map((ct) => (
                        <span key={ct} className={styles.tagPill}>{ct}</span>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.emptyText}>No data yet</p>
                  )}
                </div>

                {/* Experience */}
                <div className={styles.contentCard}>
                  <h2 className={styles.cardSectionTitle}>Experience</h2>
                  {profile.experience.length > 0 ? (
                    <div className={styles.timeline}>
                      {profile.experience.map((exp) => (
                        <div key={exp.title} className={styles.timelineItem}>
                          <div className={styles.timelineDot} />
                          <div className={styles.timelineContent}>
                            <h3 className={styles.timelineTitle}>{exp.title}</h3>
                            <span className={styles.timelineDate}>{exp.date_label}</span>
                            <p className={styles.timelineDesc}>{exp.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.emptyText}>No data yet</p>
                  )}
                </div>

                {/* Licenses & Credentials */}
                <div className={styles.contentCard}>
                  <h2 className={styles.cardSectionTitle}>Licenses & Credentials</h2>
                  {profile.licenses.length > 0 ? (
                    <div className={styles.credentialList}>
                      {profile.licenses.map((lic) => (
                        <div key={lic.title} className={styles.credentialItem}>
                          <h3 className={styles.credentialTitle}>{lic.title}</h3>
                          <p className={styles.credentialSub}>{lic.subtitle}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.emptyText}>No data yet</p>
                  )}
                </div>

                {/* Reviews */}
                <div className={styles.contentCard}>
                  <div className={styles.reviewHeader}>
                    <h2 className={styles.cardSectionTitle}>Client Reviews</h2>
                    {profile.review_summary.review_count > 0 && (
                      <span className={styles.reviewSummary}>
                        {profile.review_summary.average_rating.toFixed(1)}/5
                        ({profile.review_summary.review_count} reviews)
                      </span>
                    )}
                  </div>
                  {profile.reviews.length > 0 ? (
                    <div className={styles.reviewList}>
                      {profile.reviews.map((rev) => (
                        <div key={rev.name} className={styles.reviewItem}>
                          <div className={styles.reviewTop}>
                            <span className={styles.reviewAuthor}>{rev.name}</span>
                            <StarRating rating={rev.rating} />
                          </div>
                          <p className={styles.reviewText}>{rev.text}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.emptyText}>No data yet</p>
                  )}
                </div>
              </div>

              {/* Sidebar */}
              <div className={styles.bodySidebar}>
                <div className={styles.sidebarCard}>
                  <h3 className={styles.sidebarTitle}>Contact Information</h3>
                  <div className={styles.sidebarField}>
                    <span className={styles.sidebarLabel}>Location</span>
                    <span className={styles.sidebarValue}>{profile.location}</span>
                  </div>
                  {profile.firm_name && (
                    <div className={styles.sidebarField}>
                      <span className={styles.sidebarLabel}>Firm</span>
                      <span className={styles.sidebarValue}>{profile.firm_name}</span>
                    </div>
                  )}
                  {profile.phone && (
                    <div className={styles.sidebarField}>
                      <span className={styles.sidebarLabel}>Phone</span>
                      <span className={styles.sidebarValue}>{profile.phone}</span>
                    </div>
                  )}
                  {profile.contact_email && (
                    <div className={styles.sidebarField}>
                      <span className={styles.sidebarLabel}>Email</span>
                      <span className={styles.sidebarValue}>{profile.contact_email}</span>
                    </div>
                  )}
                  {profile.availability && (
                    <div className={styles.sidebarField}>
                      <span className={styles.sidebarLabel}>Availability</span>
                      <span className={styles.sidebarValue}>{profile.availability}</span>
                    </div>
                  )}
                  {profile.languages.length > 0 && (
                    <div className={styles.sidebarField}>
                      <span className={styles.sidebarLabel}>Languages</span>
                      <span className={styles.sidebarValue}>{profile.languages.join(', ')}</span>
                    </div>
                  )}
                  <Link href={`/inquiry?professional_id=${slug}`} className={styles.sidebarContactBtn}>
                    Contact Now
                  </Link>
                  {profile.booking_url && (
                    <a href={profile.booking_url} target="_blank" rel="noopener noreferrer" className={styles.sidebarBookingBtn}>
                      Schedule Consultation
                    </a>
                  )}
                  {profile.website && (
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className={styles.sidebarWebsiteLink}>
                      Visit Website
                    </a>
                  )}
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
