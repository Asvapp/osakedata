'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

export default function Login() {
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
   
    try {
      // Kirjaudu sisään
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      
      // Tarkista onko käyttäjä estetty
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid))
      const userData = userDoc.data()
      
      if (userData?.disabled) {
        await auth.signOut() // Kirjaa käyttäjä ulos jos on estetty
        setError('Käyttäjätilisi on estetty. Ota yhteyttä ylläpitoon.')
        return
      }
  
      // Jos ei ole estetty, jatka normaalisti
      const token = await userCredential.user.getIdToken()
      document.cookie = `session=${token}; path=/;`
      router.push('/home')
  
    } catch (err: unknown) {
      console.error('Kirjautumisvirhe:', err)
      // ... muu error handling pysyy samana ...
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-no-repeat bg-cover bg-center" 
         style={{ backgroundImage: "url('/osakedata1.png')" }}>
      <div className="absolute inset-0 bg-black opacity-50"></div>
      <div className="w-full max-w-md bg-card-gray p-8 rounded-custom shadow-custom relative z-10">
        <h1 className="text-3xl text-center mb-8">Kirjaudu sisään</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
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
              className="w-full p-3 rounded-custom border border-gray-300 focus:outline-none focus:border-nav-blue"
              placeholder="Syötä salasanasi"
            />
          </div>
   
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-btn-blue text-white py-3 rounded-custom shadow-custom hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Kirjaudutaan...' : 'Kirjaudu'}
          </button>
        </form>
   
        <div className="text-center mt-6">
          <Link href="/register" className="text-nav-blue hover:underline">
            Eikö sinulla ole tiliä? Rekisteröidy tästä
          </Link>
        </div>
      </div>
    </div>
   )
}