require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const INPUT_CSV = 'keywords.csv';
const OUTPUT_CSV = 'results.csv';

const keywords = [];

// Load keywords from CSV
function loadKeywords() {
  return new Promise((resolve, reject) => {
    fs.createReadStream(INPUT_CSV)
      .pipe(csv({ headers: false }))
      .on('data', (row) => {
        const keyword = row[0] || Object.values(row)[0];
        if (keyword) keywords.push(keyword.trim());
      })
      .on('end', () => {
        resolve();
      })
      .on('error', reject);
  });
}

// Check keyword using Serper.dev
async function checkKeyword(keyword) {
  try {
    const response = await axios.post(
      'https://google.serper.dev/search',
      { q: keyword },
      {
        headers: {
          'X-API-KEY': process.env.SERPER_API_KEY,
          'Content-Type': 'application/json',
        }
      }
    );

    const hasLocalPack = Array.isArray(response.data.places) && response.data.places.length > 0;
    return hasLocalPack;
  } catch (error) {
    console.error(`❌ Error checking "${keyword}": ${error.message}`);
    return false;
  }
}

(async () => {
  await loadKeywords();

  const results = [];

  for (const keyword of keywords) {
    console.log(`🔍 Checking: "${keyword}"...`);
    const hasLocal = await checkKeyword(keyword);
    const status = hasLocal ? 'Yes' : 'No';
    results.push({ keyword, hasLocalPack: status });
    console.log(`→ ${status === 'Yes' ? '✅' : '❌'} ${status === 'Yes' ? 'Has' : 'No'} local pack`);
  }

  // Write results to CSV
  const csvWriter = createCsvWriter({
    path: OUTPUT_CSV,
    header: [
      { id: 'keyword', title: 'Keyword' },
      { id: 'hasLocalPack', title: 'Has Local Pack' }
    ]
  });

  await csvWriter.writeRecords(results);
  console.log(`\n✅ Results saved to ${OUTPUT_CSV}`);
})();