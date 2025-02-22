'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { 
  collection, 
  doc,
  onSnapshot,
  query, 
  where,
  updateDoc,
  Timestamp
} from 'firebase/firestore'

// Rajapinta kaupan tiedoille
interface Trade {
  symbol: string
  entryPrice: number
  exitPrice?: number
  quantity: number
  status: 'open' | 'closed'
  profit?: number
  entryTime: Date
  exitTime?: Date
}

// Firestore dokumentin tyyppi
interface FirestoreTrade {
  symbol: string
  entryPrice: number
  exitPrice?: number
  quantity: number
  status: 'open' | 'closed'
  profit?: number
  entryTime: Timestamp
  exitTime?: Timestamp
}

export default function SijoitusrobottiPage() {
  const [openTrades, setOpenTrades] = useState<Trade[]>([])
  const [tradeHistory, setTradeHistory] = useState<Trade[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Kuunnellaan robotin tilaa
  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, "tradingBot", "settings"),
      (doc) => {
        if (doc.exists()) {
          setIsRunning(doc.data().enabled || false)
        }
      },
      (error) => {
        console.error("Error fetching bot status:", error)
        setError("Robotin tilan hakeminen epäonnistui")
      }
    )

    return () => unsubscribe()
  }, [])

  // Kuunnellaan kauppoja
  // Kuunnellaan kauppoja
