import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Tax Monitor Pro',
  description: 'Proactive tax monitoring for taxpayers.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
