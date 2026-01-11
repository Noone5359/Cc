/**
 * Extraction Schemas for AI Workflow
 * Pre-defined configurations for extracting different data types
 */

import { ExtractionConfig, ExtractionSchema } from './aiExtractionWorkflow';

// ============================================================================
// Calendar Events
// ============================================================================

export interface CalendarEventData {
  date: string;
  endDate?: string;
  description: string;
  type: 'Start of Semester' | 'Mid-Semester Exams' | 'End-Semester Exams' | 'Holiday' | 'Other';
}

const calendarSchema: ExtractionSchema = {
  name: 'Academic Calendar Events',
  description: 'Events from an academic calendar including holidays, exams, and semester dates',
  fields: [
    { name: 'date', type: 'date', description: 'Start date in YYYY-MM-DD format', required: true },
    {
      name: 'endDate',
      type: 'date',
      description: 'End date in YYYY-MM-DD format (for multi-day events only)',
      required: false,
    },
    {
      name: 'description',
      type: 'string',
      description: 'Event name/title WITHOUT any dates',
      required: true,
    },
    { name: 'type', type: 'string', description: 'Event type classification', required: true },
  ],
  examples: `[
  {"date": "2025-07-01", "endDate": "2025-07-10", "description": "Pre-Registration for Monsoon Semester", "type": "Other"},
  {"date": "2025-07-11", "endDate": "2025-07-15", "description": "Fee Payment for Monsoon Semester", "type": "Other"},
  {"date": "2025-07-16", "endDate": "2025-07-20", "description": "Registration for Monsoon Semester", "type": "Other"},
  {"date": "2025-07-24", "description": "Commencement of Monsoon Semester classes", "type": "Start of Semester"},
  {"date": "2025-08-15", "description": "Independence Day", "type": "Holiday"},
  {"date": "2025-10-02", "description": "Gandhi Jayanti", "type": "Holiday"},
  {"date": "2025-09-16", "endDate": "2025-09-21", "description": "Mid Semester Examination", "type": "Mid-Semester Exams"}
]

CONSECUTIVE EVENTS - CRITICAL:
When you see CONSECUTIVE events in the source (one after another), extract EACH as a SEPARATE entry:
- Event 1 with its own date(s) and description
- Event 2 with its own date(s) and description  
- Event 3 with its own date(s) and description
- etc.

Example from source: "1-10 July: Pre-Registration, 11-15 July: Fee Payment, 16-20 July: Registration"
Correct extraction:
- {"date": "2025-07-01", "endDate": "2025-07-10", "description": "Pre-Registration"}
- {"date": "2025-07-11", "endDate": "2025-07-15", "description": "Fee Payment"}
- {"date": "2025-07-16", "endDate": "2025-07-20", "description": "Registration"}

TABLE/LIST PARSING - CRITICAL:
- Each ROW in a table is typically a SEPARATE event
- Each BULLET POINT is typically a SEPARATE event
- Look for date patterns like "1-10", "11-15", "16-20" - these are DIFFERENT date ranges for DIFFERENT events
- If dates are consecutive but different, they are DIFFERENT events

DO NOT:
- Combine multiple events into one
- Use the same date for different events
- Skip any events
- Call pre-registration "Commencement of classes" - they are DIFFERENT events

EVENT NAMING:
- Use the EXACT name shown next to each date, not a nearby heading
- "Pre-Registration" and "Registration" are DIFFERENT from "Commencement of classes"
- "Commencement of classes" means actual start of teaching, NOT registration
- For holidays like Holi, Diwali, etc - just use the holiday name, not "on account of X"`,
  classificationRules: `CLASSIFICATION BY KEYWORDS:
- "Holiday", "on account of", festivals, breaks, vacations, Jayanti, Purnima, Diwali, Holi, Eid, Christmas → "Holiday"
- "Mid" + "exam" or "Mid-semester" + "exam" → "Mid-Semester Exams"
- "End" + "exam" or "End-semester" + "exam" → "End-Semester Exams"
- "Commencement of classes" or "Classes begin" → "Start of Semester" (NOT registration!)
- Pre-registration, Registration, Enrollment, Fee Payment → "Other"
- Everything else → "Other"`,
};

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const VALID_TYPES = [
  'Start of Semester',
  'Mid-Semester Exams',
  'End-Semester Exams',
  'Holiday',
  'Other',
];

