
import * as XLSX from 'xlsx';
import * as fs from 'fs';

const FILE_PATH = 'Winter_2025-2026_Time_Table (3).xls'; // Update this to your file path
const OUTPUT_FILE = 'config/courseData.tsx';

try {
  const fileBuffer = fs.readFileSync(FILE_PATH);
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  // Get all data
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

  const courses = [];
  let currentCourse = null;

  // Start checking from row 5 (index 5), header is at 4
  for (let i = 5; i < data.length; i++) {
    const row = data[i];
    if (!row) continue;

    const slNo = row[1];
    const courseCell = row[2]; // Code + Name
    const ltp = row[7];
    
    // Check if this row starts a new course (has Sl No and Course Info)
    if (slNo && courseCell && typeof slNo === 'number') {
      // Save previous course
      if (currentCourse) {
        courses.push(currentCourse);
      }

      // Parse Course Code and Name
      let code = '';
      let name = '';
      // Sanitize cell content
      const cleanCell = courseCell.toString().trim();
      
      // Try splitting by newline first
      if (cleanCell.includes('\n')) {
        const parts = cleanCell.split('\n');
        code = parts[0].trim();
        name = parts.slice(1).join(' ').replace(/[()]/g, '').trim();
      } else {
        // Fallback or different format
        // Try regex to find Code (e.g. ABC1234)
        const match = cleanCell.match(/^([A-Z0-9]+)\s*(.*)$/);
        if (match) {
          code = match[1].trim();
          name = match[2].replace(/[()]/g, '').trim();
        } else {
          code = "UNKNOWN";
          name = cleanCell;
        }
      }

      currentCourse = {
        courseCode: code,
        courseName: name,
        ltp: ltp ? ltp.toString().trim() : "0-0-0",
        // Credits will be a function call string in final output
        slots: []
      };
      
      // Note: The first row of a course *also* contains headers for slots "Day", "Slot/Time" in cols 8,9,10.
      // We skip looking for slots in this exact row and look in subsequent rows.
      continue;
    }

    // Processing slots for the current course
    if (currentCourse) {
       // Columns: 8=Day, 9=Slot/Time, 10=Venue
       // Check if columns 8 or 9 have data
       const day = row[8];
       const time = row[9];
       const venue = row[10];

       if (day && time && day !== 'Day') { // Ignore header row repetition if any
           // Parse time "11:00-11:50"
           let startTime = "";
           let endTime = "";
           const timeParts = time.toString().split('-');
           if (timeParts.length >= 2) {
               startTime = timeParts[0].trim();
               endTime = timeParts[1].trim();
           } else {
             startTime = time.toString();
           }
           
           // Normalize to 24h format
           const to24h = (t) => {
             const parts = t.split(':');
             let h = parseInt(parts[0], 10);
             const m = parts[1];
             // Heuristic: Labs/Classes are 8 AM to 7 PM.
             // If h < 8 (e.g. 1, 2, 3, 4, 5, 6, 7), assume PM -> add 12.
             // If h == 12, keep as 12.
             if (h < 8) {
               h += 12;
             }
             // Ensure 2 digits
             return `${h.toString().padStart(2, '0')}:${m}`;
           };

           // Apply normalization if valid time string
           if (startTime.includes(':')) startTime = to24h(startTime);
           if (endTime.includes(':')) endTime = to24h(endTime);

           currentCourse.slots.push({
               day: day.toString().trim(),
               startTime,
               endTime,
               venue: venue ? venue.toString().trim() : ""
           });
       }
    }
  }

  // Push last course
  if (currentCourse) {
    courses.push(currentCourse);
  }

  // Generate TSX Content
  let tsxContent = `import {TimeTableCourse} from '../types';
import { calculateCredits } from '../config/credits';


export const TIMETABLE_DATA: TimeTableCourse[] = [
`;

  courses.forEach((course, index) => {
    tsxContent += `    {
        "courseCode": "${course.courseCode}",
        "courseName": "${course.courseName}",
        "ltp": "${course.ltp}",
        "credits": calculateCredits("${course.ltp}"),
        "slots": [
`;
    course.slots.forEach((slot, sIndex) => {
        tsxContent += `            { "day": "${slot.day}", "startTime": "${slot.startTime}", "endTime": "${slot.endTime}", "venue": "${slot.venue}" }${sIndex < course.slots.length - 1 ? ',' : ''}
`;
    });

    tsxContent += `        ]
    }${index < courses.length - 1 ? ',' : ''}
`;
  });

  tsxContent += `];
`;

  console.log(tsxContent);

} catch (error) {
  console.error('Error:', error);
}
