"use client"

import { useState } from 'react'

export default function KorkoaKorolle() {
  const [formData, setFormData] = useState({
    alkusijoitus: "1000",
    kuukausisijoitus: "100",
    tuottoOdotus: "7",
    sijoitusaika: 10
  })

  const [result, setResult] = useState<number | null>(null)

  const calculateCompoundInterest = () => {
    // Muunnetaan string-arvot numeroiksi laskentaa varten
    const alkusijoitus = Number(formData.alkusijoitus) || 0
    const kuukausisijoitus = Number(formData.kuukausisijoitus) || 0
    const tuottoOdotus = Number(formData.tuottoOdotus) || 0
    const sijoitusaika = formData.sijoitusaika

    const r = tuottoOdotus / 100 / 12
    const n = sijoitusaika * 12

    const futureValueInitial = alkusijoitus * Math.pow(1 + r, n)
    const futureValueMonthly = kuukausisijoitus * ((Math.pow(1 + r, n) - 1) / r)

    setResult(Math.round(futureValueInitial + futureValueMonthly))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    calculateCompoundInterest()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    // Slider käsitellään erikseen koska se on aina numero
    if (name === 'sijoitusaika') {
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
      <h1 className="text-3xl mb-8 text-center">Korkoa korolle -laskuri</h1>

      <form onSubmit={handleSubmit} className="bg-card-gray p-6 rounded-custom shadow-custom">
        <div className="space-y-4">
          {/* Alkusijoitus */}
          <div>
            <label className="block mb-2">
              Alkusijoitus (€)
            </label>
            <input
              type="number"
              name="alkusijoitus"
              value={formData.alkusijoitus}
              onChange={handleInputChange}
              className="w-full p-3 rounded-custom border border-gray-300 focus:outline-none focus:border-nav-blue"
            />
          </div>

          {/* Kuukausisijoitus */}
          <div>
            <label className="block mb-2">
              Kuukausisijoitus (€)
            </label>
            <input
              type="number"
              name="kuukausisijoitus"
              value={formData.kuukausisijoitus}
              onChange={handleInputChange}
              className="w-full p-3 rounded-custom border border-gray-300 focus:outline-none focus:border-nav-blue"
            />
          </div>

          {/* Tuotto-odotus */}
          <div>
            <label className="block mb-2">
              Vuosituotto-odotus (%)
            </label>
            <input
              type="number"
              name="tuottoOdotus"
              value={formData.tuottoOdotus}
              onChange={handleInputChange}
              className="w-full p-3 rounded-custom border border-gray-300 focus:outline-none focus:border-nav-blue"
            />
          </div>

          {/* Sijoitusaika slider */}
          <div>
            <label className="block mb-2">
              Sijoitusaika: {formData.sijoitusaika} vuotta
            </label>
            <input
              type="range"
              name="sijoitusaika"
              min="1"
              max="50"
              value={formData.sijoitusaika}
              onChange={handleInputChange}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-nav-blue"
            />
            <div className="flex justify-between text-sm text-gray-600 mt-1">
              <span>1v</span>
              <span>25v</span>
              <span>50v</span>
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
          <h2 className="text-xl mb-2">Sijoituksen arvo:</h2>
          <p className="text-2xl text-nav-blue">
            {result.toLocaleString()} €
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Sijoitettu yhteensä: {(
              Number(formData.alkusijoitus) + 
              (Number(formData.kuukausisijoitus) * formData.sijoitusaika * 12)
            ).toLocaleString()} €
          </p>
        </div>
      )}
    </div>
  )
}