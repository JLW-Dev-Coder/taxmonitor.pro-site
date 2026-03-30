'use client'

import styles from './SiteBackground.module.css'

export default function SiteBackground() {
  return (
    <div className={styles.wrapper} aria-hidden="true">
      <div className={`${styles.blob} ${styles.blob1}`} />
      <div className={`${styles.blob} ${styles.blob2}`} />
      <div className={`${styles.blob} ${styles.blob3}`} />
      <div className={styles.grid} />
      <div className={styles.network} />
      <div className={styles.beacon} />
      <div className={styles.ring} />
      <div className={styles.scan} />
      <div className={styles.noise} />
      <div className={styles.vignette} />
    </div>
  )
}
