export interface PlanI {
  id: string
  name: string
  price: number
  interval: 'month'
  features: string[]
  recommended: boolean
  transcriptTokens: number
  gameTokens: number
}

export interface PlanII {
  id: string
  name: string
  price: number
  interval: 'one-time'
  weeks: number | null
  description: string
  mfjAddon: boolean
}

export const PLANS_I: PlanI[] = [
  {
    id: 'tmp-free',
    name: 'Free',
    price: 0,
    interval: 'month',
    transcriptTokens: 0,
    gameTokens: 0,
    recommended: false,
    features: [
      'Account & Membership Mgmt',
      'Calendar & Scheduling',
      'Discounts & Entitlements',
      'Messaging (Pro \u2194 Taxpayer)',
      'Profile Management',
      'Support Tickets',
      'Taxpayer Intake',
      'Token Balances',
      'Tool Usage History',
    ],
  },
  {
    id: 'tmp-essential',
    name: 'Essential',
    price: 9,
    interval: 'month',
    transcriptTokens: 2,
    gameTokens: 5,
    recommended: false,
    features: [
      'Everything in Free',
      '2 Transcript Tokens/mo',
      '5 Tax Tool Game Tokens/mo',
    ],
  },
  {
    id: 'tmp-plus',
    name: 'Plus',
    price: 19,
    interval: 'month',
    transcriptTokens: 5,
    gameTokens: 15,
    recommended: true,
    features: [
      'Everything in Essential',
      '5 Transcript Tokens/mo',
      '15 Tax Tool Game Tokens/mo',
    ],
  },
  {
    id: 'tmp-premier',
    name: 'Premier',
    price: 39,
    interval: 'month',
    transcriptTokens: 10,
    gameTokens: 40,
    recommended: false,
    features: [
      'Everything in Plus',
      '10 Transcript Tokens/mo',
      '40 Tax Tool Game Tokens/mo',
    ],
  },
]

export const PLANS_II: PlanII[] = [
  {
    id: 'tmp-bronze',
    name: 'Bronze',
    price: 275,
    interval: 'one-time',
    weeks: 6,
    description: '6-week IRS transcript monitoring',
    mfjAddon: false,
  },
  {
    id: 'tmp-silver',
    name: 'Silver',
    price: 325,
    interval: 'one-time',
    weeks: 8,
    description: '8-week IRS transcript monitoring',
    mfjAddon: false,
  },
  {
    id: 'tmp-gold',
    name: 'Gold',
    price: 425,
    interval: 'one-time',
    weeks: 12,
    description: '12-week IRS transcript monitoring',
    mfjAddon: false,
  },
  {
    id: 'tmp-snapshot',
    name: 'One-Time Snapshot',
    price: 425,
    interval: 'one-time',
    weeks: null,
    description: 'Single transcript analysis \u2014 no monitoring',
    mfjAddon: false,
  },
  {
    id: 'tmp-mfj',
    name: 'MFJ Add-On',
    price: 79,
    interval: 'one-time',
    weeks: null,
    description: 'Married Filing Jointly \u2014 add second spouse',
    mfjAddon: true,
  },
]
