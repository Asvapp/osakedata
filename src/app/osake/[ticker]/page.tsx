'use client'

import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { auth, db } from '@/lib/firebase'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { useRouter } from 'next/navigation'

interface ChartData {
  year: string;
  value: number;
}

interface MockData {
  liikevaihto: ChartData[];
  eps: ChartData[];
  liikevoitto: ChartData[];
  nettotulos: ChartData[];
  henkilosto: ChartData[];
  roe: ChartData[];
  osinko: ChartData[];
  paaoma: ChartData[];
  [key: string]: ChartData[];
}

interface ChartTitle {
  title: string;
  unit: string;
}

interface ChartTitles {
  liikevaihto: ChartTitle;
  liikevoitto: ChartTitle;
  nettotulos: ChartTitle;
  eps: ChartTitle;
  henkilosto: ChartTitle;
  roe: ChartTitle;
  osinko: ChartTitle;
  paaoma: ChartTitle;
  [key: string]: ChartTitle;
}

const mockData: MockData = {
  liikevaihto: [
    { year: '2017', value: 2331.1 },
    { year: '2018', value: 2515.7 },
    { year: '2019', value: 2736.8 },
    { year: '2020', value: 2865.5 },
    { year: '2021', value: 3002.4 },
    { year: '2022', value: 3279.8 }
  ],
  liikevoitto: [
    { year: '2017', value: 133.9 },
    { year: '2018', value: 174.1 },
    { year: '2019', value: 214.9 },
    { year: '2020', value: 225.5 },
    { year: '2021', value: 236.2 },
    { year: '2022', value: 285.3 }
  ],
  nettotulos: [
    { year: '2017', value: 95.2 },
    { year: '2018', value: 111.5 },
    { year: '2019', value: 151.4 },
    { year: '2020', value: 165.8 },
    { year: '2021', value: 178.2 },
    { year: '2022', value: 215.4 }
  ],
  eps: [
    { year: '2017', value: 0.91 },
    { year: '2018', value: 1.43 },
    { year: '2019', value: 1.81 },
    { year: '2020', value: 1.95 },
    { year: '2021', value: 2.15 },
    { year: '2022', value: 2.45 }
  ],
  henkilosto: [
    { year: '2017', value: 14362 },
    { year: '2018', value: 14818 },
    { year: '2019', value: 15844 },
    { year: '2020', value: 16227 },
    { year: '2021', value: 16583 },
    { year: '2022', value: 17872 }
  ],
  roe: [
    { year: '2017', value: 12.0 },
    { year: '2018', value: 15.6 },
    { year: '2019', value: 17.5 },
    { year: '2020', value: 18.2 },
    { year: '2021', value: 19.5 },
    { year: '2022', value: 21.3 }
  ],
  osinko: [
    { year: '2017', value: 0.57 },
    { year: '2018', value: 0.60 },
    { year: '2019', value: 0.66 },
    { year: '2020', value: 0.70 },
    { year: '2021', value: 0.75 },
    { year: '2022', value: 0.82 }
  ],
  paaoma: [
    { year: '2017', value: 7.54 },
    { year: '2018', value: 8.34 },
    { year: '2019', value: 9.65 },
    { year: '2020', value: 10.45 },
    { year: '2021', value: 11.82 },
    { year: '2022', value: 13.25 }
  ]
}

const chartTitles: ChartTitles = {
  liikevaihto: { title: 'Liikevaihto', unit: 'M€' },
  liikevoitto: { title: 'Liikevoitto', unit: 'M€' },
  nettotulos: { title: 'Nettotulos', unit: 'M€' },
  eps: { title: 'EPS', unit: '€' },
  henkilosto: { title: 'Henkilöstön määrä', unit: '' },
  roe: { title: 'ROE', unit: '%' },
  osinko: { title: 'Osinko/osake', unit: '€' },
  paaoma: { title: 'Pääoma/osake', unit: '€' }
}

