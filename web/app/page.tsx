import { redirect } from 'next/navigation'

// Phase 2 scaffold — root redirects to /sign-in.
// Phase 3 will replace this with session-aware routing.
export default function RootPage() {
  redirect('/sign-in')
}
