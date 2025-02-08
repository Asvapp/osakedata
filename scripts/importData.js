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

async function importStocks() {
  try {
    // Lue JSON data
    const stocksData = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'data/stocks.json'), 'utf-8')
    );

    const batch = db.batch();
    
    stocksData.forEach(stock => {
      const docId = stock.osake.toLowerCase()
        .replace(/ä/g, 'a')
        .replace(/ö/g, 'o')
        .replace(/å/g, 'a')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

      const docRef = db.collection('stocks').doc(docId);
      batch.set(docRef, {
        name: stock.osake,
        createdAt: new Date()
      });
    });

    await batch.commit();
    console.log(`${stocksData.length} osaketta viety Firestoreen`);
    
  } catch (error) {
    console.error('Virhe:', error);
  }
}

importStocks();