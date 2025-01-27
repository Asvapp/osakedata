"use client"

export default function Laskurit() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl mb-8 text-center">Laskurit</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Korkoa korolle laskuri */}
        <div className="bg-card-gray p-6 rounded-custom shadow-custom hover:scale-105 transition-transform cursor-pointer">
          <h2 className="text-xl font-quicksand mb-3">Korkoa korolle</h2>
          <p className="text-gray-600 mb-4">
            Laske sijoituksesi tuotto-odotus korkoa korolle -efektin avulla
          </p>
          <button 
            onClick={() => window.location.href = '/laskurit/korkoa-korolle'}
            className="bg-btn-blue text-white px-6 py-2 rounded-custom hover:opacity-90 transition-opacity w-full"
          >
            Siirry laskuriin
          </button>
        </div>

        {/* Lainalaskuri */}
        <div className="bg-card-gray p-6 rounded-custom shadow-custom hover:scale-105 transition-transform cursor-pointer">
          <h2 className="text-xl font-quicksand mb-3">Lainalaskuri</h2>
          <p className="text-gray-600 mb-4">
            Laske lainan kuukausierä ja kokonaiskulut eri koroilla
          </p>
          <button 
            onClick={() => window.location.href = '/laskurit/laina'}
            className="bg-btn-blue text-white px-6 py-2 rounded-custom hover:opacity-90 transition-opacity w-full"
          >
            Siirry laskuriin
          </button>
        </div>
      </div>
    </div>
  )
}