function isCalendarEvent(item: unknown): item is CalendarEventData {
  if (typeof item !== 'object' || item === null) return false;
  const obj = item as Record<string, unknown>;

  return (
    typeof obj.date === 'string' &&
    DATE_REGEX.test(obj.date) &&
    typeof obj.description === 'string' &&
    obj.description.length > 0 &&
    typeof obj.type === 'string'
  );
}

function normalizeCalendarEvent(item: CalendarEventData): CalendarEventData {
  let description = item.description.trim();

  // Extract the holiday name from "on account of X" pattern
  const onAccountMatch = description.match(/on account of\s+(.+)/i);
  if (onAccountMatch && onAccountMatch[1]) {
    description = onAccountMatch[1].trim();
  }

  // Remove "(Tentative)" or "(Confirmed)" suffixes but keep the main name
  description = description
    .replace(/\s*\(tentative\)/gi, '')
    .replace(/\s*\(confirmed\)/gi, '')
    .trim();

  // Strip dates from description
  description = stripDatesFromDescription(description);

  return {
    date: item.date,
    endDate:
      item.endDate && DATE_REGEX.test(item.endDate) && item.endDate !== item.date
        ? item.endDate
        : undefined,
    description,
    type: VALID_TYPES.includes(item.type) ? item.type : 'Other',
  };
}

/**
 * Remove date patterns from description text
 */
