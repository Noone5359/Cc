import React, { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';

import { AdminCourse } from '../types';

interface Props {
  onImport: (courses: Omit<AdminCourse, 'id'>[]) => void;
  onClose: () => void;
}

const UploadIcon = () => (
  <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
    />
  </svg>
);

const CourseUploader: React.FC<Props> = ({ onImport, onClose }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedCourses, setParsedCourses] = useState<Omit<AdminCourse, 'id'>[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Parse timetable-style Excel (columns: Sl No, Course Code+Name, LTP, Day, Time, Venue)
  const parseExcel = useCallback((data: ArrayBuffer) => {
    try {
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        throw new Error('No sheets found in the workbook');
      }

      const worksheet = workbook.Sheets[firstSheetName];
      if (!worksheet) {
        throw new Error('Could not read worksheet');
      }

      // Get raw row data (like in extract_timetable.js)
      const rows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, defval: null });

      const coursesMap = new Map<string, Omit<AdminCourse, 'id'>>();
      let currentCourse: Omit<AdminCourse, 'id'> | null = null;

      // Helper to calculate credits from LTP
      const calculateCredits = (ltp: string, isNep: boolean): number => {
        const match = ltp.match(/^(\d+)-(\d+)-(\d+)$/);
        if (!match || !match[1] || !match[2] || !match[3]) return 0;
        const L = parseInt(match[1], 10);
        const T = parseInt(match[2], 10);
        const P = parseInt(match[3], 10);
        if (isNep) {
          // NEP: L + T + 0.5*P
          return L + T + 0.5 * P;
        } else {
          // CBCS: 3*L + 2*T + P
          return 3 * L + 2 * T + P;
        }
      };

      // Helper to normalize time to 24h format
      const normalizeTime = (timeStr: string): string => {
        if (!timeStr.includes(':')) return timeStr;

        // Check for AM/PM format
        const isPM = timeStr.toUpperCase().includes('PM');
        const isAM = timeStr.toUpperCase().includes('AM');
        const cleanTime = timeStr.replace(/\s*(AM|PM)/gi, '').trim();
        const parts = cleanTime.split(':');
        if (parts.length < 2) return timeStr;

        let h = parseInt(parts[0] || '0', 10);
        const m = parts[1] || '00';

        if (isPM && h !== 12) h += 12;
        if (isAM && h === 12) h = 0;

        // Heuristic for times without AM/PM: if hour < 8, assume PM
        if (!isPM && !isAM && h < 8) h += 12;

        return `${h.toString().padStart(2, '0')}:${m}`;
      };

      // Start from row 5 (index 5) to skip headers, similar to extract_timetable.js
      for (let i = 5; i < rows.length; i++) {
        const row = rows[i];
        if (!row || !Array.isArray(row)) continue;

        const slNo = row[1];
        const courseCell = row[2];
        const ltp = row[7];

        // Check if this row starts a new course (has Sl No and Course Info)
        if (slNo && courseCell && typeof slNo === 'number') {
          // Save previous course if not already in map
          if (currentCourse && !coursesMap.has(currentCourse.courseCode)) {
            coursesMap.set(currentCourse.courseCode, currentCourse);
          }

          // Parse Course Code and Name from combined cell
          let code = '';
          let name = '';
          const cleanCell = courseCell.toString().trim();

          if (cleanCell.includes('\n')) {
            const parts = cleanCell.split('\n');
            code = parts[0]?.trim() || '';
            name = parts.slice(1).join(' ').replace(/[()]/g, '').trim();
          } else {
            const match = cleanCell.match(/^([A-Z0-9]+)\s*[\n\(]?(.*?)[\)]?$/i);
            if (match) {
              code = match[1]?.trim() || '';
              name = (match[2] || '').replace(/[()]/g, '').trim();
            } else {
              const parts = cleanCell.split(' ');
              code = parts[0] || '';
              name = parts.slice(1).join(' ').replace(/[()]/g, '').trim();
            }
          }

          code = code.toUpperCase();
          const ltpStr = ltp ? ltp.toString().trim() : '3-0-0';

          // Determine course type: if code starts with N, it's NEP
          const isNep = code.startsWith('N');
          const courseType: 'CBCS' | 'NEP' = isNep ? 'NEP' : 'CBCS';

          currentCourse = {
            courseCode: code,
            courseName: name || 'Unknown Course',
            ltp: ltpStr,
            credits: calculateCredits(ltpStr, isNep),
            courseType,
            slots: [],
          };
          continue;
        }

        // Process slots for the current course
        if (currentCourse) {
          const day = row[8];
          const timeStr = row[9];
          const venue = row[10];

          if (day && day !== 'Day' && timeStr) {
            const timeString = timeStr.toString().trim();
            const timeParts = timeString.split('-');

            let startTime = '';
            let endTime = '';

            if (timeParts.length >= 2 && timeParts[0] && timeParts[1]) {
              startTime = normalizeTime(timeParts[0].trim());
              endTime = normalizeTime(timeParts[1].trim());
            } else {
              startTime = normalizeTime(timeString);
            }

            currentCourse.slots.push({
              day: day.toString().trim(),
              startTime,
              endTime,
              venue: venue ? venue.toString().trim() : '',
            });
          }
        }
      }

      // Push last course if unique
      if (currentCourse && !coursesMap.has(currentCourse.courseCode)) {
        coursesMap.set(currentCourse.courseCode, currentCourse);
      }

      const courses = Array.from(coursesMap.values());

      if (courses.length === 0) {
        throw new Error(
          'No courses found. Make sure your Excel has the timetable format: Sl No (col B), Course (col C), LTP (col H), Day/Time/Venue (cols I-K)'
        );
      }

      setParsedCourses(courses);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
      setParsedCourses([]);
    }
  }, []);

  const processFile = useCallback(
    async (file: File) => {
      if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
        setError('Please upload an Excel file (.xlsx, .xls, .csv)');
        return;
      }

      setIsProcessing(true);
      setError(null);

      try {
        const buffer = await file.arrayBuffer();
        parseExcel(buffer);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to process file');
        setParsedCourses([]);
      } finally {
        setIsProcessing(false);
      }
    },
    [parseExcel]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleImport = () => {
    if (parsedCourses.length > 0) {
      onImport(parsedCourses);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Upload Timetable
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Import courses from timetable Excel file
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Drop Zone */}
          {parsedCourses.length === 0 && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400'
              }`}
            >
              <div className="flex flex-col items-center">
                <div className={`mb-4 ${isDragging ? 'text-indigo-500' : 'text-gray-400'}`}>
                  <UploadIcon />
                </div>
                <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isDragging ? 'Drop your file here' : 'Drag & drop your timetable Excel file'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">or click to browse</p>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="course-file-input"
                />
                <label
                  htmlFor="course-file-input"
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer transition-colors"
                >
                  Select File
                </label>
              </div>
            </div>
          )}

          {/* Expected Format */}
          {parsedCourses.length === 0 && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                Expected Format:
              </h4>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-mono overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead>
                    <tr className="border-b dark:border-gray-600">
                      <th className="py-1 px-2">Course Code</th>
                      <th className="py-1 px-2">Course Name</th>
                      <th className="py-1 px-2">L-T-P</th>
                      <th className="py-1 px-2">Credits</th>
                      <th className="py-1 px-2">Type</th>
                      <th className="py-1 px-2">Slots (Day Time-Range Venue)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-1 px-2">CSC305</td>
                      <td className="py-1 px-2">Computer Networks</td>
                      <td className="py-1 px-2">3-0-0</td>
                      <td className="py-1 px-2">9</td>
                      <td className="py-1 px-2">CBCS</td>
                      <td className="py-1 px-2">Mon 10:00-11:00 LH1; Tue 14:00-15:00 LH1</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Processing State */}
          {isProcessing && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Processing file...</span>
            </div>
          )}

          {/* Preview */}
          {parsedCourses.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Preview ({parsedCourses.length} courses found)
                </h3>
                <button
                  onClick={() => setParsedCourses([])}
                  className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
                >
                  Upload different file
                </button>
              </div>

              <div className="border dark:border-gray-600 rounded-lg overflow-hidden">
                <div className="max-h-[300px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-300">
                          Code
                        </th>
                        <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-300">
                          Name
                        </th>
                        <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-300">
                          LTP
                        </th>
                        <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-300">
                          Credits
                        </th>
                        <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-300">
                          Type
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                      {parsedCourses.slice(0, 50).map((course, i) => (
                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-4 py-2 font-mono text-gray-900 dark:text-white">
                            {course.courseCode}
                          </td>
                          <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                            {course.courseName}
                          </td>
                          <td className="px-4 py-2 text-gray-500 dark:text-gray-400">
                            {course.ltp}
                          </td>
                          <td className="px-4 py-2 text-gray-500 dark:text-gray-400">
                            {course.credits}
                          </td>
                          <td className="px-4 py-2">
                            <span
                              className={`px-2 py-0.5 rounded text-xs ${
                                course.courseType === 'CBCS'
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                  : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              }`}
                            >
                              {course.courseType}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsedCourses.length > 50 && (
                  <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 text-sm text-gray-500">
                    Showing first 50 of {parsedCourses.length} courses
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={parsedCourses.length === 0}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Import {parsedCourses.length} Courses
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseUploader;
