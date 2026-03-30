'use client'

import Clients from './Clients'
import type { SessionUser } from '@/components/AuthGuard'

export default function MonitoredClients({ account }: { account: SessionUser }) {
  return <Clients account={account} filterPlan="monitoring" />
}
