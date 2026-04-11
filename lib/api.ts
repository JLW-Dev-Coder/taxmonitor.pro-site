const API_BASE = 'https://api.virtuallaunch.pro'

export class ApiError extends Error {
  status: number
  upgrade_url?: string

  constructor(message: string, status: number, upgrade_url?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.upgrade_url = upgrade_url
  }
}

interface ApiOptions extends RequestInit {
  auth?: boolean
}

/**
 * Canonical public profile response.
 * Mirrors /contracts/vlp/vlp.profile.public.v1.json in the VLP repo.
 */
export interface PublicProfileResponse {
  ok: boolean
  profile: {
    profile: {
      name: string
      slug: string
      status: 'featured' | 'hidden' | 'standard'
      status_badge_label: 'Featured' | 'Hidden' | 'Standard' | 'Verified' | null
      profile_type: 'live' | 'sample'
      initials: string
      avatar: {
        upload_type: 'firm_logo' | 'initials_only' | 'profile_photo'
        initials_fallback: boolean
        display_dimensions: { width: number; height: number }
        file: {
          file_type: string
          width: number
          height: number
        } | null
      }
    }
    professional: {
      profession: string[]
      credentials: string[]
      firm_name: string | null
      years_experience: number
    }
    hero: {
      headline: string
      location_label: string
      rating_label: string
      years_experience_label: string
      credential_badges: Array<{ label: string; style_key: string }>
    }
    location: {
      city: string
      state: string
      country: string
      zip: string | null
    }
    bio: {
      bio_short: string
      bio_full_paragraphs: string[]
    }
    contact: {
      contact_email: string | null
      phone: string | null
      website: string | null
      availability_display: string | null
      timezone: string | null
      languages: string[]
      weekly_availability: Array<{
        day: string
        enabled: boolean
        start_time: string | null
        end_time: string | null
      }>
    }
    services_offered: {
      items: Array<{
        title: string
        description: string
        icon: string
      }>
    }
    specializations: {
      client_types: string[]
    }
    credentials_experience: {
      licenses_certifications: Array<{
        title: string
        subtitle: string | null
      }>
      background_items: Array<{
        title: string
        date_label: string
        description: string
      }>
    }
    quick_stats: Array<{ label: string; value: string }>
    reviews: {
      enabled: boolean
      allow_submission: boolean
      summary: {
        average_rating: number
        review_count: number
      }
      items: Array<{
        name: string
        rating: 1 | 2 | 3 | 4 | 5
        text: string
      }>
    }
    buttons: {
      schedule_button: {
        show: boolean
        active: boolean
        label: string
        mode: 'cal_com' | 'custom_booking_link' | 'none'
        url: string | null
        provider_label: string
        behavior_phrase: string
        description: string | null
        description_mode: 'custom' | 'derived'
        event_type_label: string | null
        event_type_duration_minutes: number | null
      }
      contact_button: {
        show: boolean
        active: boolean
        label: string
        mode: 'email' | 'external_link' | 'inactive'
        url: string | null
      }
      review_button: {
        show: boolean
        active: boolean
        label: string
        mode: 'external_link' | 'inactive' | 'modal'
        url: string | null
      }
    }
  }
}

/**
 * Client-visible compliance report shape.
 * Mirrors tmp.compliance-record.read.v1.json in the VLP contract registry.
 */
export interface ComplianceReportResponse {
  ok: boolean
  record: {
    order_id: string
    status: 'draft' | 'final'
    client_name: string
    report_date: string
    prepared_at: string
    account_overview: {
      filing_status: string
      tax_year: number
      total_irs_balance: number
      irs_account_status: 'compliant' | 'limited' | 'non_compliant'
    }
    return_status: {
      processing_status: string
      date_filed: string | null
      tax_liability: number
    }
    notices: Array<{
      notice_id: string
      type: string
      date: string
      urgency: 'low' | 'medium' | 'high'
      details: string
    }>
    payment_plan: {
      ia_status: 'none' | 'pending' | 'established' | 'defaulted'
      monthly_payment: number | null
      payment_schedule: string | null
      start_date: string | null
    }
    summary: {
      compliance_client_summary: string
      report_prepared_date: string
    }
    professional: {
      name: string
      credential: string
      contact_consent: boolean
      contact_url: string | null
    }
  }
}

async function apiFetch<T>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const { auth = true, ...fetchOptions } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers as Record<string, string>,
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    credentials: auth ? 'include' : 'omit',
    headers,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const msg =
      (body as { error?: string }).error || `API error ${res.status}`
    const upgrade_url = (body as { upgrade_url?: string }).upgrade_url
    throw new ApiError(msg, res.status, upgrade_url)
  }

  return res.json()
}

