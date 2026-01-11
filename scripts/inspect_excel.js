
import * as XLSX from 'xlsx';
import * as fs from 'fs';

const FILE_PATH = 'TimeTable (1) (2).xlsx'; // Path to your Excel file

try {
  const fileBuffer = fs.readFileSync(FILE_PATH);
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  // Convert to JSON to see the structure
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 0, defval: null });

  console.log(`Sheet Name: ${sheetName}`);
  console.log('First 20 rows:');
  console.log(JSON.stringify(data.slice(0, 20), null, 2));

} catch (error) {
  console.error('Error reading file:', error);
}
