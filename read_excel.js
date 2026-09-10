const XLSX = require('xlsx');
const fs = require('fs');

const filePath = 'c:\\Users\\saura\\Desktop\\VOD Content_OTT.xlsx';

try {
  const workbook = XLSX.readFile(filePath);
  const sheetName = 'SERIES';
  console.log("Reading sheet:", sheetName);
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert to JSON
  const data = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
  
  // Print the first 5 rows to understand the structure
  console.log(JSON.stringify(data.slice(0, 5), null, 2));
  
  // Also print all column names
  if (data.length > 0) {
      console.log("Columns:", Object.keys(data[0]));
  }

} catch (error) {
  console.error("Error reading file:", error);
}