export default function OsakeSivu() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'vuosi' | 'neljännes'>('vuosi')
  const [expandedChart, setExpandedChart] = useState<string | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Tässä vaiheessa kovakoodattu ticker, myöhemmin tulee API:sta
  const currentStock = 'HUKI'

  // Tarkista onko osake suosikeissa kun sivu ladataan
  useEffect(() => {
    const checkIfFavorite = async () => {
      const user = auth.currentUser
      if (!user) {
        router.push('/login')
        return
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          setIsFavorite(userData.favorites?.includes(currentStock) || false)
        }
      } catch (error) {
        console.error('Virhe suosikkien tarkistuksessa:', error)
        setError('Suosikkien tarkistuksessa tapahtui virhe')
      } finally {
        setLoading(false)
      }
    }

    checkIfFavorite()
  }, [currentStock, router])

  const handleFavoriteClick = async () => {
    const user = auth.currentUser
    if (!user) {
      router.push('/login')
      return
    }

    setLoading(true)
    setError('')

    try {
      const userRef = doc(db, 'users', user.uid)
      const userDoc = await getDoc(userRef)
      
      if (userDoc.exists()) {
        const userData = userDoc.data()
        let newFavorites = [...(userData.favorites || [])]

        if (isFavorite) {
          // Poista suosikeista
          newFavorites = newFavorites.filter(ticker => ticker !== currentStock)
        } else {
          // Lisää suosikkeihin jos ei jo ole
          if (!newFavorites.includes(currentStock)) {
            newFavorites.push(currentStock)
          }
        }

        // Päivitä Firestore
        await updateDoc(userRef, {
          favorites: newFavorites
        })

        // Päivitä paikallinen tila
        setIsFavorite(!isFavorite)
      }
    } catch (error) {
      console.error('Virhe suosikkien päivityksessä:', error)
      setError('Suosikkien päivitys epäonnistui')
    } finally {
      setLoading(false)
    }
  }

  const ChartComponent = ({ dataKey }: { dataKey: string }) => (
    <div className="bg-white p-4 rounded-custom shadow-sm">
      <div className="flex justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-600">{chartTitles[dataKey].title}</h3>
        <button onClick={() => setExpandedChart(dataKey)} className="text-gray-400 hover:text-gray-600">
          <span className="text-sm">🔍</span>
        </button>
      </div>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={mockData[dataKey]}
            margin={{ top: 5, right: 5, left: 5, bottom: 20 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false}
              stroke="#f0f0f0"
            />
            <XAxis 
              dataKey="year" 
              angle={0}
              interval={0}
              tick={{ fontSize: 11, fill: '#666' }}
              tickLine={false}
            />
            <YAxis 
              tick={{ fontSize: 11, fill: '#666' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip 
              formatter={(value) => `${value}${chartTitles[dataKey].unit}`}
              contentStyle={{ fontSize: '12px' }}
            />
            <Bar 
              dataKey="value" 
              fill="#1a4b8c"
              barSize={15}
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Yläosa: Haku ja Suosikit */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex-1 max-w-2xl">
          <input
            type="text"
            placeholder="Hae osaketta..."
            className="w-full p-4 rounded-xl border border-gray-200 shadow-lg"
          />
        </div>

        {error && (
          <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <button
          onClick={handleFavoriteClick}
          disabled={loading}
          className={`ml-4 px-4 py-2 rounded-lg flex items-center gap-2 ${
            isFavorite 
              ? 'bg-btn-blue text-white' 
              : 'border-2 border-btn-blue text-btn-blue'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? 'Ladataan...' : isFavorite ? '★ Suosikeissa' : '☆ Lisää suosikkeihin'}
        </button>
      </div>

      {/* Osakkeen perustiedot */}
      <div className="bg-card-gray p-6 rounded-custom shadow-custom mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">Huhtamäki Oyj</h1>
            <p className="text-gray-600">HUKI.HE</p>
          </div>
          <div className="text-right">
            <div className="text-2xl">34.40 €</div>
            <div className="text-red-500">-0.64%</div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div>
            <span className="text-gray-600">P/E</span>
            <div>14.62</div>
          </div>
          <div>
            <span className="text-gray-600">Markkina-arvo</span>
            <div>3 580M €</div>
          </div>
          <div>
            <span className="text-gray-600">Osinkotuotto</span>
            <div>3.5%</div>
          </div>
        </div>
      </div>

      {/* Vuosi/Neljännes valitsin */}
      <div className="flex gap-2 mb-6">
        <button
          className={`px-4 py-2 rounded-lg ${
            activeTab === 'vuosi' ? 'bg-btn-blue text-white' : 'bg-gray-100'
          }`}
          onClick={() => setActiveTab('vuosi')}
        >
          Vuosi
        </button>
        <button
          className={`px-4 py-2 rounded-lg ${
            activeTab === 'neljännes' ? 'bg-btn-blue text-white' : 'bg-gray-100'
          }`}
          onClick={() => setActiveTab('neljännes')}
        >
          Neljännes
        </button>
      </div>

      {/* Graafit 4x2 ruudukossa */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ChartComponent dataKey="liikevaihto" />
        <ChartComponent dataKey="liikevoitto" />
        <ChartComponent dataKey="nettotulos" />
        <ChartComponent dataKey="eps" />
        <ChartComponent dataKey="henkilosto" />
        <ChartComponent dataKey="roe" />
        <ChartComponent dataKey="osinko" />
        <ChartComponent dataKey="paaoma" />
      </div>

      {/* Laajennettu graafi modal */}
      {expandedChart && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-xl p-6 w-full max-w-4xl">
      <div className="flex justify-between mb-4">
        <h3 className="text-xl font-medium">
          {chartTitles[expandedChart].title}
        </h3>
        <button onClick={() => setExpandedChart(null)}>✕</button>
      </div>
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={mockData[expandedChart]}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip formatter={(value) => `${value}${chartTitles[expandedChart].unit}`} />
            <Bar dataKey="value" fill="#1a4b8c" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
)}
    </div>
  )
}