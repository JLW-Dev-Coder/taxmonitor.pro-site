'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import AuthGuard from '@/components/AuthGuard'
import AppShell from '@/components/AppShell'
import { api } from '@/lib/api'
import type { SessionUser } from '@/components/AuthGuard'
import styles from './page.module.css'

/* ── Types ── */
interface ProfileData {
  first_name: string
  last_name: string
  email: string
  phone: string
  organization: string
  avatar_url: string
  verified: boolean
}

interface PrefsData {
  notifications_email: boolean
  notifications_inapp: boolean
  notifications_sms: boolean
  theme: 'dark' | 'light' | 'system'
}

interface TwoFaStatus {
  enabled: boolean
}

type ToastType = 'success' | 'error' | 'info'

/* ── Helpers ── */
function computeInitials(first?: string, last?: string): string {
  const a = (first || '').trim()
  const b = (last || '').trim()
  const i1 = a ? a[0] : ''
  const i2 = b ? b[0] : a.length > 1 ? a[1] : ''
  return (i1 + i2).toUpperCase() || 'TM'
}

/* ── Icons (inline SVGs) ── */
function UserIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  )
}

function GearIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function CameraIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  )
}

function WarningIcon() {
  return (
    <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

/* ── Skeleton Loader ── */
function ProfileSkeleton() {
  return (
    <div className={styles.container}>
      <div className={styles.glassCard}>
        <div className={styles.skeletonLineMedium} />
        <div className={styles.skeletonLineShort} />
      </div>
      <div className={styles.glassCard}>
        <div className={styles.avatarRow}>
          <div className={styles.skeletonAvatar} />
          <div>
            <div className={styles.skeletonLineMedium} />
            <div className={styles.skeletonLineShort} />
          </div>
        </div>
        <div className={styles.formGrid}>
          <div className={styles.skeletonInput} />
          <div className={styles.skeletonInput} />
          <div className={`${styles.skeletonInput} ${styles.fieldGroupFull}`} />
          <div className={styles.skeletonInput} />
          <div className={styles.skeletonInput} />
        </div>
      </div>
      <div className={styles.glassCard}>
        <div className={styles.skeletonBlock} />
      </div>
      <div className={styles.glassCard}>
        <div className={styles.skeletonBlock} />
      </div>
    </div>
  )
}

/* ── Error State ── */
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className={`${styles.glassCard} ${styles.errorState}`}>
      <div className={styles.errorIcon}>
        <XIcon />
      </div>
      <h2 className={styles.errorTitle}>Failed to load profile</h2>
      <p className={styles.errorMessage}>{message}</p>
      <button type="button" className={styles.btnRetry} onClick={onRetry}>
        Try Again
      </button>
    </div>
  )
}

/* ── Toast ── */
function Toast({
  message,
  type,
  visible,
}: {
  message: string
  type: ToastType
  visible: boolean
}) {
  const iconCls =
    type === 'success'
      ? styles.toastIconSuccess
      : type === 'error'
        ? styles.toastIconError
        : styles.toastIconInfo

  return (
    <div className={`${styles.toast} ${visible ? '' : styles.toastHidden}`}>
      <div className={styles.toastInner}>
        <div className={`${styles.toastIcon} ${iconCls}`}>
          {type === 'success' && <CheckIcon />}
          {type === 'error' && <XIcon />}
          {type === 'info' && <InfoIcon />}
        </div>
        <span className={styles.toastMessage}>{message}</span>
      </div>
    </div>
  )
}

/* ── Toggle Component ── */
function Toggle({
  active,
  onToggle,
  label,
}: {
  active: boolean
  onToggle: () => void
  label: string
}) {
  return (
    <div
      className={`${styles.toggle} ${active ? styles.toggleActive : ''}`}
      role="switch"
      aria-checked={active}
      aria-label={label}
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onToggle()
        }
      }}
    />
  )
}

