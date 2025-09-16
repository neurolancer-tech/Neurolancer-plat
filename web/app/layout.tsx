import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { Toaster } from 'react-hot-toast'
import Footer from '@/components/Footer'
import { Analytics } from '@vercel/analytics/next'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Neurolancer - AI Freelance Marketplace',
    template: '%s | Neurolancer'
  },
  description: 'Connect with skilled AI professionals and freelancers specializing in artificial intelligence, machine learning, and cutting-edge technology solutions.',
  keywords: ['AI freelancers', 'machine learning', 'artificial intelligence', 'freelance marketplace', 'AI experts', 'neural networks', 'data science'],
  authors: [{ name: 'Neurolancer Team' }],
  creator: 'Neurolancer',
  publisher: 'Neurolancer',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://neurolancer.work'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://neurolancer.work',
    siteName: 'Neurolancer',
    title: 'Neurolancer - AI Freelance Marketplace',
    description: 'Connect with skilled AI professionals and freelancers specializing in artificial intelligence, machine learning, and cutting-edge technology solutions.',
    images: [
      {
        url: '/assets/Neurolancer-logo/vector/default-monochrome.svg',
        width: 1200,
        height: 630,
        alt: 'Neurolancer - AI Freelance Marketplace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Neurolancer - AI Freelance Marketplace',
    description: 'Connect with skilled AI professionals and freelancers specializing in artificial intelligence, machine learning, and cutting-edge technology solutions.',
    images: ['/assets/Neurolancer-logo/vector/default-monochrome.svg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'eUoYC49uij1qjH3HIG8wMINsWardoBs-FQJPB6Mlj5c',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/assets/Neurolancer-logo/vector/neurolancer-favicon.svg" type="image/svg+xml" />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          {children}
          <Footer />
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}