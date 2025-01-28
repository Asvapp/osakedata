import type { Metadata } from 'next'
import { Quicksand } from 'next/font/google'
import './globals.css'
import AuthLayout from './layouts/AuthLayout'
import ServiceWorkerRegistration from './components/ServiceWorkerRegistration'

const quicksand = Quicksand({ 
  subsets: ['latin'],
  weight: ['600']
})

export const metadata: Metadata = {
  title: 'Osakedata',
  description: 'Suomalainen osakedata sovellus',
  manifest: '/api/manifest',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fi">
      <head>
        <link rel="manifest" href="/api/manifest" crossOrigin="use-credentials" />
        <meta name="theme-color" content="#1a4b8c" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Osakedata" />
      </head>
      <body className={quicksand.className}>
        <ServiceWorkerRegistration />
        <AuthLayout>
          {children}
        </AuthLayout>
      </body>
    </html>
  )
}