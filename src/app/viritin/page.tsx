'use client'

import dynamic from 'next/dynamic'

// Ladataan viritin-komponentti dynaamisesti client-puolella
const UkuleleTuner = dynamic(
  () => import('@/app/components/UkuleleTuner'),
  { ssr: false }
)

export default function ViritinPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Ukulele Viritin</h1>
      <div className="bg-white rounded-lg shadow-lg p-6">
        <UkuleleTuner />
      </div>
    </div>
  )
}