export const api = {
  // Auth
  requestMagicLink: (email: string, redirectUri?: string) =>
    apiFetch('/v1/auth/magic-link/request', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ email, redirectUri }),
    }),

  getSession: () =>
    apiFetch<{
      ok: boolean
      session: {
        account_id: string
        email: string
        membership: string
        platform?: string
        expires_at?: string
        referral_code?: string | null
        transcript_tokens?: number
      }
    }>('/v1/auth/session'),

  logout: () =>
    apiFetch('/v1/auth/logout', { method: 'POST' }),

  exchangeHandoffToken: (token: string) =>
    apiFetch<{
      ok: boolean
      sessionId: string
      email: string
    }>(`/v1/auth/handoff/exchange?token=${encodeURIComponent(token)}`, {
      method: 'GET',
    }),

  // Pricing
  getPricing: () =>
    apiFetch<{
      ok: boolean
      plans: Array<{
        plan_id: string
        name: string
        price: number
        interval: string
        features: string[]
        recommended: boolean
      }>
    }>('/v1/tmp/pricing', { auth: false }),

  // Checkout
  createCheckoutSession: (
    price_id: string,
    success_url?: string
  ) =>
    apiFetch<{
      ok: boolean
      checkout_url: string
      session_id: string
    }>('/v1/checkout/sessions', {
      method: 'POST',
      body: JSON.stringify({ price_id, success_url }),
    }),

  getCheckoutStatus: (session_id: string) =>
    apiFetch<{
      ok: boolean
      status: string
      plan: string
    }>(`/v1/checkout/status?session_id=${session_id}`),

  // Directory
  getDirectory: (params?: {
    specialty?: string
    city?: string
    state?: string
    zip?: string
    page?: number
  }) => {
    const search = new URLSearchParams()
    if (params?.specialty) search.set('specialty', params.specialty)
    if (params?.city) search.set('city', params.city)
    if (params?.state) search.set('state', params.state)
    if (params?.zip) search.set('zip', params.zip)
    if (params?.page) search.set('page', String(params.page))
    const qs = search.toString()
    return apiFetch<{
      ok: boolean
      professionals: Array<{
        professional_id: string
        display_name: string
        bio: string | null
        specialties: string | null
        cal_booking_url: string | null
        city: string | null
        state: string | null
        zip: string | null
      }>
      page: number
      total: number
    }>(`/v1/tmp/directory${qs ? '?' + qs : ''}`, {
      auth: false,
    })
  },

  getProfile: (professional_id: string) =>
    apiFetch<PublicProfileResponse>(
      `/v1/profiles/public/${professional_id}`,
      { auth: false }
    ),

  // Inquiries
  createInquiry: (data: {
    professional_id?: string
    subject: string
    message: string
    tax_situation?: string
  }) =>
    apiFetch('/v1/tmp/inquiries', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Account
  getAccount: (account_id: string) =>
    apiFetch(`/v1/accounts/${account_id}`),

  updateAccount: (
    account_id: string,
    data: Record<string, unknown>
  ) =>
    apiFetch(`/v1/accounts/${account_id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Support
  createTicket: (data: {
    subject: string
    message: string
    priority?: string
  }) =>
    apiFetch('/v1/support/tickets', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        platform: 'tmp',
      }),
    }),

  getTicket: (ticket_id: string) =>
    apiFetch(`/v1/support/tickets/${ticket_id}`),

  getTicketsByAccount: (account_id: string) =>
    apiFetch(
      `/v1/support/tickets/by-account/${account_id}`
    ),

  // Account (extended)
  deleteAccount: (account_id: string) =>
    apiFetch(`/v1/accounts/${account_id}`, { method: 'DELETE' }),

  getPreferences: (account_id: string) =>
    apiFetch(`/v1/accounts/preferences/${account_id}`),

  updatePreferences: (account_id: string, data: Record<string, unknown>) =>
    apiFetch(`/v1/accounts/preferences/${account_id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  photoUploadInit: (account_id: string, file_type: string) =>
    apiFetch<{ ok: boolean; upload_url: string; key: string }>(
      '/v1/accounts/photo-upload-init',
      {
        method: 'POST',
        body: JSON.stringify({ account_id, file_type }),
      }
    ),

  photoUploadComplete: (account_id: string, key: string) =>
    apiFetch('/v1/accounts/photo-upload-complete', {
      method: 'POST',
      body: JSON.stringify({ account_id, key }),
    }),

  getComplianceStatus: (account_id: string) =>
    apiFetch(`/v1/accounts/${account_id}/status`),

  // 2FA
  get2faStatus: (account_id: string) =>
    apiFetch(`/v1/auth/2fa/status/${account_id}`),

  enroll2faInit: () =>
    apiFetch('/v1/auth/2fa/enroll/init', { method: 'POST' }),

  enroll2faVerify: (code: string) =>
    apiFetch('/v1/auth/2fa/enroll/verify', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),

  disable2fa: (code: string) =>
    apiFetch('/v1/auth/2fa/disable', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),

  // Billing
  getReceipts: (account_id: string) =>
    apiFetch(`/v1/billing/receipts/${account_id}`),

  // Messaging
  sendMessage: (payload: Record<string, unknown>) =>
    apiFetch('/v1/support/messages', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Support (extended)
  updateTicket: (ticket_id: string, data: Record<string, unknown>) =>
    apiFetch(`/v1/support/tickets/${ticket_id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Compliance Report
  generateReport: (account_id: string, tax_year: number) =>
    apiFetch('/v1/compliance/report-generate', {
      method: 'POST',
      body: JSON.stringify({ account_id, tax_year }),
    }),

  getComplianceReport: (order_id: string) =>
    apiFetch<ComplianceReportResponse>(
      `/v1/tmp/compliance-records/${encodeURIComponent(order_id)}/report`
    ),

  // Calendar
  getCalStatus: () =>
    apiFetch('/v1/cal/status'),

  startCalOAuth: () =>
    apiFetch<{
      ok: boolean
      status?: string
      authorizationUrl?: string
    }>('/v1/cal/oauth/start'),

  // Tokens
  getTokenBalance: (account_id: string) =>
    apiFetch<{ transcript_tokens: number; tax_game_tokens: number }>(
      `/v1/tokens/balance/${account_id}`
    ),

  // Inquiries
  getInquiries: (account_id?: string) => {
    const qs = account_id ? `?account_id=${account_id}` : ''
    return apiFetch<unknown[]>(`/v1/inquiries${qs}`)
  },

  // Notifications
  getNotifications: () =>
    apiFetch('/v1/notifications/in-app'),

  updateNotificationPreferences: (
    account_id: string,
    prefs: Record<string, boolean>
  ) =>
    apiFetch(
      `/v1/notifications/preferences/${account_id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(prefs),
      }
    ),

  // Affiliates
  getAffiliate: (account_id: string) =>
    apiFetch<{
      ok: boolean
      referral_code: string
      connect_status: string
      balance_pending: number
      balance_paid: number
      referral_url: string
    }>(`/v1/affiliates/${account_id}`),

  getAffiliateEvents: (account_id: string) =>
    apiFetch<{
      ok: boolean
      events: Array<{
        platform: string
        gross_amount: number
        commission_amount: number
        status: string
        created_at: string
      }>
    }>(`/v1/affiliates/${account_id}/events`),

  startAffiliateOnboarding: () =>
    apiFetch<{ ok: boolean; onboard_url: string }>(
      '/v1/affiliates/connect/onboard',
      { method: 'POST' }
    ),

  requestPayout: (amount: number) =>
    apiFetch<{ ok: boolean; payout_id: string; amount: number; status: string }>(
      '/v1/affiliates/payout/request',
      {
        method: 'POST',
        body: JSON.stringify({ amount }),
      }
    ),

  getPayoutStatus: (payout_id: string) =>
    apiFetch<{ ok: boolean; payout_id: string; amount: number; status: string }>(
      `/v1/affiliates/payout/${payout_id}`
    ),

  // TMP Membership & Monitoring
  getTmpPricing: () =>
    apiFetch<{
      ok: boolean
      plan_i: Array<{
        key: string
        name: string
        price: number
        interval: 'month' | 'year'
        price_id: string
        features: string[]
      }>
      plan_ii: Array<{
        key: string
        name: string
        price: number
        duration: string
        price_id: string
        features: string[]
      }>
      addons: Array<{
        key: string
        name: string
        price: number
        price_id: string
        features: string[]
      }>
    }>('/v1/tmp/pricing', { auth: false }),

  createTmpCheckout: (plan_key: string, addon_mfj?: boolean) =>
    apiFetch<{
      ok: boolean
      session_url: string
      session_id: string
    }>('/v1/tmp/memberships/checkout', {
      method: 'POST',
      body: JSON.stringify({ plan_key, addon_mfj: addon_mfj ?? false }),
    }),

  getTmpMembership: (account_id: string) =>
    apiFetch<{
      ok: boolean
      membership: {
        plan_key: string
        plan_name: string
        plan_tier: 'I' | 'II'
        status: string
        started_at: string
        expires_at?: string
      } | null
    }>(`/v1/tmp/memberships/${account_id}`),

  getTmpDashboard: () =>
    apiFetch<{
      ok: boolean
      plan_key: string
      plan_name: string
      plan_tier: 'I' | 'II'
      status: string
    }>('/v1/tmp/dashboard'),

  generate2848: (payload: Record<string, unknown>) =>
    apiFetch<{
      ok: boolean
      pdf_base64: string
      filename: string
    }>('/v1/tools/2848/generate', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getTmpMonitoringStatus: () =>
    apiFetch<{
      ok: boolean
      phase: string
      phase_label: string
      started_at: string
      expected_end: string
      intake_complete: number
      esign_2848_complete: number
      processing_complete: number
      tax_record_complete: number
      current_step?: string
      step_status?: string
      notes?: string
    }>('/v1/tmp/monitoring/status'),
}
