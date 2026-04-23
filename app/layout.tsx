import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

export const metadata: Metadata = {
  title: 'QuoteSnap — AI Quote Generator for Tradies',
  description:
    'Record a voice note after your site visit. Get a professional branded quote in 60 seconds. AI-powered quoting for builders, landscapers and earthworks operators.',
  keywords: 'quote generator, tradie quotes, builder quotes, landscaper quotes, AI quoting, Australian tradies',
  openGraph: {
    title: 'QuoteSnap — AI Quote Generator for Tradies',
    description: 'Voice to professional quote in 60 seconds. Built for Australian tradies.',
    type: 'website',
    locale: 'en_AU',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en-AU" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,400;1,9..144,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
