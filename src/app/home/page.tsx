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

interface StockMover {
  symbol: string
  shortName: string
  regularMarketChangePercent: number
  regularMarketPrice: number
  regularMarketVolume: number
}

interface MoversData {
  gainers: StockMover[]
  losers: StockMover[]
  mostActive: StockMover[]
}

export default function Home() {
  const [marketData, setMarketData] = useState<MarketData | null>(null)
  const [moversData, setMoversData] = useState<MoversData | null>(null)
  const [loading, setLoading] = useState(true)
  const [moversLoading, setMoversLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  
  // Admin tarkistus
  useEffect(() => {
    const checkAdmin = async () => {
      const user = await getCurrentUser()
      setIsAdmin(user?.admin || false)
    }
    checkAdmin()
  }, [])

  // Indeksien haku
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
    const interval = setInterval(fetchIndices, 5 * 60 * 1000) // 5min välein
    return () => clearInterval(interval)
  }, [])
  
  // Nousijat, laskijat ja vaihdetuimmat
  useEffect(() => {
    const fetchMovers = async () => {
      try {
        const response = await fetch('/api/movers');
        const data = await response.json();
        
        // Tarkistetaan datan rakenne debug-tulostuksella
        console.log('API response:', data);
        
        // Varmistetaan, että data sisältää gainers, losers ja mostActive -kentät
        if (data.gainers && data.losers && data.mostActive) {
          setMoversData(data);
        } else {
          console.error('API-vastaus ei sisällä odotettuja kenttiä:', data);
        }
      } catch (error) {
        console.error('Virhe movers-tietojen haussa:', error);
      } finally {
        setMoversLoading(false);
      }
    };
    
    fetchMovers();
    // Päivitys 15min välein
    const interval = setInterval(fetchMovers, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Muotoile luku näytettävään muotoon (1000 -> 1,000)
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fi-FI').format(num)
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Admin-paneeli */}
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

      {/* Indeksit */}
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

      {/* Taulukot otsikko */}
      <h1 className="text-center text-2xl font-bold mb-4">Markkinakatsaus</h1>

      {/* Nousijat, laskijat ja vaihdetuimmat */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Nousijat */}
        <div className="bg-white rounded-xl shadow-lg p-4">
          <h2 className="text-xl font-bold mb-4 text-center text-green-600">Nousijat</h2>
          {moversLoading ? (
            <div className="text-center py-4">Ladataan tietoja...</div>
          ) : !moversData ? (
            <div className="text-center py-4">Virhe tietojen haussa</div>
          ) : (
            <div className="space-y-2">
              {moversData.gainers.map((stock) => (
                <div key={stock.symbol} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                  <div>
                    <div className="font-medium">{stock.symbol}</div>
                    <div className="text-xs text-gray-600 truncate max-w-[150px]">{stock.shortName}</div>
                  </div>
                  <div className="text-green-500 font-medium">
                    +{stock.regularMarketChangePercent.toFixed(2)}%
                  </div>
                </div>
              ))}
              <div className="text-xs text-gray-500 text-right mt-3 pt-1 border-t">
                Viive: 15-20 min
              </div>
            </div>
          )}
        </div>

        {/* Laskijat */}
        <div className="bg-white rounded-xl shadow-lg p-4">
          <h2 className="text-xl font-bold mb-4 text-center text-red-600">Laskijat</h2>
          {moversLoading ? (
            <div className="text-center py-4">Ladataan tietoja...</div>
          ) : !moversData ? (
            <div className="text-center py-4">Virhe tietojen haussa</div>
          ) : (
            <div className="space-y-2">
              {moversData.losers.map((stock) => (
                <div key={stock.symbol} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                  <div>
                    <div className="font-medium">{stock.symbol}</div>
                    <div className="text-xs text-gray-600 truncate max-w-[150px]">{stock.shortName}</div>
                  </div>
                  <div className="text-red-500 font-medium">
                    {stock.regularMarketChangePercent.toFixed(2)}%
                  </div>
                </div>
              ))}
              <div className="text-xs text-gray-500 text-right mt-3 pt-1 border-t">
                Viive: 15-20 min
              </div>
            </div>
          )}
        </div>

        {/* Vaihdetuimmat */}
        <div className="bg-white rounded-xl shadow-lg p-4">
          <h2 className="text-xl font-bold mb-4 text-center text-blue-600">Vaihdetuimmat</h2>
          {moversLoading ? (
            <div className="text-center py-4">Ladataan tietoja...</div>
          ) : !moversData ? (
            <div className="text-center py-4">Virhe tietojen haussa</div>
          ) : (
            <div className="space-y-2">
              {moversData.mostActive.map((stock) => (
                <div key={stock.symbol} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                  <div className="flex-1">
                    <div className="font-medium">{stock.symbol}</div>
                    <div className="text-xs text-gray-600 truncate max-w-[150px]">{stock.shortName}</div>
                  </div>
                  <div className="text-gray-700 text-sm mr-4">
                    {formatNumber(stock.regularMarketVolume)}
                  </div>
                  <div className={stock.regularMarketChangePercent >= 0 ? "text-green-500" : "text-red-500"}>
                    {stock.regularMarketChangePercent >= 0 ? "+" : ""}
                    {stock.regularMarketChangePercent.toFixed(2)}%
                  </div>
                </div>
              ))}
              <div className="text-xs text-gray-500 text-right mt-3 pt-1 border-t">
                Viive: 15-20 min
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}