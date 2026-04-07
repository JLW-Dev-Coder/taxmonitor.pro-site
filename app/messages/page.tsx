'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import AuthGuard from '@/components/AuthGuard'
import AppShell from '@/components/AppShell'
import { api } from '@/lib/api'
import type { SessionUser } from '@/components/AuthGuard'
import styles from './page.module.css'

/* ── Types ── */
interface Message {
  message_id: string
  subject: string
  body: string
  category: string
  folder: string
  is_read: boolean
  created_at: string
  from?: string
}

type Folder = 'inbox' | 'drafts' | 'trash'
type Filter = 'all' | 'account' | 'monitoring' | 'trash'
type SortDir = 'newest' | 'oldest'

const FOLDERS: { key: Folder; label: string; icon: string }[] = [
  { key: 'inbox', label: 'Inbox', icon: '📥' },
  { key: 'drafts', label: 'Drafts', icon: '📝' },
  { key: 'trash', label: 'Recently Deleted', icon: '🗑' },
]

const FILTER_PILLS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'account', label: 'Account' },
  { key: 'monitoring', label: 'Monitoring' },
  { key: 'trash', label: 'Recently Deleted' },
]

const CATEGORIES = ['Account', 'Monitoring', 'Billing', 'General']

/* ── Helper: format date ── */
function formatDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 86_400_000) {
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  }
  if (diff < 604_800_000) {
    return d.toLocaleDateString([], { weekday: 'short' })
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

/* ── Badge class per category ── */
function badgeClass(category: string): string {
  switch (category.toLowerCase()) {
    case 'account':
      return `${styles.categoryBadge} ${styles.badgeAccount}`
    case 'monitoring':
      return `${styles.categoryBadge} ${styles.badgeMonitoring}`
    default:
      return styles.categoryBadge
  }
}

/* ── Main export ── */
export default function MessagesPage() {
  return (
    <AuthGuard>
      {({ account }) => (
        <AppShell account={account}>
          <MessagesContent account={account} />
        </AppShell>
      )}
    </AuthGuard>
  )
}

/* ── Content component ── */
function MessagesContent({ account }: { account: SessionUser }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [activeFolder, setActiveFolder] = useState<Folder>('inbox')
  const [activeFilter, setActiveFilter] = useState<Filter>('all')
  const [sortDir, setSortDir] = useState<SortDir>('newest')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false)

  /* Compose state */
  const [composeOpen, setComposeOpen] = useState(false)
  const [composeCategory, setComposeCategory] = useState('General')
  const [composeSubject, setComposeSubject] = useState('')
  const [composeBody, setComposeBody] = useState('')
  const [composeSending, setComposeSending] = useState(false)
  const [draftSaving, setDraftSaving] = useState(false)
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const draftIdRef = useRef<string | null>(null)

  /* ── Fetch messages ── */
  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const res = await api.sendMessage({
        action: 'list',
        account_id: account.account_id,
      }) as { messages?: Message[] }
      setMessages(res.messages || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages')
    } finally {
      setLoading(false)
    }
  }, [account.account_id])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  /* ── Derive filtered + sorted list ── */
  const filteredMessages = messages
    .filter((m) => {
      /* Folder filter */
      if (activeFolder === 'trash') return m.folder === 'trash'
      if (activeFolder === 'drafts') return m.folder === 'drafts'
      if (activeFolder === 'inbox') return m.folder !== 'trash' && m.folder !== 'drafts'
      return true
    })
    .filter((m) => {
      if (activeFilter === 'all') return true
      if (activeFilter === 'trash') return m.folder === 'trash'
      return m.category.toLowerCase() === activeFilter
    })
    .filter((m) => {
      if (!search.trim()) return true
      return m.subject.toLowerCase().includes(search.toLowerCase())
    })
    .sort((a, b) => {
      const da = new Date(a.created_at).getTime()
      const db = new Date(b.created_at).getTime()
      return sortDir === 'newest' ? db - da : da - db
    })

  const selectedMessage = messages.find((m) => m.message_id === selectedId) || null

  /* Folder counts */
  const inboxCount = messages.filter((m) => m.folder !== 'trash' && m.folder !== 'drafts').length
  const draftsCount = messages.filter((m) => m.folder === 'drafts').length
  const trashCount = messages.filter((m) => m.folder === 'trash').length
  const folderCounts: Record<Folder, number> = { inbox: inboxCount, drafts: draftsCount, trash: trashCount }

  /* ── Mark as read on select ── */
  const selectMessage = useCallback(
    async (msg: Message) => {
      setSelectedId(msg.message_id)
      setMobileDetailOpen(true)
      if (!msg.is_read) {
        try {
          await api.sendMessage({
            action: 'update',
            account_id: account.account_id,
            message_id: msg.message_id,
            is_read: true,
          })
          setMessages((prev) =>
            prev.map((m) => (m.message_id === msg.message_id ? { ...m, is_read: true } : m))
          )
        } catch {
          /* ignore read status errors */
        }
      }
    },
    [account.account_id]
  )

  /* ── Trash / Restore / Permanent Delete ── */
  const trashMessage = useCallback(
    async (messageId: string) => {
      try {
        await api.sendMessage({
          action: 'delete_soft',
          account_id: account.account_id,
          message_id: messageId,
        })
        setMessages((prev) =>
          prev.map((m) => (m.message_id === messageId ? { ...m, folder: 'trash' } : m))
        )
        setSelectedId(null)
        setMobileDetailOpen(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to trash message')
      }
    },
    [account.account_id]
  )

  const restoreMessage = useCallback(
    async (messageId: string) => {
      try {
        await api.sendMessage({
          action: 'restore',
          account_id: account.account_id,
          message_id: messageId,
        })
        setMessages((prev) =>
          prev.map((m) => (m.message_id === messageId ? { ...m, folder: 'inbox' } : m))
        )
        setSelectedId(null)
        setMobileDetailOpen(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to restore message')
      }
    },
    [account.account_id]
  )

  const deletePermanent = useCallback(
    async (messageId: string) => {
      try {
        await api.sendMessage({
          action: 'delete_permanent',
          account_id: account.account_id,
          message_id: messageId,
        })
        setMessages((prev) => prev.filter((m) => m.message_id !== messageId))
        setSelectedId(null)
        setMobileDetailOpen(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete message')
      }
    },
    [account.account_id]
  )

  /* ── Compose: draft autosave (2s debounce) ── */
  const autosaveDraft = useCallback(
    (subject: string, body: string, category: string) => {
      if (draftTimer.current) clearTimeout(draftTimer.current)
      if (!subject && !body) return

      draftTimer.current = setTimeout(async () => {
        try {
          setDraftSaving(true)
          if (draftIdRef.current) {
            await api.sendMessage({
              action: 'update',
              account_id: account.account_id,
              message_id: draftIdRef.current,
              subject,
              body,
              category,
            })
          } else {
            const res = await api.sendMessage({
              action: 'create',
              account_id: account.account_id,
              subject,
              body,
              category,
              folder: 'drafts',
            }) as { message_id?: string }
            if (res.message_id) draftIdRef.current = res.message_id
          }
        } catch {
          /* silent draft save failure */
        } finally {
          setDraftSaving(false)
        }
      }, 2000)
    },
    [account.account_id]
  )

  const handleComposeChange = useCallback(
    (field: 'subject' | 'body' | 'category', value: string) => {
      const next = {
        subject: field === 'subject' ? value : composeSubject,
        body: field === 'body' ? value : composeBody,
        category: field === 'category' ? value : composeCategory,
      }
      if (field === 'subject') setComposeSubject(value)
      if (field === 'body') setComposeBody(value)
      if (field === 'category') setComposeCategory(value)
      autosaveDraft(next.subject, next.body, next.category)
    },
    [composeSubject, composeBody, composeCategory, autosaveDraft]
  )

  const handleSend = useCallback(async () => {
    if (!composeSubject.trim() || !composeBody.trim()) return
    try {
      setComposeSending(true)
      if (draftTimer.current) clearTimeout(draftTimer.current)

      /* If there is a draft, delete it first */
      if (draftIdRef.current) {
        await api.sendMessage({
          action: 'delete_permanent',
          account_id: account.account_id,
          message_id: draftIdRef.current,
        })
      }

      await api.sendMessage({
        action: 'create',
        account_id: account.account_id,
        subject: composeSubject,
        body: composeBody,
        category: composeCategory,
      })
      closeCompose()
      fetchMessages()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setComposeSending(false)
    }
  }, [composeSubject, composeBody, composeCategory, account.account_id, fetchMessages])

  const handleSaveDraft = useCallback(async () => {
    if (!composeSubject.trim() && !composeBody.trim()) return
    try {
      setComposeSending(true)
      if (draftTimer.current) clearTimeout(draftTimer.current)
      if (draftIdRef.current) {
        await api.sendMessage({
          action: 'update',
          account_id: account.account_id,
          message_id: draftIdRef.current,
          subject: composeSubject,
          body: composeBody,
          category: composeCategory,
        })
      } else {
        await api.sendMessage({
          action: 'create',
          account_id: account.account_id,
          subject: composeSubject,
          body: composeBody,
          category: composeCategory,
          folder: 'drafts',
        })
      }
      closeCompose()
      fetchMessages()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save draft')
    } finally {
      setComposeSending(false)
    }
  }, [composeSubject, composeBody, composeCategory, account.account_id, fetchMessages])

  function closeCompose() {
    if (draftTimer.current) clearTimeout(draftTimer.current)
    setComposeOpen(false)
    setComposeSubject('')
    setComposeBody('')
    setComposeCategory('General')
    draftIdRef.current = null
  }

  /* ── Render: Inline compose form (replaces detail panel when composing) ── */
  function renderComposeForm() {
    return (
      <div className={styles.composeInline}>
        <div className={styles.composeInlineHeader}>
          <h2 className={styles.detailSubject}>New Message</h2>
          <button type="button" className={styles.modalClose} onClick={closeCompose} aria-label="Close compose">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className={styles.composeInlineBody}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Category</label>
            <select
              className={styles.formSelect}
              value={composeCategory}
              onChange={(e) => handleComposeChange('category', e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Subject</label>
            <input
              type="text"
              className={styles.formInput}
              placeholder="Enter subject"
              value={composeSubject}
              onChange={(e) => handleComposeChange('subject', e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Message</label>
            <textarea
              className={styles.formTextarea}
              placeholder="Write your message..."
              value={composeBody}
              onChange={(e) => handleComposeChange('body', e.target.value)}
            />
          </div>
        </div>

        {draftSaving && (
          <div className={styles.savingIndicator}>Saving draft...</div>
        )}

        <div className={styles.composeInlineFooter}>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={handleSaveDraft}
            disabled={composeSending}
          >
            Save Draft
          </button>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={handleSend}
            disabled={composeSending || !composeSubject.trim() || !composeBody.trim()}
          >
            {composeSending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    )
  }

  /* ── Render: Detail panel (shared between desktop & mobile) ── */
  function renderDetail() {
    if (!selectedMessage) {
      return <div className={styles.detailEmpty}>Select a message to read</div>
    }

    const inTrash = selectedMessage.folder === 'trash'

    return (
      <>
        <div className={styles.detailHeader}>
          <h2 className={styles.detailSubject}>{selectedMessage.subject}</h2>
          <div className={styles.detailMeta}>
            <span>From: {selectedMessage.from || 'Tax Monitor Pro'}</span>
            <span>{formatDate(selectedMessage.created_at)}</span>
            <span className={badgeClass(selectedMessage.category)}>
              {selectedMessage.category}
            </span>
          </div>
        </div>

        <div className={styles.detailBody}>{selectedMessage.body}</div>

        <div className={styles.detailActions}>
          {!inTrash && (
            <button
              type="button"
              className={styles.actionBtn}
              onClick={() => trashMessage(selectedMessage.message_id)}
            >
              Move to Trash
            </button>
          )}
          {inTrash && (
            <>
              <button
                type="button"
                className={styles.actionBtn}
                onClick={() => restoreMessage(selectedMessage.message_id)}
              >
                Restore
              </button>
              <button
                type="button"
                className={styles.actionBtnDanger}
                onClick={() => deletePermanent(selectedMessage.message_id)}
              >
                Delete Permanently
              </button>
            </>
          )}
        </div>
      </>
    )
  }

  /* ── Main render ── */
  return (
    <>
      {error && <div className={styles.errorBar}>{error}</div>}

      <div className={styles.container}>
        {/* ── Folder sidebar ── */}
        <div className={styles.folderSidebar}>
          <button
            type="button"
            className={styles.composeBtn}
            onClick={() => setComposeOpen(true)}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" d="M12 5v14M5 12h14" />
            </svg>
            <span>Compose</span>
          </button>

          <ul className={styles.folderList}>
            {FOLDERS.map((f) => (
              <li
                key={f.key}
                className={`${styles.folderItem} ${activeFolder === f.key ? styles.folderItemActive : ''}`}
                onClick={() => {
                  setActiveFolder(f.key)
                  setSelectedId(null)
                  setActiveFilter('all')
                }}
              >
                <span className={styles.folderLabel}>
                  <span>{f.icon}</span>
                  <span>{f.label}</span>
                </span>
                <span
                  className={`${styles.folderCount} ${activeFolder === f.key ? styles.folderCountActive : ''}`}
                >
                  {folderCounts[f.key]}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Message list ── */}
        <div className={styles.listPanel}>
          <div className={styles.listHeader}>
            <div className={styles.searchRow}>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search messages..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                className={styles.sortSelect}
                value={sortDir}
                onChange={(e) => setSortDir(e.target.value as SortDir)}
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
              </select>
            </div>
            <div className={styles.filterPills}>
              {FILTER_PILLS.map((fp) => (
                <button
                  key={fp.key}
                  type="button"
                  className={`${styles.pill} ${activeFilter === fp.key ? styles.pillActive : ''}`}
                  onClick={() => setActiveFilter(fp.key)}
                >
                  {fp.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className={styles.loadingWrap}>
              <div className={styles.spinner} />
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className={styles.emptyList}>No messages found</div>
          ) : (
            <div className={styles.messageListScroll}>
              {filteredMessages.map((msg) => (
                <div
                  key={msg.message_id}
                  className={`${styles.messageRow} ${
                    selectedId === msg.message_id ? styles.messageRowSelected : ''
                  } ${!msg.is_read ? styles.messageRowUnread : ''}`}
                  onClick={() => selectMessage(msg)}
                >
                  <div className={styles.messageRowTop}>
                    <span className={styles.messageSubject}>{msg.subject}</span>
                    <span className={styles.messageDate}>{formatDate(msg.created_at)}</span>
                  </div>
                  <span className={styles.messagePreview}>
                    {msg.body?.slice(0, 80)}
                    {msg.body?.length > 80 ? '...' : ''}
                  </span>
                  <span className={badgeClass(msg.category)}>{msg.category}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Detail panel (desktop) ── */}
        <div className={styles.detailPanel}>
          {composeOpen ? renderComposeForm() : renderDetail()}
        </div>
      </div>

      {/* ── Detail overlay (mobile) ── */}
      {mobileDetailOpen && selectedMessage && (
        <div className={styles.mobileDetailOverlay}>
          <button
            type="button"
            className={styles.mobileDetailBack}
            onClick={() => {
              setMobileDetailOpen(false)
              setSelectedId(null)
            }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to messages
          </button>
          {renderDetail()}
        </div>
      )}

      {/* ── Compose overlay (mobile) ── */}
      {composeOpen && (
        <div className={styles.mobileDetailOverlay}>
          {renderComposeForm()}
        </div>
      )}
    </>
  )
}
