"use client"

import { useState } from 'react'

export default function Lainalaskuri() {
  const [formData, setFormData] = useState({
    lainanMaara: "100000",
    korko: "3",
    lainaAika: 15
  })

  const [result, setResult] = useState<{
    kuukausiera: number;
    kokonaiskorko: number;
    kokonaismaara: number;
  } | null>(null)

  const calculateLoan = () => {
    const lainanMaara = Number(formData.lainanMaara) || 0
    const vuosikorko = Number(formData.korko) || 0
    const lainaAika = formData.lainaAika

    // Kuukausikorko (vuosikorko/12/100)
    const r = vuosikorko / 12 / 100
    // Maksuerien määrä (vuodet * 12)
    const n = lainaAika * 12

    // Kuukausierän laskenta
    const kuukausiera = lainanMaara * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
    
    // Kokonaiskorkokulut
    const kokonaismaara = kuukausiera * n
    const kokonaiskorko = kokonaismaara - lainanMaara

    setResult({
      kuukausiera: Math.round(kuukausiera * 100) / 100,
      kokonaiskorko: Math.round(kokonaiskorko),
      kokonaismaara: Math.round(kokonaismaara)
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    calculateLoan()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    // Slider käsitellään erikseen koska se on aina numero
    if (name === 'lainaAika') {
      setFormData(prev => ({
        ...prev,
        [name]: Number(value)
      }))
    } else {
      // Muut kentät käsitellään stringeinä
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl mb-8 text-center">Lainalaskuri</h1>

      <form onSubmit={handleSubmit} className="bg-card-gray p-6 rounded-custom shadow-custom">
        <div className="space-y-4">
          {/* Lainan määrä */}
          <div>
            <label className="block mb-2">
              Lainan määrä (€)
            </label>
            <input
              type="number"
              name="lainanMaara"
              value={formData.lainanMaara}
              onChange={handleInputChange}
              className="w-full p-3 rounded-custom border border-gray-300 focus:outline-none focus:border-nav-blue"
            />
          </div>

          {/* Korko */}
          <div>
            <label className="block mb-2">
              Korko (%)
            </label>
            <input
              type="number"
              name="korko"
              value={formData.korko}
              onChange={handleInputChange}
              className="w-full p-3 rounded-custom border border-gray-300 focus:outline-none focus:border-nav-blue"
            />
          </div>

          {/* Laina-aika slider */}
          <div>
            <label className="block mb-2">
              Laina-aika: {formData.lainaAika} vuotta
            </label>
            <input
              type="range"
              name="lainaAika"
              min="1"
              max="30"
              value={formData.lainaAika}
              onChange={handleInputChange}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-nav-blue"
            />
            <div className="flex justify-between text-sm text-gray-600 mt-1">
              <span>1v</span>
              <span>15v</span>
              <span>30v</span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-btn-blue text-white py-3 rounded-custom shadow-custom hover:opacity-90 transition-opacity mt-6"
          >
            Laske
          </button>
        </div>
      </form>

      {result !== null && (
        <div className="mt-8 p-6 bg-white rounded-custom shadow-custom text-center">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h2 className="text-lg font-medium mb-1">Kuukausierä:</h2>
              <p className="text-2xl text-nav-blue">
                {result.kuukausiera.toLocaleString()} €
              </p>
            </div>
            <div>
              <h2 className="text-lg font-medium mb-1">Korkokulut yhteensä:</h2>
              <p className="text-2xl text-nav-blue">
                {result.kokonaiskorko.toLocaleString()} €
              </p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <h2 className="text-lg font-medium mb-1">Maksettavaa yhteensä:</h2>
            <p className="text-2xl text-nav-blue">
              {result.kokonaismaara.toLocaleString()} €
            </p>
          </div>
        </div>
      )}
    </div>
  )
}