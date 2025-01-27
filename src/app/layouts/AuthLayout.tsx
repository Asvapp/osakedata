'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import MainLayout from './MainLayout'

// Julkiset reitit (ei tarvitse autentikaatiota)
const publicRoutes = ['/', '/login', '/register']

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Ohjaa etusivulta/loginista/rekisteröinnistä sisäänkirjautuneet käyttäjät home-sivulle
      if (user && publicRoutes.includes(pathname)) {
        router.push('/home')
      } 
      // Ohjaa ei-kirjautuneet käyttäjät login-sivulle jos he yrittävät päästä suojatuille sivuille
      else if (!user && !publicRoutes.includes(pathname)) {
        router.push('/login')
      }
      
      setLoading(false)
    })

    return () => unsubscribe()
  }, [pathname, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nav-blue"></div>
      </div>
    )
  }

  // MainLayout vain suojatuille reiteille
  if (!publicRoutes.includes(pathname)) {
    return <MainLayout>{children}</MainLayout>
  }

  return children
}