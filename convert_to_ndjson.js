const fs = require('fs');

const data = JSON.parse(fs.readFileSync('sanity-seed-data.json', 'utf8'));
const ndjson = data.map(doc => JSON.stringify(doc)).join('\n');

fs.writeFileSync('sanity-seed-data.ndjson', ndjson);
console.log('Converted to NDJSON');
