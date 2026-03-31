import Header from '@/components/Header'

export const metadata = { title: 'Support' }

export default function SupportPage() {
  return (
    <>
      <Header variant="site" />
      <main style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 600 }}>Support</h1>
      </main>
    </>
  )
}
