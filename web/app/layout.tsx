import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import '../styles/scrollbar.css'
import { Toaster } from 'react-hot-toast'
import Script from 'next/script'
import { ThemeProvider } from '../contexts/ThemeContext'
import Footer from '../components/Footer'
import RoleGuard from '../components/RoleGuard'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Neurolancer - AI Freelance Marketplace',
  description: 'Connect with AI experts and freelancers',
  icons: {
    icon: '/assets/Neurolancer-logo/vector/neurolancer-favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="">
      <body className={`${inter.className} bg-gray-50 dark:bg-gray-900 transition-colors duration-200`}>
        <ThemeProvider>
          <RoleGuard>
            <div className="min-h-screen flex flex-col">
              <div className="flex-grow">
                {children}
              </div>
              <Footer />
            </div>
          </RoleGuard>
          <Toaster 
            position="top-right"
            toastOptions={{
              className: 'dark:bg-gray-800 dark:text-gray-100',
            }}
            containerStyle={{
              zIndex: 10
            }}
          />
        </ThemeProvider>
        <Script 
          src="https://js.paystack.co/v1/inline.js" 
          strategy="beforeInteractive"
        />
      </body>
    </html>
  )
}