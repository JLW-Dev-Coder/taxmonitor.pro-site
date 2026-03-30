import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const metadata = { title: 'Status' }

export default function StatusPage() {
  return (
    <>
      <Header variant="site" />
      <main style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 600 }}>Status</h1>
      </main>
      <Footer />
    </>
  )
}