/* ── Delete Modal ── */
function DeleteModal({
  email,
  onCancel,
  onConfirm,
  saving,
}: {
  email: string
  onCancel: () => void
  onConfirm: (reason: string) => void
  saving: boolean
}) {
  const [reason, setReason] = useState('')
  const [confirmEmail, setConfirmEmail] = useState('')

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalBackdrop} onClick={onCancel} />
      <div className={styles.modalCard}>
        <div className={styles.modalCenter}>
          <div className={styles.warningCircle}>
            <WarningIcon />
          </div>
          <h3 className={styles.modalTitle}>Delete Account?</h3>
          <p className={styles.modalDesc}>
            This submits a delete request. Final deletion is handled by the
            operator workflow.
          </p>

          <div className={styles.modalFieldGroup}>
            <label className={styles.label}>Reason (optional)</label>
            <textarea
              className={styles.modalTextarea}
              rows={3}
              placeholder="Tell us why you're leaving"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div className={styles.modalFieldGroup}>
            <label className={styles.label}>
              Type your email to confirm: <strong>{email}</strong>
            </label>
            <input
              type="email"
              className={styles.input}
              placeholder={email}
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
            />
            <p className={styles.confirmEmailHint}>
              You must type your email exactly to enable the delete button.
            </p>
          </div>

          <div className={styles.modalActions}>
            <button
              type="button"
              className={styles.modalBtnCancel}
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.modalBtnConfirmDelete}
              disabled={confirmEmail !== email || saving}
              onClick={() => onConfirm(reason)}
            >
              {saving ? 'Submitting...' : 'Submit Delete Request'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Password Modal ── */
function PasswordModal({
  onCancel,
  onSubmit,
  saving,
}: {
  onCancel: () => void
  onSubmit: (current: string, next: string) => void
  saving: boolean
}) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [localError, setLocalError] = useState('')

  function handleSubmit() {
    if (!current || !next || !confirm) {
      setLocalError('All fields are required.')
      return
    }
    if (next !== confirm) {
      setLocalError('New passwords do not match.')
      return
    }
    if (next.length < 8) {
      setLocalError('New password must be at least 8 characters.')
      return
    }
    setLocalError('')
    onSubmit(current, next)
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalBackdrop} onClick={onCancel} />
      <div className={styles.modalCard}>
        <h3 className={styles.modalTitle}>Change Password</h3>
        <p className={styles.modalDesc}>
          This submits a password change request to the operator workflow.
        </p>

        {localError && (
          <p className={styles.modalDesc} style={{ color: 'var(--error)' }}>
            {localError}
          </p>
        )}

        <div className={styles.modalFieldGroup}>
          <label className={styles.label}>Current Password</label>
          <input
            type="password"
            className={styles.input}
            placeholder="Enter current password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </div>

        <div className={styles.modalFieldGroup}>
          <label className={styles.label}>New Password</label>
          <input
            type="password"
            className={styles.input}
            placeholder="Enter new password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
        </div>

        <div className={styles.modalFieldGroup}>
          <label className={styles.label}>Confirm New Password</label>
          <input
            type="password"
            className={styles.input}
            placeholder="Confirm new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>

        <div className={styles.modalActions}>
          <button
            type="button"
            className={styles.modalBtnCancel}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.modalBtnSubmit}
            disabled={saving}
            onClick={handleSubmit}
          >
            {saving ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Main Content ── */
function ProfileContent({ account }: { account: SessionUser }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  /* Profile state */
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [organization, setOrganization] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [verified, setVerified] = useState(false)
  const [saving, setSaving] = useState(false)

  /* Preferences state */
  const [emailNotif, setEmailNotif] = useState(false)
  const [inappNotif, setInappNotif] = useState(false)
  const [smsNotif, setSmsNotif] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark')

  /* Security state */
  const [tfaEnabled, setTfaEnabled] = useState(false)

  /* Modal state */
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [deleteSaving, setDeleteSaving] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)

  /* Toast state */
  const [toast, setToast] = useState<{
    message: string
    type: ToastType
    visible: boolean
  }>({ message: '', type: 'success', visible: false })

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ message, type, visible: true })
    toastTimer.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }))
    }, 3000)
  }, [])

  /* ── Load data ── */
  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [profileRes, prefsRes, tfaRes] = await Promise.all([
        api.getAccount(account.account_id) as Promise<Record<string, unknown>>,
        api.getPreferences(account.account_id) as Promise<Record<string, unknown>>,
        api.get2faStatus(account.account_id) as Promise<Record<string, unknown>>,
      ])

      const p = profileRes as unknown as ProfileData
      setFirstName(p.first_name || account.first_name || '')
      setLastName(p.last_name || account.last_name || '')
      setEmail(p.email || account.email || '')
      setPhone(p.phone || '')
      setOrganization(p.organization || '')
      setAvatarUrl(p.avatar_url || account.avatar_url || '')
      setVerified(p.verified ?? true)

      const prefs = prefsRes as unknown as PrefsData
      setEmailNotif(prefs.notifications_email ?? false)
      setInappNotif(prefs.notifications_inapp ?? false)
      setSmsNotif(prefs.notifications_sms ?? false)
      setTheme(prefs.theme || 'dark')

      const tfa = tfaRes as unknown as TwoFaStatus
      setTfaEnabled(tfa.enabled ?? false)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [account])

  useEffect(() => {
    loadData()
  }, [loadData])

  /* ── Save profile ── */
  async function handleSaveProfile() {
    setSaving(true)
    try {
      await api.updateAccount(account.account_id, {
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        organization,
      })
      showToast('Profile updated successfully', 'success')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save profile'
      showToast(msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  /* ── Photo upload ── */
  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      showToast('Uploading photo...', 'info')
      const initRes = await api.photoUploadInit(account.account_id, file.type)
      await fetch(initRes.upload_url, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      })
      await api.photoUploadComplete(account.account_id, initRes.key)
      setAvatarUrl(URL.createObjectURL(file))
      showToast('Photo updated successfully', 'success')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to upload photo'
      showToast(msg, 'error')
    }

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  /* ── Preferences auto-save ── */
  const savePref = useCallback(
    async (data: Record<string, unknown>) => {
      try {
        await api.updatePreferences(account.account_id, data)
      } catch {
        showToast('Failed to save preference', 'error')
      }
    },
    [account.account_id, showToast]
  )

  function toggleEmailNotif() {
    const next = !emailNotif
    setEmailNotif(next)
    savePref({ notifications_email: next })
  }

  function toggleInappNotif() {
    const next = !inappNotif
    setInappNotif(next)
    savePref({ notifications_inapp: next })
  }

  function toggleSmsNotif() {
    const next = !smsNotif
    setSmsNotif(next)
    savePref({ notifications_sms: next })
  }

  function handleThemeChange(t: 'dark' | 'light' | 'system') {
    setTheme(t)
    savePref({ theme: t })
  }

  /* ── 2FA toggle ── */
  async function handleToggle2fa() {
    try {
      if (tfaEnabled) {
        const code = window.prompt('Enter your 2FA code to disable:')
        if (!code) return
        await api.disable2fa(code)
        setTfaEnabled(false)
        showToast('Two-factor authentication disabled', 'success')
      } else {
        await api.enroll2faInit()
        const code = window.prompt(
          'Check your authenticator app and enter the verification code:'
        )
        if (!code) return
        await api.enroll2faVerify(code)
        setTfaEnabled(true)
        showToast('Two-factor authentication enabled', 'success')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update 2FA'
      showToast(msg, 'error')
    }
  }

  /* ── Delete account ── */
  async function handleDeleteConfirm(reason: string) {
    setDeleteSaving(true)
    try {
      await api.deleteAccount(account.account_id)
      showToast('Delete request submitted', 'success')
      setShowDeleteModal(false)
      // Redirect after short delay
      setTimeout(() => {
        window.location.href = '/sign-in'
      }, 2000)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Delete request failed'
      showToast(msg, 'error')
    } finally {
      setDeleteSaving(false)
    }
  }

  /* ── Password change ── */
  async function handlePasswordSubmit(current: string, next: string) {
    setPasswordSaving(true)
    try {
      await api.updateAccount(account.account_id, {
        current_password: current,
        new_password: next,
      })
      showToast('Password change request submitted', 'success')
      setShowPasswordModal(false)
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Password change failed'
      showToast(msg, 'error')
    } finally {
      setPasswordSaving(false)
    }
  }

  /* ── Logout all ── */
  async function handleLogoutAll() {
    try {
      await api.logout()
      showToast('Logged out from all devices', 'success')
      setTimeout(() => {
        window.location.href = '/sign-in'
      }, 1500)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Logout failed'
      showToast(msg, 'error')
    }
  }

  /* ── Computed ── */
  const initials = computeInitials(firstName, lastName)
  const displayName =
    `${firstName.trim()} ${lastName.trim()}`.trim() || 'Tax Monitor Pro'

  if (loading) return <ProfileSkeleton />

  if (error) {
    return (
      <div className={styles.container}>
        <ErrorState message={error} onRetry={loadData} />
      </div>
    )
  }

  return (
    <>
      <Toast message={toast.message} type={toast.type} visible={toast.visible} />

      <div className={styles.container}>
        {/* ── Hero ── */}
        <section className={styles.glassCard}>
          <div className={styles.heroInner}>
            <div className={styles.heroText}>
              <h1 className={styles.heroTitle}>
                Account <span className={styles.gradientText}>Profile</span>
              </h1>
              <p className={styles.heroSubtitle}>
                Manage and maintain this account record
              </p>
              <p className={styles.heroNote}>
                Your changes are saved securely and reflected in your account.
              </p>
            </div>
            <div className={styles.heroChip}>{initials}</div>
          </div>
        </section>

        {/* ── Profile ── */}
        <section className={styles.glassCard}>
          <div className={styles.avatarRow}>
            <div className={styles.avatarWrap}>
              <div className={styles.avatarSquare}>
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile photo"
                    className={styles.avatarImg}
                  />
                ) : (
                  <span className={styles.avatarInitials}>{initials}</span>
                )}
              </div>
              <button
                type="button"
                className={styles.cameraBtn}
                aria-label="Change photo"
                onClick={() => fileInputRef.current?.click()}
              >
                <CameraIcon />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className={styles.hiddenInput}
                onChange={handlePhotoUpload}
              />
            </div>

            <div className={styles.avatarInfo}>
              <h2 className={styles.displayName}>{displayName}</h2>
              <p className={styles.accountSubtitle}>Internal account record</p>
              <div className={styles.badges}>
                {verified && (
                  <span className={styles.badgeVerified}>Verified</span>
                )}
                <span className={styles.badgeService}>In service</span>
              </div>
            </div>
          </div>

          <h3 className={styles.sectionHeading}>
            <span className={styles.sectionHeadingIcon}>
              <UserIcon />
            </span>
            Personal Information
          </h3>

          <div className={styles.formGrid}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                First Name <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                className={styles.input}
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                Last Name <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                className={styles.input}
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>

            <div className={`${styles.fieldGroup} ${styles.fieldGroupFull}`}>
              <label className={styles.label}>
                Email Address <span className={styles.required}>*</span>
              </label>
              <div className={styles.inputWrap}>
                <input
                  type="email"
                  className={`${styles.input} ${styles.inputWithBadge}`}
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {verified && (
                  <span className={styles.inlineBadge}>Verified</span>
                )}
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Phone Number</label>
              <input
                type="tel"
                className={styles.input}
                autoComplete="tel"
                placeholder="Enter phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Organization/Company</label>
              <input
                type="text"
                className={styles.input}
                autoComplete="organization"
                placeholder="Enter organization"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.btnDanger}
              onClick={() => setShowDeleteModal(true)}
            >
              <TrashIcon />
              Delete Account
            </button>
            <button
              type="button"
              className={styles.btnPrimary}
              disabled={saving}
              onClick={handleSaveProfile}
            >
              <CheckIcon />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </section>

        {/* ── Security ── */}
        <section className={styles.glassCard}>
          <h3 className={styles.sectionHeading}>
            <span className={styles.sectionHeadingIcon}>
              <LockIcon />
            </span>
            Account Security
          </h3>

          <div className={styles.securityCards}>
            {/* Password */}
            <div className={styles.sectionCard}>
              <div className={styles.securityRow}>
                <div className={styles.securityInfo}>
                  <h4>Password</h4>
                  <p>Request a password update</p>
                </div>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setShowPasswordModal(true)}
                >
                  Change Password
                </button>
              </div>
            </div>

            {/* 2FA */}
            <div className={styles.sectionCard}>
              <div className={styles.tfaRow}>
                <div className={styles.tfaLeft}>
                  <div className={styles.shieldIcon}>
                    <ShieldIcon />
                  </div>
                  <div className={styles.securityInfo}>
                    <h4>Two-Factor Authentication</h4>
                    <p>{tfaEnabled ? 'Enabled' : 'Not enabled'}</p>
                    <p className={styles.securityInfoSmall}>
                      Add an extra layer of protection to your account using an
                      authenticator app.
                    </p>
                  </div>
                </div>
                <Toggle
                  active={tfaEnabled}
                  onToggle={handleToggle2fa}
                  label="Toggle two-factor authentication"
                />
              </div>
            </div>

            {/* Sessions */}
            <div className={styles.sectionCard}>
              <div className={styles.securityRow}>
                <div className={styles.securityInfo}>
                  <h4>Active Sessions</h4>
                  <p>Request logout across all devices</p>
                </div>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={handleLogoutAll}
                >
                  Logout All Devices
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Preferences ── */}
        <section className={styles.glassCard}>
          <h3 className={styles.sectionHeading}>
            <span className={styles.sectionHeadingIcon}>
              <GearIcon />
            </span>
            Preferences
          </h3>

          <div className={styles.prefsCards}>
            <h4 className={styles.prefsSubheading}>Notifications</h4>

            <div className={styles.sectionCard}>
              <div className={styles.prefRow}>
                <div className={styles.prefInfo}>
                  <h4>Email Notifications</h4>
                  <p>Receive updates via email</p>
                </div>
                <Toggle
                  active={emailNotif}
                  onToggle={toggleEmailNotif}
                  label="Email notifications"
                />
              </div>
            </div>

            <div className={styles.sectionCard}>
              <div className={styles.prefRow}>
                <div className={styles.prefInfo}>
                  <h4>In-App Notifications</h4>
                  <p>Show notifications in dashboard</p>
                </div>
                <Toggle
                  active={inappNotif}
                  onToggle={toggleInappNotif}
                  label="In-app notifications"
                />
              </div>
            </div>

            <div className={styles.sectionCard}>
              <div className={styles.prefRow}>
                <div className={styles.prefInfo}>
                  <h4>SMS Notifications</h4>
                  <p>Receive updates via text message</p>
                </div>
                <Toggle
                  active={smsNotif}
                  onToggle={toggleSmsNotif}
                  label="SMS notifications"
                />
              </div>
            </div>

            <h4 className={styles.prefsSubheadingSpaced}>Appearance</h4>

            <div className={styles.sectionCard}>
              <div className={styles.prefInfo}>
                <h4>Theme Preference</h4>
              </div>
              <div className={styles.themeGroup}>
                {(['dark', 'light', 'system'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`${styles.themeBtn} ${theme === t ? styles.themeBtnActive : ''}`}
                    onClick={() => handleThemeChange(t)}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
              <p className={styles.prefsSaveNote}>
                Preferences save automatically.
              </p>
            </div>
          </div>
        </section>

        {/* ── Footer note ── */}
        <footer className={styles.footerNote}>
          Your updates are securely stored and applied to your account record.
        </footer>
      </div>

      {/* ── Modals ── */}
      {showDeleteModal && (
        <DeleteModal
          email={email}
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteConfirm}
          saving={deleteSaving}
        />
      )}

      {showPasswordModal && (
        <PasswordModal
          onCancel={() => setShowPasswordModal(false)}
          onSubmit={handlePasswordSubmit}
          saving={passwordSaving}
        />
      )}
    </>
  )
}

/* ── Page Export ── */
export default function ProfilePage() {
  return (
    <AuthGuard>
      {({ account }) => (
        <AppShell account={account}>
          <ProfileContent account={account} />
        </AppShell>
      )}
    </AuthGuard>
  )
}