function stripDatesFromDescription(desc: string): string {
  return (
    desc
      // Remove patterns like "21 July, 2025" or "21st July 2025"
      .replace(
        /\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December),?\s+\d{4}/gi,
        ''
      )
      // Remove patterns like "21-07-2025" or "21/07/2025"
      .replace(/\d{1,2}[-\/]\d{1,2}[-\/]\d{4}/g, '')
      // Remove patterns like "2025-07-21"
      .replace(/\d{4}[-\/]\d{1,2}[-\/]\d{1,2}/g, '')
      // Remove date ranges like "16 - 21 September"
      .replace(
        /\d{1,2}\s*[-–]\s*\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)/gi,
        ''
      )
      // Clean up extra spaces and punctuation
      .replace(/^[\s,:-]+|[\s,:-]+$/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

function getCalendarEventKey(item: CalendarEventData): string {
  // Normalize description for comparison - remove filler words and common variations
  const normDesc = item.description
    .toLowerCase()
    // Remove common filler phrases
    .replace(/on account of/gi, '')
    .replace(/\(tentative\)/gi, '')
    .replace(/\(confirmed\)/gi, '')
    // Remove year references
    .replace(/\d{4}(-\d{2,4})?/g, '')
    // Remove common words that don't add meaning
    .replace(/semester|winter|monsoon|spring|autumn|for|the|of/gi, '')
    // Remove special characters and extra spaces
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Use just the start date for comparison (same date = likely same event)
  return `${item.date}|${normDesc}`;
}

export const calendarExtractionConfig: ExtractionConfig<CalendarEventData> = {
  schema: calendarSchema,
  validate: isCalendarEvent,
  normalize: normalizeCalendarEvent,
  getDedupeKey: getCalendarEventKey,
  maxChunkSize: 4000,
  chunkOverlap: 200,
  maxRetries: 3,
};

// ============================================================================
// Faculty Directory
// ============================================================================

export interface FacultyData {
  name: string;
  department: string;
  designation: string;
  email: string;
  phone: string;
}

const facultySchema: ExtractionSchema = {
  name: 'Faculty Directory Entries',
  description: 'Faculty and staff information from a directory',
  fields: [
    {
      name: 'name',
      type: 'string',
      description: 'Full name of the faculty/staff member',
      required: true,
    },
    {
      name: 'department',
      type: 'string',
      description: 'Department or office name',
      required: true,
    },
    {
      name: 'designation',
      type: 'string',
      description: 'Job title or designation',
      required: true,
    },
    { name: 'email', type: 'string', description: 'Email address', required: false },
    { name: 'phone', type: 'string', description: 'Phone number or extension', required: false },
  ],
  examples: `[
  {"name": "Prof. John Doe", "department": "Computer Science", "designation": "Professor", "email": "john@iitism.ac.in", "phone": "+91-326-223-5000"},
  {"name": "Dr. Jane Smith", "department": "Mathematics", "designation": "Associate Professor", "email": "jane@iitism.ac.in", "phone": "Not available"}
]`,
};

function isFacultyData(item: unknown): item is FacultyData {
  if (typeof item !== 'object' || item === null) return false;
  const obj = item as Record<string, unknown>;

  return (
    typeof obj.name === 'string' &&
    obj.name.length > 0 &&
    typeof obj.department === 'string' &&
    typeof obj.designation === 'string'
  );
}

function normalizeFacultyData(item: FacultyData): FacultyData {
  return {
    name: item.name.trim(),
    department: item.department.trim(),
    designation: item.designation.trim(),
    email: (item.email || '').trim() || 'Not available',
    phone: (item.phone || '').trim() || 'Not available',
  };
}

function getFacultyKey(item: FacultyData): string {
  const normName = item.name.toLowerCase().replace(/\s+/g, ' ').trim();
  const normDept = item.department.toLowerCase().replace(/\s+/g, ' ').trim();
  return `${normName}|${normDept}`;
}

export const facultyExtractionConfig: ExtractionConfig<FacultyData> = {
  schema: facultySchema,
  validate: isFacultyData,
  normalize: normalizeFacultyData,
  getDedupeKey: getFacultyKey,
  maxChunkSize: 4000,
  chunkOverlap: 200,
  maxRetries: 3,
};

// ============================================================================
// Student Directory
// ============================================================================

export interface StudentData {
  name: string;
  rollNumber: string;
  branch: string;
  year: number;
  email: string;
}

const studentSchema: ExtractionSchema = {
  name: 'Student Directory Entries',
  description: 'Student information from a directory or list',
  fields: [
    { name: 'name', type: 'string', description: 'Full name of the student', required: true },
    {
      name: 'rollNumber',
      type: 'string',
      description: 'Roll number or admission number',
      required: true,
    },
    { name: 'branch', type: 'string', description: 'Branch or program name', required: true },
    { name: 'year', type: 'number', description: 'Current year of study (1-5)', required: false },
    { name: 'email', type: 'string', description: 'Email address', required: false },
  ],
  examples: `[
  {"name": "Rahul Kumar", "rollNumber": "21JE0001", "branch": "Electronics Engineering", "year": 3, "email": "21je0001@iitism.ac.in"},
  {"name": "Priya Singh", "rollNumber": "22MT0015", "branch": "Computer Science", "year": 2, "email": "22mt0015@iitism.ac.in"}
]`,
};

function isStudentData(item: unknown): item is StudentData {
  if (typeof item !== 'object' || item === null) return false;
  const obj = item as Record<string, unknown>;

  return (
    typeof obj.name === 'string' &&
    obj.name.length > 0 &&
    typeof obj.rollNumber === 'string' &&
    obj.rollNumber.length > 0 &&
    typeof obj.branch === 'string'
  );
}

function normalizeStudentData(item: StudentData): StudentData {
  return {
    name: item.name.trim(),
    rollNumber: item.rollNumber.trim().toUpperCase(),
    branch: item.branch.trim(),
    year: typeof item.year === 'number' && item.year >= 1 && item.year <= 5 ? item.year : 1,
    email: (item.email || '').trim() || '',
  };
}

function getStudentKey(item: StudentData): string {
  return item.rollNumber.toLowerCase();
}

export const studentExtractionConfig: ExtractionConfig<StudentData> = {
  schema: studentSchema,
  validate: isStudentData,
  normalize: normalizeStudentData,
  getDedupeKey: getStudentKey,
  maxChunkSize: 4000,
  chunkOverlap: 200,
  maxRetries: 3,
};

// ============================================================================
// Courses
// ============================================================================

export interface CourseData {
  code: string;
  name: string;
  ltp?: string; // L-T-P format (e.g., "3-1-0")
  credits: number;
  courseType?: string; // CBCS or NEP
  instructor?: string;
  slots?: string[]; // Time slots like ["Mon 9:00-10:00 LH1", "Wed 10:00-11:00 LH2"]
}

const courseSchema: ExtractionSchema = {
  name: 'Course Information',
  description: 'Course details from a course list, timetable, or syllabus',
  fields: [
    {
      name: 'code',
      type: 'string',
      description: 'Course code (e.g., CS101, MEC301)',
      required: true,
    },
    { name: 'name', type: 'string', description: 'Course name/title', required: true },
    {
      name: 'ltp',
      type: 'string',
      description: 'Lecture-Tutorial-Practical format (e.g., "3-1-0", "3-0-2")',
      required: false,
    },
    {
      name: 'credits',
      type: 'number',
      description: 'Number of credits (typically 1-12)',
      required: false,
    },
    {
      name: 'courseType',
      type: 'string',
      description: 'Type of course: CBCS or NEP',
      required: false,
    },
    { name: 'instructor', type: 'string', description: 'Instructor/Faculty name', required: false },
    {
      name: 'slots',
      type: 'string',
      description: 'Time slots with day, time, and venue (array)',
      required: false,
    },
  ],
  examples: `[
  {"code": "CSC301", "name": "Data Structures", "ltp": "3-1-0", "credits": 9, "courseType": "CBCS", "instructor": "Dr. Amit Kumar", "slots": ["Mon 10:00-11:00 LH1", "Wed 10:00-11:00 LH1", "Fri 11:00-12:00 LH2"]},
  {"code": "MEC205", "name": "Thermodynamics", "ltp": "3-0-2", "credits": 11, "courseType": "NEP", "slots": ["Tue 9:00-10:00 ME201"]},
  {"code": "MA201", "name": "Linear Algebra", "ltp": "3-1-0", "credits": 9, "instructor": "Prof. Singh"},
  {"code": "PHY101", "name": "Physics Lab", "ltp": "0-0-3", "credits": 3}
]

EXTRACTION RULES:
- Course code should be uppercase (e.g., CSC301, MEC205)
- LTP format should be "X-Y-Z" where X=Lectures, Y=Tutorials, Z=Practicals
- Credits are typically calculated as (L + T/2 + P/2) * 3 or given directly
- Slots should include day, time range, and venue if available
- courseType should be either "CBCS" or "NEP" if mentioned

COMMON PATTERNS:
- Course codes often follow pattern: 2-3 letters + 3 numbers (CS101, MEC301, etc.)
- Time slots may appear as "Mon 9-10 LH1" or "Monday 09:00-10:00 Lecture Hall 1"`,
};

function isCourseData(item: unknown): item is CourseData {
  if (typeof item !== 'object' || item === null) return false;
  const obj = item as Record<string, unknown>;

  return (
    typeof obj.code === 'string' &&
    obj.code.length > 0 &&
    typeof obj.name === 'string' &&
    obj.name.length > 0
  );
}

function normalizeCourseData(item: CourseData): CourseData {
  const code = item.code.trim().toUpperCase();

  // Normalize LTP format
  let ltp = item.ltp?.trim() || undefined;
  if (ltp && !ltp.match(/^\d+-\d+-\d+$/)) {
    // Try to fix common formats like "3 1 0" or "3,1,0"
    ltp = ltp.replace(/[,\s]+/g, '-');
  }

  // Determine courseType from course code prefix
  // If code starts with 'N', it's NEP, otherwise CBCS
  const courseType: 'CBCS' | 'NEP' = code.startsWith('N') ? 'NEP' : 'CBCS';

  // Calculate credits from LTP if not provided or 0
  let credits = typeof item.credits === 'number' && item.credits > 0 ? item.credits : 0;

  if (credits === 0 && ltp) {
    const ltpMatch = ltp.match(/^(\d+)-(\d+)-(\d+)$/);
    if (ltpMatch && ltpMatch[1] && ltpMatch[2] && ltpMatch[3]) {
      const L = parseInt(ltpMatch[1], 10);
      const T = parseInt(ltpMatch[2], 10);
      const P = parseInt(ltpMatch[3], 10);

      if (courseType === 'CBCS') {
        // CBCS: 3*L + 2*T + P
        credits = 3 * L + 2 * T + P;
      } else {
        // NEP: L + T + 0.5*P
        credits = L + T + 0.5 * P;
      }
    }
  }

  // Normalize slots
  let slots: string[] | undefined = item.slots;
  if (Array.isArray(slots)) {
    slots = slots.map((s: unknown) => String(s).trim()).filter((s: string) => s.length > 0);
  } else if (typeof item.slots === 'string') {
    // Convert semicolon-separated string to array
    slots = (item.slots as string)
      .split(/[;,]/)
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);
  }

  return {
    code,
    name: item.name.trim(),
    ltp,
    credits,
    courseType,
    instructor: item.instructor?.trim() || undefined,
    slots: slots && slots.length > 0 ? slots : undefined,
  };
}

function getCourseKey(item: CourseData): string {
  return item.code.toLowerCase();
}

export const courseExtractionConfig: ExtractionConfig<CourseData> = {
  schema: courseSchema,
  validate: isCourseData,
  normalize: normalizeCourseData,
  getDedupeKey: getCourseKey,
  maxChunkSize: 4000,
  chunkOverlap: 200,
  maxRetries: 3,
};
