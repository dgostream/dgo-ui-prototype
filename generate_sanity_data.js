const XLSX = require('xlsx');
const fs = require('fs');

const filePath = 'c:\\Users\\saura\\Desktop\\VOD Content_OTT.xlsx';
const outputPath = 'sanity-seed-data.ndjson';

function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateDummyMovie(title, rowName, targetTab, isJunior = false) {
  return {
    _type: 'movie',
    title: title,
    slug: { _type: 'slug', current: slugify(title) },
    subtitle: `A great ${rowName} movie`,
    desc: `This is a placeholder description for the movie "${title}". It belongs to the ${rowName} category.`,
    tag: rowName,
    year: getRandomInt(2015, 2024).toString(),
    rating: (getRandomInt(50, 95) / 10).toString(),
    duration: `${getRandomInt(80, 150)} min`,
    targetTab: targetTab,
    rowName: rowName,
    monetization: 'package',
    isJunior: isJunior,
    isHero: Math.random() < 0.1 // 10% chance to be hero
  };
}

function generateDummySeries(title, rowName, targetTab, isJunior = false) {
  return {
    _type: 'series',
    title: title,
    slug: { _type: 'slug', current: slugify(title) },
    subtitle: `A great ${rowName} series`,
    desc: `This is a placeholder description for the series "${title}". It belongs to the ${rowName} category.`,
    tag: rowName,
    year: getRandomInt(2015, 2024).toString(),
    rating: (getRandomInt(50, 95) / 10).toString(),
    targetTab: targetTab,
    rowName: rowName,
    monetization: 'package',
    isJunior: isJunior,
    isHero: Math.random() < 0.1, // 10% chance to be hero
    episodes: [
      {
        _key: `ep1-${slugify(title)}`,
        id: 1,
        title: 'Pilot',
        duration: '45 min',
        desc: 'The beginning of the story.'
      },
      {
        _key: `ep2-${slugify(title)}`,
        id: 2,
        title: 'The Conflict',
        duration: '42 min',
        desc: 'Things get complicated.'
      }
    ]
  };
}

try {
  const workbook = XLSX.readFile(filePath);
  const documents = [];
  const limit = 8; // Number of items per category

  // Process MOVIES sheet
  const movieSheet = workbook.Sheets['MOVIES'];
  if (movieSheet) {
    const moviesData = XLSX.utils.sheet_to_json(movieSheet, { defval: "" });
    const movieColumns = Object.keys(moviesData[0]).filter(k => k !== 'S/N' && k !== '__EMPTY');

    movieColumns.forEach(col => {
      let targetTab = 'entertainment';
      let isJunior = false;

      if (col === 'Kids') {
        targetTab = 'junior';
        isJunior = true;
      } else if (col === 'NPL Library') {
        return;
      }

      let count = 0;
      for (const row of moviesData) {
        if (row[col] && count < limit) {
          documents.push(generateDummyMovie(row[col], col, targetTab, isJunior));
          count++;
        }
      }
    });
  }

  // Process SERIES sheet
  const seriesSheet = workbook.Sheets['SERIES'];
  if (seriesSheet) {
    const seriesData = XLSX.utils.sheet_to_json(seriesSheet, { defval: "" });
    const seriesColumns = Object.keys(seriesData[0]).filter(k => k !== 'S/N' && k !== '__EMPTY');

    seriesColumns.forEach(col => {
      let targetTab = 'entertainment';
      let isJunior = false;

      if (col === 'KIDS Choice') {
        targetTab = 'junior';
        isJunior = true;
      }

      let count = 0;
      for (const row of seriesData) {
        if (row[col] && count < limit) {
          documents.push(generateDummySeries(row[col], col, targetTab, isJunior));
          count++;
        }
      }
    });
  }

  const ndjson = documents.map(doc => JSON.stringify(doc)).join('\n');
  fs.writeFileSync(outputPath, ndjson);
  console.log(`Successfully generated ${documents.length} documents in ${outputPath}`);

} catch (error) {
  console.error("Error generating data:", error);
}
