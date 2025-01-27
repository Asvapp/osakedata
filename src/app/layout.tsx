import type { Metadata } from 'next'
import { Quicksand } from 'next/font/google'
import './globals.css'
import AuthLayout from './layouts/AuthLayout'

const quicksand = Quicksand({ 
  subsets: ['latin'],
  weight: ['600']
})

export const metadata: Metadata = {
  title: 'Osakedata',
  description: 'Suomalainen osakedata sovellus',
  manifest: '/manifest.json',
  themeColor: '#1a4b8c',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Osakedata',
  },
  formatDetection: {
    telephone: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fi">
      <body className={quicksand.className}>
        <AuthLayout>
          {children}
        </AuthLayout>
      </body>
    </html>
  )
}