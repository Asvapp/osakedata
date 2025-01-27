'use client'

import { useState, useEffect } from 'react'
import { auth, db } from '@/lib/firebase'
import { 
  updateProfile, 
  updatePassword, 
  EmailAuthProvider, 
  reauthenticateWithCredential,
  AuthError 
} from 'firebase/auth'
import { doc, updateDoc } from 'firebase/firestore'

export default function AsetuksetSivu() {
  const [userName, setUserName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    const user = auth.currentUser
    if (user) {
      setUserName(user.displayName || '')
    }
  }, [])

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccessMessage('')

    const user = auth.currentUser
    if (!user) return

    try {
      await updateProfile(user, {
        displayName: userName
      })

      // Päivitä myös Firestore
      const userRef = doc(db, 'users', user.uid)
      await updateDoc(userRef, {
        name: userName
      })

      setSuccessMessage('Nimi päivitetty onnistuneesti')
    } catch (error) {
      console.error('Virhe nimen päivityksessä:', error)
      setError('Nimen päivitys epäonnistui')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccessMessage('')

    const user = auth.currentUser
    if (!user || !user.email) return

    try {
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      )
      await reauthenticateWithCredential(user, credential)
      await updatePassword(user, newPassword)
      
      setSuccessMessage('Salasana vaihdettu onnistuneesti')
      setNewPassword('')
      setCurrentPassword('')
    } catch (error) {
      console.error('Virhe salasanan vaihdossa:', error)
      const authError = error as AuthError
      if (authError.code === 'auth/wrong-password') {
        setError('Nykyinen salasana on virheellinen')
      } else {
        setError('Salasanan vaihto epäonnistui')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Asetukset</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}

      <div className="bg-card-gray rounded-xl shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Käyttäjätiedot</h2>
        <form onSubmit={handleUpdateName} className="space-y-4">
          <div>
            <label htmlFor="name" className="block mb-2">Käyttäjänimi</label>
            <input
              id="name"
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:border-nav-blue"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-btn-blue text-white px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Tallennetaan...' : 'Tallenna nimi'}
          </button>
        </form>
      </div>

      <div className="bg-card-gray rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Vaihda salasana</h2>
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label htmlFor="currentPassword" className="block mb-2">Nykyinen salasana</label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:border-nav-blue"
              required
            />
          </div>
          <div>
            <label htmlFor="newPassword" className="block mb-2">Uusi salasana</label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:border-nav-blue"
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-btn-blue text-white px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Vaihdetaan...' : 'Vaihda salasana'}
          </button>
        </form>
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h2 className="text-xl font-semibold mb-2">Premium-ominaisuudet</h2>
        <p className="text-gray-600">Tulossa pian!</p>
      </div>
    </div>
  )
}