'use client'

import styles from './PlanCard.module.css'

interface PlanCardProps {
  name: string
  price: number
  interval: string
  features: string[]
  recommended?: boolean
  badge?: string
  onSelect: () => void
  loading?: boolean
}

export default function PlanCard({
  name,
  price,
  interval,
  features,
  recommended,
  badge,
  onSelect,
  loading,
}: PlanCardProps) {
  const isFree = price === 0

  const cardClass = [
    styles.card,
    recommended ? styles.recommended : '',
    isFree ? styles.free : '',
  ]
    .filter(Boolean)
    .join(' ')

  const badgeClass = isFree
    ? styles.badgeFree
    : recommended
    ? styles.badgeRecommended
    : styles.badgeDefault

  const buttonClass = [
    styles.button,
    isFree
      ? styles.buttonFree
      : recommended
      ? styles.buttonRecommended
      : styles.buttonDefault,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={cardClass}>
      {isFree && <div className={styles.freeGlow} />}

      <div className={styles.header}>
        <h2 className={styles.name}>{name}</h2>
        {badge && (
          <span className={`${styles.badge} ${badgeClass}`}>{badge}</span>
        )}
      </div>

      <div className={styles.pricing}>
        <div>
          <span className={styles.price}>${price}</span>
          <span className={styles.interval}> / {interval}</span>
        </div>
        <div className={styles.billingNote}>
          {isFree ? 'No payment method required' : 'Billed monthly'}
        </div>
      </div>

      <ul className={styles.features}>
        {features.map((feature) => (
          <li key={feature} className={styles.feature}>
            <span className={styles.featureDot}>&bull;</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <div className={styles.cta}>
        <button
          type="button"
          className={buttonClass}
          onClick={onSelect}
          disabled={loading}
        >
          {loading ? 'Loading...' : isFree ? 'Start free \u2192' : 'Start membership \u2192'}
        </button>
        <p className={styles.hint}>
          {isFree
            ? 'Great for exploring TMP before upgrading to tokens and inquiry access.'
            : recommended
            ? 'Best for taxpayers actively reviewing their tax situation.'
            : `Entry-level access for taxpayers exploring help.`}
        </p>
      </div>
    </div>
  )
}
