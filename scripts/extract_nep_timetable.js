import * as XLSX from 'xlsx';
import * as fs from 'fs';

const FILE_PATH = 'TimeTable (1) (2).xlsx'; // Update this to your file path

try {
  const fileBuffer = fs.readFileSync(FILE_PATH);
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheetName = "Time Table"; 
  const sheet = workbook.Sheets[sheetName] || workbook.Sheets[workbook.SheetNames[0]];
  
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

  const coursesMap = new Map(); // Use Map to track unique courses by code
  let currentCourse = null;

  for (let i = 5; i < data.length; i++) {
    const row = data[i];
    if (!row) continue;

    const slNo = row[1];
    const courseCell = row[2];
    const ltp = row[7];
    
    if (slNo && courseCell && typeof slNo === 'number') {
      // Save previous course if not already in map
      if (currentCourse && !coursesMap.has(currentCourse.courseCode)) {
        coursesMap.set(currentCourse.courseCode, currentCourse);
      }

      let code = '';
      let name = '';
      const cleanCell = courseCell.toString().trim();
      
      if (cleanCell.includes('\n')) {
        const parts = cleanCell.split('\n');
        code = parts[0].trim();
        name = parts.slice(1).join(' ').replace(/[()]/g, '').trim();
      } else {
        const match = cleanCell.match(/^([A-Z0-9]+)\s*[\n\(]?(.*?)[\)]?$/i);
        if (match) {
          code = match[1].trim();
          name = match[2].replace(/[()]/g, '').trim();
        } else {
          const parts = cleanCell.split(' ');
          code = parts[0];
          name = parts.slice(1).join(' ').replace(/[()]/g, '').trim();
        }
      }

      currentCourse = {
        courseCode: code,
        courseName: name,
        ltp: ltp ? ltp.toString().trim() : "0-0-0",
        slots: []
      };
    }

    if (currentCourse) {
       const day = row[8];
       const timeStr = row[9];
       const venue = row[10];

       if (day && day !== 'Day' && timeStr) {
           currentCourse.slots.push({
               day: day.toString().trim(),
               timeStr: timeStr.toString().trim(),
               venue: venue ? venue.toString().trim() : ""
           });
       }
    }
  }

  // Push last course if unique
  if (currentCourse && !coursesMap.has(currentCourse.courseCode)) {
    coursesMap.set(currentCourse.courseCode, currentCourse);
  }

  // Convert map to array
  const courses = Array.from(coursesMap.values());

  // Generate TSX Content
  let tsxContent = `import { TimeTableCourse } from '../types';
import { calculateCreditsFromLTP } from '../utils/creditCalculator';

const courseOption = 'NEP';

function time(timeStr: string) {
    const [start, end] = timeStr.split('-');
    if (!start || !end) {
        return { startTime: '00:00', endTime: '00:00' };
    }
    const parse = (t: string) => {
        const parts = t.trim().split(' ');
        const timePart = parts[0];
        const period = parts[1];
        if (!timePart || !period) {
             return '00:00';
        }
        const [hStr, mStr] = timePart.split(':');
        let h = Number(hStr);
        let m = Number(mStr);
        if (!Number.isFinite(h) || !Number.isFinite(m)) {
            return '00:00';
        }

        if (period.toUpperCase() === 'PM' && h !== 12) {
            h += 12;
        }
        if (period.toUpperCase() === 'AM' && h === 12) {
            h = 0;
        }
        return \`\${String(h).padStart(2, '0')}:\${String(m).padStart(2, '0')}\`;
    }
    return { startTime: parse(start), endTime: parse(end) };
}


export const NEP_TIMETABLE_DATA: TimeTableCourse[] = [
`;

  courses.forEach((course, index) => {
    tsxContent += `    {
        courseCode: "${course.courseCode}",
        courseName: "${course.courseName}",
        ltp: "${course.ltp}",
        credits: calculateCreditsFromLTP("${course.ltp}", courseOption),
        slots: [
`;
    course.slots.forEach((slot, sIndex) => {
        tsxContent += `            { "day": "${slot.day}", ...time("${slot.timeStr}"), "venue": "${slot.venue}" }${sIndex < course.slots.length - 1 ? ',' : ''}
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
