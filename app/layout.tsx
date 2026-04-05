import type { Metadata } from 'next'
import { Raleway } from 'next/font/google'
import './globals.css'
import Footer from '@/components/Footer'

const raleway = Raleway({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-raleway',
})

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
    <html lang="en" className={raleway.variable}>
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body>
        {children}
        <Footer />
      </body>
    </html>
  )
}
