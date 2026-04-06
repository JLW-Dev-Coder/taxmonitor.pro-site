'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import AuthGuard from '@/components/AuthGuard'
import AppShell from '@/components/AppShell'
import { api } from '@/lib/api'
import type { SessionUser } from '@/components/AuthGuard'
import styles from './page.module.css'

/* ───── Types ───── */

interface CalEvent {
  id: string
  title: string
  date: Date
  time: string
  category: 'appointment' | 'deadline' | 'reminder' | 'meeting'
  description?: string
}

type TabKey = 'calendar' | 'onboarding' | 'exit'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'calendar', label: 'My Calendar' },
  { key: 'onboarding', label: 'Book Onboarding' },
  { key: 'exit', label: 'Book Exit/Offboarding' },
]

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const CATEGORY_COLORS: Record<CalEvent['category'], string> = {
  appointment: styles.eventDotBlue,
  deadline: styles.eventDotRed,
  reminder: styles.eventDotAmber,
  meeting: styles.eventDotGreen,
}

const CATEGORY_HEX: Record<CalEvent['category'], string> = {
  appointment: '#3b82f6',
  deadline: '#EF4444',
  reminder: '#F59E0B',
  meeting: '#22C55E',
}

/* ───── Helpers ───── */

function generateDemoEvents(year: number, month: number): CalEvent[] {
  const events: CalEvent[] = [
    { id: 'e1', title: 'Tax Filing Deadline', date: new Date(year, month, 15), time: '11:59 PM', category: 'deadline', description: 'Deadline to submit quarterly estimated tax payments.' },
    { id: 'e2', title: 'Advisor Check-in', date: new Date(year, month, 8), time: '10:00 AM', category: 'appointment', description: 'Monthly call with your assigned tax professional.' },
    { id: 'e3', title: 'Document Upload Reminder', date: new Date(year, month, 5), time: '9:00 AM', category: 'reminder', description: 'Upload W-2 and 1099 forms before your next appointment.' },
    { id: 'e4', title: 'Team Review Meeting', date: new Date(year, month, 20), time: '2:00 PM', category: 'meeting', description: 'Internal review of your compliance status with the monitoring team.' },
    { id: 'e5', title: 'Payment Due', date: new Date(year, month, 25), time: '5:00 PM', category: 'deadline', description: 'Subscription payment will be processed.' },
    { id: 'e6', title: 'Compliance Status Update', date: new Date(year, month, 12), time: '3:00 PM', category: 'reminder', description: 'Review your latest compliance report in the Status tab.' },
    { id: 'e7', title: 'Onboarding Follow-up', date: new Date(year, month, 3), time: '11:00 AM', category: 'appointment', description: 'Follow-up call to verify account setup and document collection.' },
  ]
  return events
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

/* ───── Sub-components ───── */

function CalendarSkeleton() {
  return (
    <div className={styles.calendarLayout}>
      <div>
        <div className={`${styles.skeleton} ${styles.skeletonHeader}`} />
        <div className={styles.skeletonGrid}>
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className={`${styles.skeleton} ${styles.skeletonCell}`} />
          ))}
        </div>
      </div>
      <div className={`${styles.skeleton} ${styles.skeletonSidebar}`} />
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className={styles.errorWrap}>
      <p className={styles.errorTitle}>Something went wrong</p>
      <p className={styles.errorMsg}>{message}</p>
      <button className={styles.retryBtn} onClick={onRetry}>Try Again</button>
    </div>
  )
}

function ConnectCalendarPrompt() {
  return (
    <div className={`${styles.glassCard} ${styles.connectPrompt}`}>
      <div className={styles.connectIcon}>
        <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      </div>
      <p className={styles.connectTitle}>Connect Your Calendar</p>
      <p className={styles.connectDesc}>
        Link your calendar to sync appointments, deadlines, and reminders automatically with Tax Monitor Pro.
      </p>
      <a
        href="https://api.taxmonitor.pro/v1/cal/oauth/start"
        target="_blank"
        rel="noopener noreferrer"
        className={styles.connectBtn}
      >
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        Connect Calendar
      </a>
    </div>
  )
}

