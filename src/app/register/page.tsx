'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import type { UserData } from '@/types/users'

export default function Register() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const name = formData.get('name') as string

    if (!email || !password || !name) {
      setError('Kaikki kentät ovat pakollisia')
      setLoading(false)
      return
    }

    try {
      // Luo käyttäjä Firebaseen
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Päivitä käyttäjän näyttönimi
      await updateProfile(user, {
        displayName: name
      })

      // Luo käyttäjän tiedot Firestoreen
      const userData: UserData = {
        uid: user.uid,
        name,
        email,
        createdAt: new Date().toISOString(),
        favorites: [],
        lastLogin: new Date().toISOString(),
        disabled: false  // Tämä lisätty
      }

      // Tallenna käyttäjätiedot Firestoreen
      await setDoc(doc(db, 'users', user.uid), userData)

      // Ohjaa käyttäjä kotisivulle
      router.push('/home')
    } catch (err: unknown) {
      console.error('Rekisteröintivirhe:', err)
      
      if (err && typeof err === 'object' && 'code' in err) {
        if (err.code === 'auth/email-already-in-use') {
          setError('Sähköpostiosoite on jo käytössä')
        } else if (err.code === 'auth/weak-password') {
          setError('Salasana on liian heikko (vähintään 6 merkkiä)')
        } else if (err.code === 'auth/invalid-email') {
          setError('Virheellinen sähköpostiosoite')
        }
      } else {
        setError('Rekisteröinti epäonnistui. Yritä uudelleen.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-no-repeat bg-cover bg-center" 
         style={{ backgroundImage: "url('/osakedata1.png')" }}>
      <div className="absolute inset-0 bg-black opacity-50"></div>
      <div className="w-full max-w-md bg-card-gray p-8 rounded-custom shadow-custom relative z-10">
        <h1 className="text-3xl text-center mb-8">Luo tili</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block mb-2">Nimi</label>
            <input
              id="name"
              name="name"
              type="text"
              required
              minLength={2}
              className="w-full p-3 rounded-custom border border-gray-300 focus:outline-none focus:border-nav-blue"
              placeholder="Syötä nimesi"
            />
          </div>
   
          <div>
            <label htmlFor="email" className="block mb-2">Sähköposti</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full p-3 rounded-custom border border-gray-300 focus:outline-none focus:border-nav-blue"
              placeholder="email@esimerkki.com"
            />
          </div>
   
          <div>
            <label htmlFor="password" className="block mb-2">Salasana</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              className="w-full p-3 rounded-custom border border-gray-300 focus:outline-none focus:border-nav-blue"
              placeholder="Vähintään 6 merkkiä"
            />
          </div>
   
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-btn-blue text-white py-3 rounded-custom shadow-custom hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Rekisteröidään...' : 'Rekisteröidy'}
          </button>
        </form>
   
        <div className="text-center mt-6">
          <Link href="/login" className="text-nav-blue hover:underline">
            Onko sinulla jo tili? Kirjaudu sisään
          </Link>
        </div>
      </div>
    </div>
   )
}