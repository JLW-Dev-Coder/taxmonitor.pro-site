import type { Metadata } from 'next'
import './globals.css'
import SiteFooter from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: {
    default: 'Tax Monitor Pro',
    template: '%s | Tax Monitor Pro',
  },
  description:
    'Professional IRS transcript monitoring and tax resolution services.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Serif+Display&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <SiteFooter />
      </body>
    </html>
  )
}
