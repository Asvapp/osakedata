'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { useRouter } from 'next/navigation'

interface Stock {
  ticker: string
  name: string
  price: number
  change: number
}

// Mock-data kunnes API integraatio on valmis
const stockData: Record<string, Stock> = {
  'NOKIA': { ticker: 'NOKIA', name: 'Nokia Oyj', price: 3.45, change: 1.2 },
  'SAMPO': { ticker: 'SAMPO', name: 'Sampo Oyj', price: 42.85, change: -0.5 },
  'HUKI': { ticker: 'HUKI', name: 'Huhtamäki Oyj', price: 34.40, change: -0.64 },
  'FORTUM': { ticker: 'FORTUM', name: 'Fortum Oyj', price: 12.38, change: 0.8 },
  'UPM': { ticker: 'UPM', name: 'UPM-Kymmene Oyj', price: 28.75, change: -0.2 }
}

export default function SuosikitSivu() {
  const router = useRouter()
  const [favorites, setFavorites] = useState<Stock[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchFavorites = async () => {
      const user = auth.currentUser
      if (!user) {
        router.push('/login')
        return
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          const favoriteTickers = userData.favorites || []
          
          // Haetaan osakkeista tiedot (myöhemmin API:sta)
          const favoriteStocks = favoriteTickers
            .filter((ticker: string) => ticker in stockData)
            .map((ticker: string) => stockData[ticker])
          
          setFavorites(favoriteStocks)
        }
      } catch (error) {
        console.error('Virhe suosikkien haussa:', error)
        setError('Suosikkien hakeminen epäonnistui')
      } finally {
        setLoading(false)
      }
    }

    fetchFavorites()
  }, [router])

  const handleRemoveFavorite = async (stockTicker: string) => {
    const user = auth.currentUser
    if (!user) return

    try {
      const userRef = doc(db, 'users', user.uid)
      const userDoc = await getDoc(userRef)
      
      if (userDoc.exists()) {
        const userData = userDoc.data()
        const newFavorites = (userData.favorites || []).filter((t: string) => t !== stockTicker)
        
        // Päivitä Firestore
        await updateDoc(userRef, {
          favorites: newFavorites
        })

        // Päivitä paikallinen tila
        setFavorites(prevFavorites => 
          prevFavorites.filter(stock => stock.ticker !== stockTicker)
        )
      }
    } catch (error) {
      console.error('Virhe suosikin poistossa:', error)
      setError('Suosikin poistaminen epäonnistui')
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8">Omat osakkeet</h1>
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nav-blue"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8">Omat osakkeet</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Omat osakkeet</h1>

      {favorites.length === 0 ? (
        <div className="text-center py-12 bg-card-gray rounded-xl">
          <p className="text-gray-600">Ei vielä suosikkiosakkeita</p>
          <Link href="/home" className="text-nav-blue hover:underline mt-2 inline-block">
            Siirry etsimään osakkeita
          </Link>
        </div>
      ) : (
        <div className="bg-card-gray rounded-xl shadow-lg">
          {favorites.map(stock => (
            <div 
              key={stock.ticker}
              className="flex items-center justify-between p-4 hover:bg-gray-50 border-b last:border-b-0"
            >
              <Link 
                href={`/osake/${stock.ticker}`}
                className="flex-grow flex items-center justify-between hover:bg-transparent"
              >
                <div>
                  <div className="font-medium">{stock.ticker}</div>
                  <div className="text-sm text-gray-600">{stock.name}</div>
                </div>
                <div className="text-right">
                  <div>{stock.price.toFixed(2)} €</div>
                  <div className={stock.change >= 0 ? "text-green-500" : "text-red-500"}>
                    {stock.change > 0 ? "+" : ""}{stock.change}%
                  </div>
                </div>
              </Link>
              <button
                onClick={() => handleRemoveFavorite(stock.ticker)}
                className="ml-4 p-2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}