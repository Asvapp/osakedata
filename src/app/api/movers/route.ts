// src/app/api/movers/route.ts
import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';
import admin from 'firebase-admin';
import { Firestore } from 'firebase-admin/firestore';
import path from 'path';
import fs from 'fs';

// Admin SDK alustus
// Huom: alustetaan vain kerran
let adminDb: Firestore;
if (!admin.apps.length) {
  try {
    // Haetaan tiedosto projektin juuresta
    const serviceAccountPath = path.join(process.cwd(), 'serviceKey.json');
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    
    adminDb = admin.firestore();
  } catch (error) {
    console.error('Firebase Admin init error:', error);
    throw new Error('Firebase Admin alustus epäonnistui');
  }
} else {
  adminDb = admin.firestore();
}

interface StockData {
  symbol: string;
  shortName: string;
  regularMarketChangePercent: number;
  regularMarketPrice: number;
  regularMarketVolume: number;
}

interface SymbolDoc {
  symbol: string;
  name?: string;
  sector?: string;
  industry?: string;
  headquarters?: string;
  founded?: string;
  dateAdded?: string;
  createdAt?: Date;
  // Lisää muita kenttiä tarpeen mukaan
}

export async function GET() {
  try {
    // Hae symbolit Firebasesta admin SDK:n avulla
    const symbolsRef = adminDb.collection('symbols');
    const symbolsSnapshot = await symbolsRef.get();
    
    if (symbolsSnapshot.empty) {
      console.log('Symboleja ei löytynyt tietokannasta');
      return NextResponse.json({ error: 'Symboleja ei löytynyt tietokannasta' }, { status: 404 });
    }
    
    // Kerää symbolit
    const symbols = symbolsSnapshot.docs.map(doc => {
      const data = doc.data() as SymbolDoc;
      return data.symbol;
    }).slice(0, 100);
    
    console.log('Haetut symbolit:', symbols.length);
    
    // Hae osakkeiden tiedot Yahoo Financesta
    const quotes = await yahooFinance.quote(symbols);
    
    // Varmista, että quotes on array
    const stocksData = Array.isArray(quotes) ? quotes : [quotes];
    
    // Suodata nullit ja määrittele perustiedot
    const validData = stocksData.filter(stock => 
      stock && stock.regularMarketChangePercent !== undefined
    );
    
    // Muotoile data
    const formattedData: StockData[] = validData.map(stock => ({
      symbol: stock.symbol,
      shortName: stock.shortName || stock.longName || stock.symbol,
      regularMarketChangePercent: stock.regularMarketChangePercent || 0,
      regularMarketPrice: stock.regularMarketPrice || 0,
      regularMarketVolume: stock.regularMarketVolume || 0
    }));

    // Järjestä kategorioihin
    const gainers: StockData[] = [...formattedData]
      .filter(stock => stock.regularMarketChangePercent > 0)
      .sort((a, b) => b.regularMarketChangePercent - a.regularMarketChangePercent)
      .slice(0, 10);

    const losers: StockData[] = [...formattedData]
      .filter(stock => stock.regularMarketChangePercent < 0)
      .sort((a, b) => a.regularMarketChangePercent - b.regularMarketChangePercent)
      .slice(0, 10);

    const mostActive: StockData[] = [...formattedData]
      .sort((a, b) => (b.regularMarketVolume || 0) - (a.regularMarketVolume || 0))
      .slice(0, 10);

    // Palauta tiedot
    return NextResponse.json({
      gainers,
      losers,
      mostActive,
      symbolCount: symbols.length,
      validDataCount: validData.length,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Virhe movers-haussa:', error);
    return NextResponse.json({ 
      error: 'Virhe tietojen haussa', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}