'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/firebase'
import { signOut } from 'firebase/auth'
import Image from 'next/image'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [userName, setUserName] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        console.log("Current user:", user)
        setUserName(user.displayName || 'Käyttäjä')
      } else {
        router.push('/login')
      }
    })

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.user-menu')) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)

    return () => {
      unsubscribe()
      document.removeEventListener('click', handleClickOutside)
    }
  }, [router])

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push('/') // Ohjaa welcome-sivulle
    } catch (error) {
      console.error('Uloskirjautumisvirhe:', error)
    }
  }

  return (
    <div className="min-h-screen font-quicksand">
      <header className="bg-nav-blue shadow-custom h-16 flex items-center justify-between px-1">
        <Link href="/home" className="text-white">
          <Image 
            src="/osakedatalogo.png" 
            alt="Osakedata" 
            width={80}
            height={50}
            priority
          />
        </Link>
        
        <div className="flex items-center gap-6 text-white">
          <Link href="/suosikit" className="hover:opacity-80">
            Suosikit
          </Link>
          <Link href="/laskurit" className="hover:opacity-80">
            Laskurit
          </Link>
          <div className="border-l border-white/30 h-6 mx-2" />
          
          <div className="relative user-menu">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsDropdownOpen(!isDropdownOpen)
              }}
              className="hover:opacity-80 flex items-center gap-2"
            >
              <span>{userName}</span>
              <svg 
                className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1">
                <Link 
                  href="/asetukset" 
                  className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
                >
                  Asetukset
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100"
                >
                  Kirjaudu ulos
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
 
      <main className="p-6">
        {children}
      </main>
    </div>
  )
}