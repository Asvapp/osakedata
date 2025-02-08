"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/firebase'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface IndexData {
  change: number
  price: number
}

interface MarketData {
  omxh: IndexData
  sp500: IndexData
}

interface Stock {
  id: string
  name: string
  createdAt: Date
}

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('')
  const [marketData, setMarketData] = useState<MarketData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [stocks, setStocks] = useState<Stock[]>([])

  useEffect(() => {
    const checkAdmin = async () => {
      const user = await getCurrentUser()
      setIsAdmin(user?.admin || false)
    }
    checkAdmin()
  }, [])

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const stocksRef = collection(db, 'stocks')
        const snapshot = await getDocs(stocksRef)
        const stocksData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate()
        })) as Stock[]
        setStocks(stocksData)
      } catch (error) {
        console.error('Virhe osakkeiden haussa:', error)
      }
    }

    fetchStocks()
  }, [])

  useEffect(() => {
    const fetchIndices = async () => {
      try {
        const response = await fetch('/api/indices')
        const data = await response.json()
        setMarketData(data)
      } catch (error) {
        console.error('Virhe indeksien haussa:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchIndices()
    const interval = setInterval(fetchIndices, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const filteredStocks = stocks.filter(stock => 
    stock.name.toLowerCase().startsWith(searchTerm.toLowerCase()) ||
    stock.id.toLowerCase().startsWith(searchTerm.toLowerCase())
  )

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {isAdmin && (
        <div className="text-right p-4">
          <Link 
            href="/admin" 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Hallintapaneeli
          </Link>
        </div>
      )}

      <div className="text-center flex justify-center gap-8">
        {loading ? (
          <div>Ladataan indeksejä...</div>
        ) : marketData ? (
          <>
            <div>
              <span className="text-gray-600">OMXH: </span>
              <span className={marketData.omxh.change >= 0 ? "text-green-500" : "text-red-500"}>
                {marketData.omxh.change >= 0 ? "+" : ""}
                {marketData.omxh.change.toFixed(2)}%
              </span>
            </div>
            <div>
              <span className="text-gray-600">S&P 500: </span>
              <span className={marketData.sp500.change >= 0 ? "text-green-500" : "text-red-500"}>
                {marketData.sp500.change >= 0 ? "+" : ""}
                {marketData.sp500.change.toFixed(2)}%
              </span>
            </div>
          </>
        ) : (
          <div>Virhe indeksien haussa</div>
        )}
      </div>

      <div className="text-center mb-8">
        <h1 className="text-4xl mb-6">HAE OSAKETTA</h1>
        <div className="max-w-2xl mx-auto relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Hae osakkeen nimellä tai tunnuksella"
            className="w-full p-4 pr-12 rounded-xl border border-gray-200 shadow-lg text-lg"
          />
          <button className="absolute right-4 top-1/2 -translate-y-1/2">
            🔍
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg max-w-2xl mx-auto">
        {filteredStocks.map(stock => (
          <Link 
            key={stock.id} 
            href={`/osake/${stock.id}`}
            className="flex items-center justify-between p-4 hover:bg-gray-100 border-b last:border-b-0"
          >
            <div>
              <div className="font-medium">{stock.id.toUpperCase()}</div>
              <div className="text-sm text-gray-600">{stock.name}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}