useEffect(() => {
  setIsLoading(true)
  setError(null)

  try {
    // Avoimet kaupat - yksinkertaistettu query
    const openTradesQuery = query(
      collection(db, "trades"),
      where("status", "==", "open")
      // Poistetaan orderBy toistaiseksi kunnes indeksi on luotu
    )

    const unsubscribeOpen = onSnapshot(openTradesQuery, (snapshot) => {
      const trades = snapshot.docs.map(doc => {
        const data = doc.data() as FirestoreTrade
        return {
          ...data,
          entryTime: data.entryTime.toDate(),
          exitTime: data.exitTime?.toDate()
        } as Trade
      }).sort((a, b) => b.entryTime.getTime() - a.entryTime.getTime()) // Järjestetään muistissa
      
      setOpenTrades(trades)
      setIsLoading(false)
    })

    // Suljetut kaupat - yksinkertaistettu query
    const closedTradesQuery = query(
      collection(db, "trades"),
      where("status", "==", "closed")
      // Poistetaan orderBy toistaiseksi kunnes indeksi on luotu
    )

    const unsubscribeClosed = onSnapshot(closedTradesQuery, (snapshot) => {
      const trades = snapshot.docs.map(doc => {
        const data = doc.data() as FirestoreTrade
        return {
          ...data,
          entryTime: data.entryTime.toDate(),
          exitTime: data.exitTime?.toDate()
        } as Trade
      }).sort((a, b) => b.entryTime.getTime() - a.entryTime.getTime()) // Järjestetään muistissa
      
      setTradeHistory(trades)
      setIsLoading(false)
    })

    return () => {
      unsubscribeOpen()
      unsubscribeClosed()
    }
  } catch (error) {
    console.error("Error fetching trades:", error)
    setError("Kauppojen hakeminen epäonnistui")
    setIsLoading(false)
  }
}, [])

  // Lasketaan yhteenveto
  const summary = {
    totalTrades: tradeHistory.length,
    winningTrades: tradeHistory.filter(t => t.profit && t.profit > 0).length,
    totalProfit: tradeHistory.reduce((sum, t) => sum + (t.profit || 0), 0),
    avgProfit: tradeHistory.length > 0 
      ? tradeHistory.reduce((sum, t) => sum + (t.profit || 0), 0) / tradeHistory.length 
      : 0
  }

  // Ryhmitellään kaupat kuukausittain
  const monthlyTrades = tradeHistory.reduce((acc, trade) => {
    const month = trade.entryTime.toISOString().slice(0, 7) // YYYY-MM
    if (!acc[month]) acc[month] = []
    acc[month].push(trade)
    return acc
  }, {} as Record<string, Trade[]>)

  // Robotin käynnistys/pysäytys
  const toggleBot = async () => {
    try {
      const settingsRef = doc(db, "tradingBot", "settings")
      await updateDoc(settingsRef, {
        enabled: !isRunning,
        lastUpdated: new Date()
      })
    } catch (error) {
      console.error("Error toggling bot:", error)
      setError("Robotin tilan muuttaminen epäonnistui")
    }
  }
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Yläreunan kontrollit */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Sijoitusrobotti</h1>
          <button
            onClick={toggleBot}
            className={`px-4 py-2 rounded-lg font-medium ${
              isRunning 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {isRunning ? 'Pysäytä robotti' : 'Käynnistä robotti'}
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            Ladataan tietoja...
          </div>
        ) : (
          <>
            {/* Yhteenveto */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm text-gray-500">Kauppoja yhteensä</h3>
                <p className="text-2xl font-bold">{summary.totalTrades}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm text-gray-500">Voitollisia kauppoja</h3>
                <p className="text-2xl font-bold">{summary.winningTrades}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm text-gray-500">Kokonaistuotto</h3>
                <p className={`text-2xl font-bold ${summary.totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {summary.totalProfit.toFixed(2)}%
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm text-gray-500">Keskimääräinen tuotto</h3>
                <p className={`text-2xl font-bold ${summary.avgProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {summary.avgProfit.toFixed(2)}%
                </p>
              </div>
            </div>

            {/* Avoimet positiot */}
            <div className="mb-8">
              <h2 className="font-semibold mb-4">Avoimet positiot</h2>
              {openTrades.length === 0 ? (
                <p className="text-gray-500">Ei avoimia positioita</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left">Symboli</th>
                        <th className="px-4 py-2 text-right">Määrä</th>
                        <th className="px-4 py-2 text-right">Ostohinta</th>
                        <th className="px-4 py-2 text-right">Ostoaika</th>
                      </tr>
                    </thead>
                    <tbody>
                      {openTrades.map((trade, i) => (
                        <tr key={i} className="border-t">
                          <td className="px-4 py-2">{trade.symbol}</td>
                          <td className="px-4 py-2 text-right">{trade.quantity}</td>
                          <td className="px-4 py-2 text-right">${trade.entryPrice.toFixed(2)}</td>
                          <td className="px-4 py-2 text-right">
                            {trade.entryTime.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Kaupankäyntihistoria */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold">Kaupankäyntihistoria</h2>
                <select 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="border rounded p-1"
                >
                  <option value="all">Kaikki</option>
                  {Object.keys(monthlyTrades).sort().reverse().map(month => (
                    <option key={month} value={month}>
                      {new Date(month).toLocaleDateString('fi-FI', { year: 'numeric', month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Symboli</th>
                      <th className="px-4 py-2 text-right">Määrä</th>
                      <th className="px-4 py-2 text-right">Ostohinta</th>
                      <th className="px-4 py-2 text-right">Myyntihinta</th>
                      <th className="px-4 py-2 text-right">Tuotto</th>
                      <th className="px-4 py-2 text-right">Ostoaika</th>
                      <th className="px-4 py-2 text-right">Myyntiaika</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tradeHistory
                      .filter(trade => 
                        selectedMonth === 'all' || 
                        trade.entryTime.toISOString().startsWith(selectedMonth)
                      )
                      .map((trade, i) => (
                        <tr key={i} className="border-t">
                          <td className="px-4 py-2">{trade.symbol}</td>
                          <td className="px-4 py-2 text-right">{trade.quantity}</td>
                          <td className="px-4 py-2 text-right">${trade.entryPrice.toFixed(2)}</td>
                          <td className="px-4 py-2 text-right">${trade.exitPrice?.toFixed(2) || '-'}</td>
                          <td className={`px-4 py-2 text-right ${
                            trade.profit && trade.profit > 0 ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {trade.profit?.toFixed(2)}%
                          </td>
                          <td className="px-4 py-2 text-right">
                            {trade.entryTime.toLocaleString()}
                          </td>
                          <td className="px-4 py-2 text-right">
                            {trade.exitTime?.toLocaleString() || '-'}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}