function EventModal({ event, onClose }: { event: CalEvent; onClose: () => void }) {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{event.title}</h3>
          <button className={styles.modalClose} onClick={onClose} aria-label="Close">&times;</button>
        </div>
        <div className={styles.modalDetail}>
          <span className={styles.modalDetailIcon}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          </span>
          {event.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
        <div className={styles.modalDetail}>
          <span className={styles.modalDetailIcon}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <path strokeLinecap="round" d="M12 6v6l4 2" />
            </svg>
          </span>
          {event.time}
        </div>
        {event.description && (
          <div className={styles.modalDetail}>
            <span className={styles.modalDetailIcon}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
              </svg>
            </span>
            {event.description}
          </div>
        )}
        <span className={styles.modalBadge} style={{ backgroundColor: CATEGORY_HEX[event.category] }}>
          {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
        </span>
      </div>
    </div>
  )
}

/* ───── My Calendar Tab ───── */

function MyCalendarTab() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connected, setConnected] = useState<boolean | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null)

  const checkConnection = useCallback(() => {
    setLoading(true)
    setError(null)
    api.getCalStatus()
      .then((res: unknown) => {
        const data = res as { connected?: boolean }
        setConnected(data.connected !== false)
      })
      .catch(() => {
        // If the endpoint fails, assume not connected but still show calendar with demo data
        setConnected(false)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    checkConnection()
  }, [checkConnection])

  const events = useMemo(() => generateDemoEvents(year, month), [year, month])

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfWeek(year, month)
  const prevMonthDays = getDaysInMonth(year, month - 1)

  const calendarCells = useMemo(() => {
    const cells: { day: number; month: number; year: number; isCurrentMonth: boolean }[] = []

    // Previous month trailing days
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevMonthDays - i
      const m = month === 0 ? 11 : month - 1
      const y = month === 0 ? year - 1 : year
      cells.push({ day: d, month: m, year: y, isCurrentMonth: false })
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, month, year, isCurrentMonth: true })
    }

    // Next month leading days
    const remaining = 42 - cells.length
    for (let d = 1; d <= remaining; d++) {
      const m = month === 11 ? 0 : month + 1
      const y = month === 11 ? year + 1 : year
      cells.push({ day: d, month: m, year: y, isCurrentMonth: false })
    }

    return cells
  }, [year, month, daysInMonth, firstDay, prevMonthDays])

  const upcomingEvents = useMemo(() => {
    return [...events]
      .filter((e) => e.date >= new Date(today.getFullYear(), today.getMonth(), today.getDate()))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 5)
  }, [events, today])

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1) }
    else setMonth(month - 1)
  }

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(year + 1) }
    else setMonth(month + 1)
  }

  const goToday = () => {
    setMonth(today.getMonth())
    setYear(today.getFullYear())
  }

  if (loading) return <CalendarSkeleton />
  if (error) return <ErrorState message={error} onRetry={checkConnection} />

  return (
    <>
      {connected === false && <ConnectCalendarPrompt />}

      <div className={styles.calendarLayout}>
        <div className={styles.glassCard}>
          <div className={styles.calendarHeader}>
            <div className={styles.calendarNav}>
              <button className={styles.navBtn} onClick={prevMonth} aria-label="Previous month">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className={styles.monthLabel}>{MONTH_NAMES[month]} {year}</span>
              <button className={styles.navBtn} onClick={nextMonth} aria-label="Next month">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <button className={styles.todayBtn} onClick={goToday}>Today</button>
          </div>

          <div className={styles.calendarGrid}>
            <div className={styles.dayHeaders}>
              {DAY_NAMES.map((d) => (
                <div key={d} className={styles.dayHeader}>{d}</div>
              ))}
            </div>
            <div className={styles.daysGrid}>
              {calendarCells.map((cell, idx) => {
                const cellDate = new Date(cell.year, cell.month, cell.day)
                const isToday = isSameDay(cellDate, today)
                const dayEvents = events.filter((e) => isSameDay(e.date, cellDate))

                return (
                  <div
                    key={idx}
                    className={`${styles.dayCell} ${!cell.isCurrentMonth ? styles.dayCellOtherMonth : ''} ${isToday ? styles.dayCellToday : ''}`}
                    onClick={() => dayEvents.length > 0 && setSelectedEvent(dayEvents[0])}
                  >
                    <div className={styles.dayNumber}>
                      {isToday ? (
                        <span className={styles.dayNumberToday}>{cell.day}</span>
                      ) : (
                        cell.day
                      )}
                    </div>
                    {dayEvents.length > 0 && (
                      <div className={styles.eventDots}>
                        {dayEvents.slice(0, 2).map((ev) => (
                          <div key={ev.id} className={`${styles.eventDot} ${CATEGORY_COLORS[ev.category]}`}>
                            {ev.title}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Upcoming Events Sidebar */}
        <div className={`${styles.glassCard} ${styles.sidebar}`}>
          <h3 className={styles.sidebarTitle}>Upcoming Events</h3>
          {upcomingEvents.length === 0 ? (
            <p className={styles.noEvents}>No upcoming events this month.</p>
          ) : (
            <div className={styles.eventList}>
              {upcomingEvents.map((ev) => (
                <div key={ev.id} className={styles.eventCard} onClick={() => setSelectedEvent(ev)}>
                  <div className={styles.eventColorBar} style={{ backgroundColor: CATEGORY_HEX[ev.category] }} />
                  <div className={styles.eventInfo}>
                    <div className={styles.eventName}>{ev.title}</div>
                    <div className={styles.eventTime}>{ev.time}</div>
                    <div className={styles.eventDate}>
                      {ev.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedEvent && <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
    </>
  )
}

/* ───── Booking Tabs ───── */

function BookingTab({ namespace, calLink }: { namespace: string; calLink: string }) {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    // Load Cal.com embed script
    const existingScript = document.querySelector('script[src="https://app.cal.com/embed/embed.js"]')
    const init = () => {
      const Cal = (window as unknown as Record<string, unknown>).Cal as ((...args: unknown[]) => void) | undefined
      if (Cal) {
        Cal('init', { origin: 'https://cal.com' })
        Cal('inline', {
          calLink,
          elementOrSelector: `#cal-${namespace}`,
        })
        setLoaded(true)
      }
    }

    if (existingScript && (window as unknown as Record<string, unknown>).Cal) {
      init()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://app.cal.com/embed/embed.js'
    script.async = true
    script.onload = () => {
      // Small delay for Cal to initialize on window
      setTimeout(init, 200)
    }
    document.head.appendChild(script)

    return () => {
      // Cleanup not needed — script persists across tab switches
    }
  }, [namespace, calLink])

  const title = namespace.includes('exit') ? 'Exit / Offboarding' : 'Onboarding'

  return (
    <div className={`${styles.glassCard} ${styles.embedWrap}`}>
      <h3 className={styles.embedTitle}>Book {title} Session</h3>
      <p className={styles.embedDesc}>
        {namespace.includes('exit')
          ? 'Schedule your exit or offboarding session with our tax monitoring team.'
          : 'Schedule your onboarding session to get started with Tax Monitor Pro.'}
      </p>
      {!loaded && (
        <div className={`${styles.skeleton}`} style={{ height: 480 }} />
      )}
      <div id={`cal-${namespace}`} className={styles.calEmbed} />
    </div>
  )
}

/* ───── Main Content ───── */

function CalendarContent({ account }: { account: SessionUser }) {
  const [activeTab, setActiveTab] = useState<TabKey>('calendar')

  return (
    <div className={styles.page}>
      <h1 className={styles.pageTitle}>Calendar</h1>

      <div className={styles.tabs}>
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`${styles.tab} ${activeTab === t.key ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'calendar' && <MyCalendarTab />}
      {activeTab === 'onboarding' && (
        <BookingTab
          namespace="tax-monitor-service-onboarding"
          calLink="tax-monitor-service-onboarding"
        />
      )}
      {activeTab === 'exit' && (
        <BookingTab
          namespace="tax-monitor-service-exit-offboarding"
          calLink="tax-monitor-service-exit-offboarding"
        />
      )}
    </div>
  )
}

/* ───── Page Export ───── */

export default function CalendarPage() {
  return (
    <AuthGuard>
      {({ account }) => (
        <AppShell account={account}>
          <CalendarContent account={account} />
        </AppShell>
      )}
    </AuthGuard>
  )
}
