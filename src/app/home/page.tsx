"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/firebase'

interface IndexData {
  change: number
  price: number
}

interface MarketData {
  omxh: IndexData
  sp500: IndexData
}

interface Stock {
  ticker: string
  name: string
  price: number
  change: number
}

// Mock-data esimerkkinä
const mockStocks: Stock[] = [
  { ticker: 'NOKIA', name: 'Nokia Oyj', price: 3.45, change: 1.2 },
  { ticker: 'SAMPO', name: 'Sampo Oyj', price: 42.85, change: -0.5 },
  { ticker: 'HUKI', name: 'Huhtamäki Oyj', price: 34.40, change: -0.64 },
  { ticker: 'FORTUM', name: 'Fortum Oyj', price: 12.38, change: 0.8 },
  { ticker: 'UPM', name: 'UPM-Kymmene Oyj', price: 28.75, change: -0.2 }
]

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('')
  const [marketData, setMarketData] = useState<MarketData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const checkAdmin = async () => {
      const user = await getCurrentUser()
      setIsAdmin(user?.admin || false)
    }
    checkAdmin()
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
    // Päivitetään indeksit 5 minuutin välein
    const interval = setInterval(fetchIndices, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const filteredStocks = mockStocks.filter(stock => 
    stock.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stock.ticker.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Admin-painike */}
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

      {/* Market Overview */}
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

      {/* Hakuosio */}
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

      {/* Lista osakkeista */}
      <div className="bg-card-gray rounded-xl shadow-lg">
        {filteredStocks.map(stock => (
          <Link 
            key={stock.ticker} 
            href={`/osake/${stock.ticker}`} 
            className="flex items-center justify-between p-4 hover:bg-gray-50 border-b last:border-b-0"
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
        ))}
      </div>
    </div>
  )
}