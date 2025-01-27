import yahooFinance from 'yahoo-finance2'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Haetaan molemmat indeksit
    const [omxh, sp500] = await Promise.all([
        yahooFinance.quote('^OMXHPI'),  // Muutettu OMXH25 -> OMXHPI
        yahooFinance.quote('^GSPC')
      ])

    return NextResponse.json({
      omxh: {
        change: omxh.regularMarketChangePercent,
        price: omxh.regularMarketPrice
      },
      sp500: {
        change: sp500.regularMarketChangePercent,
        price: sp500.regularMarketPrice
      }
    })
  } catch (error) {
    console.error('Virhe indeksien haussa:', error)
    return NextResponse.json(
      { error: 'Virhe indeksien haussa' },
      { status: 500 }
    )
  }
}