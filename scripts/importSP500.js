const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Lue service account file
const serviceAccount = require('../serviceKey.json');

// Alusta Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function importSP500Stocks() {
  try {
    // Lue JSON data
    const stocksData = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'data/s&p500stocks.json'), 'utf-8')
    );

    let batch = db.batch();
    let count = 0;
    const batchSize = 450; // Firestore tukee max 500 operaatiota per erä, käytetään 450 varmuuden vuoksi
    
    // Luodaan symbolit-kokoelma, johon tallennetaan kaikki S&P 500 -osakkeiden symbolit
    for (let i = 0; i < stocksData.length; i++) {
      const stock = stocksData[i];
      
      // Tarkistetaan kaikki kentät
      // Symbolissa voi olla pistettä, korvataan se viivalla
      const symbol = stock.Symbol ? stock.Symbol.replace('.', '-').replace('/', '-') : `unknown-${i}`;
      
      // Varmistetaan, että kaikki kentät ovat olemassa ennen tallennusta
      const docData = {
        symbol: stock.Symbol || '',
        name: stock.Security || '',
        sector: stock["GICS Sector"] || stock["GICS\u00A0Sector"] || stock["GICS\u0082Sector"] || '',
        industry: stock["GICS Sub-Industry"] || '',
        headquarters: stock["Headquarters Location"] || '',
        founded: stock.Founded || '',
        dateAdded: stock["Date added"] || '',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      // Tulostetaan ensimmäinen data-objekti tarkastusta varten
      if (i === 0) {
        console.log("Ensimmäinen osake:", JSON.stringify(docData));
        console.log("JSON kenttien nimet:", Object.keys(stock));
      }
      
      const docRef = db.collection('symbols').doc(symbol);
      batch.set(docRef, docData);
      
      count++;
      
      // Jos eräkoko täyttyy, sitoudutaan ja aloitetaan uusi erä
      if (count % batchSize === 0) {
        await batch.commit();
        console.log(`Viety ${count} osaketta Firestoreen`);
        batch = db.batch(); // Uusi erä
      }
    }
    
    // Sitoudutaan loput, jos on jäljellä
    if (count % batchSize !== 0) {
      await batch.commit();
    }
    
    console.log(`Yhteensä ${count} S&P 500 -osaketta viety Firestoreen`);
    
  } catch (error) {
    console.error('Virhe:', error);
  }
}

importSP500Stocks();