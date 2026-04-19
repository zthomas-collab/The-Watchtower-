import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'The Watchtower — U.S. Real Estate Intelligence',
    template: '%s | The Watchtower',
  },
  description:
    'The clearest picture of where America is moving, building, and buying. Track housing, migration, jobs, affordability, and market risk across every U.S. market.',
  keywords: [
    'real estate intelligence',
    'housing market data',
    'migration trends',
    'market analytics',
    'real estate investing',
    'housing affordability',
  ],
  openGraph: {
    type: 'website',
    siteName: 'The Watchtower',
    title: 'The Watchtower — U.S. Real Estate Intelligence',
    description:
      'Track housing, migration, jobs, affordability, and market risk across every U.S. market.',
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  )
}
