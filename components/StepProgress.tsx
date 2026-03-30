'use client'

import styles from './StepProgress.module.css'

interface StepProgressProps {
  steps: string[]
  current: number
}

export default function StepProgress({ steps, current }: StepProgressProps) {
  return (
    <div className={styles.stepper}>
      {steps.map((label, i) => (
        <div
          key={label}
          className={`${styles.step} ${i <= current ? styles.stepActive : ''}`}
        >
          <span className={`${styles.circle} ${i <= current ? styles.circleActive : ''}`}>
            {i + 1}
          </span>
          <span className={styles.label}>{label}</span>
        </div>
      ))}
    </div>
  )
}
