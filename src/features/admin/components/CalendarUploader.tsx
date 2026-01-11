import { extractCalendarEventsWithAI, ExtractionProgress } from '@services/aiCalendarExtractor';
import React, { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';

import { AdminCalendarEvent } from '../types';

interface Props {
  onImport: (events: Omit<AdminCalendarEvent, 'id'>[]) => void;
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

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

type EventType =
  | 'Start of Semester'
  | 'Mid-Semester Exams'
  | 'End-Semester Exams'
  | 'Holiday'
  | 'Other';

// Detect event type based on description keywords
const detectEventType = (description: string): EventType => {
  const lower = description.toLowerCase();

  // Holidays
  if (
    /holiday|diwali|holi|christmas|independence\s*day|republic\s*day|jayanti|purnima|eid|id-e|idu'l|muharram|puja|mahavir|buddha|guru\s*nanak|good\s*friday|vacation|break/i.test(
      lower
    )
  ) {
    // Check if it's actually a break (mid-semester/semester break)
    if (/mid.?semester.?break|semester.?break/i.test(lower)) {
      return 'Holiday';
    }
    return 'Holiday';
  }

  // Exams
  if (/mid.?semester.?exam/i.test(lower)) {
    return 'Mid-Semester Exams';
  }
  if (/end.?semester.?exam/i.test(lower)) {
    return 'End-Semester Exams';
  }

  // Start of semester
  if (/commencement.*class|start\s*of\s*semester/i.test(lower)) {
    return 'Start of Semester';
  }

  return 'Other';
};

// Parse date from various formats
const parseDate = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;

  // If it's already a Date object (Excel date)
  if (value instanceof Date) {
    const isoString = value.toISOString();
    return isoString.split('T')[0] ?? null;
  }

  // If it's a number (Excel serial date)
  if (typeof value === 'number') {
    // Excel dates are days since 1899-12-30
    const date = new Date((value - 25569) * 86400 * 1000);
    const isoString = date.toISOString();
    return isoString.split('T')[0] ?? null;
  }

  // If it's a string, try to parse
  if (typeof value === 'string') {
    // Try various date formats
    const dateStr = value.trim();

    // Format: DD-MM-YYYY or DD/MM/YYYY
    const dmyMatch = dateStr.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
    if (dmyMatch) {
      const day = dmyMatch[1];
      const month = dmyMatch[2];
      const year = dmyMatch[3];
      if (day && month && year) {
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
    }

    // Format: YYYY-MM-DD
    const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      return dateStr;
    }

    // Try native Date parsing
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      const isoString = parsed.toISOString();
      return isoString.split('T')[0] ?? null;
    }
  }

  return null;
};

const CalendarUploader: React.FC<Props> = ({ onImport, onClose }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedEvents, setParsedEvents] = useState<Omit<AdminCalendarEvent, 'id'>[]>([]);
  const [semesterDates, setSemesterDates] = useState<{ start: string; end: string } | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState<ExtractionProgress | null>(null);
  const [extractionStats, setExtractionStats] = useState<{
    chunks: number;
    duplicates: number;
  } | null>(null);

  const processExcelFile = useCallback(async (buffer: ArrayBuffer) => {
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });

    // Get first sheet
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error('No sheets found in the workbook');
    }
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      throw new Error('Could not read the sheet');
    }

    // Convert to JSON (array of rows)
    const rawRows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: null,
      raw: false,
    });
    const rows = rawRows as unknown[][];

    if (rows.length < 2) {
      throw new Error('File appears to be empty or has no data rows');
    }

    // Find header row (look for columns containing date-related headers)
    let headerRowIndex = 0;
    let dateColIndex = -1;
    let endDateColIndex = -1;
    let descColIndex = -1;

    for (let i = 0; i < Math.min(rows.length, 10); i++) {
      const row = rows[i];
      if (!Array.isArray(row)) continue;

      for (let j = 0; j < row.length; j++) {
        const cell = String(row[j] || '').toLowerCase();
        if (cell.includes('date') && !cell.includes('end')) {
          dateColIndex = j;
          headerRowIndex = i;
        }
        if (cell.includes('end') && cell.includes('date')) {
          endDateColIndex = j;
        }
        if (
          cell.includes('description') ||
          cell.includes('event') ||
          cell.includes('activity') ||
          cell.includes('details')
        ) {
          descColIndex = j;
        }
      }
      if (dateColIndex >= 0 && descColIndex >= 0) break;
    }

    // If no headers found, assume first columns are: Date, EndDate (optional), Description
    if (dateColIndex < 0) {
      dateColIndex = 0;
      descColIndex = rows[0] && rows[0].length > 2 ? 2 : 1;
      if (rows[0] && rows[0].length > 2) {
        endDateColIndex = 1;
      }
    }

    // Parse events from data rows
    const events: Omit<AdminCalendarEvent, 'id'>[] = [];

    for (let i = headerRowIndex + 1; i < rows.length; i++) {
      const row = rows[i];
      if (!Array.isArray(row) || row.length === 0) continue;

      const dateVal = row[dateColIndex];
      const endDateVal = endDateColIndex >= 0 ? row[endDateColIndex] : null;
      const descVal = row[descColIndex];

      const date = parseDate(dateVal);
      const endDate = parseDate(endDateVal);
      const description = descVal ? String(descVal).trim() : '';

      if (date && description) {
        const eventObj: Omit<AdminCalendarEvent, 'id'> = {
          date,
          description,
          type: detectEventType(description),
        };
        if (endDate && endDate !== date) {
          eventObj.endDate = endDate;
        }
        events.push(eventObj);
      }
    }

    return events;
  }, []);

  const processPdfFile = useCallback(async (buffer: ArrayBuffer) => {
    // Extract text from PDF
    setExtractionProgress({
      phase: 'preparing',
      totalChunks: 0,
      completedChunks: 0,
      currentChunk: 0,
      message: 'Reading PDF...',
    });

    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }

    // Use AI to extract events with progress tracking
    const result = await extractCalendarEventsWithAI(fullText, setExtractionProgress);

    if (!result.success && result.events.length === 0) {
      throw new Error(result.error || 'Failed to extract events with AI');
    }

    // Store extraction stats
    if (result.stats) {
      setExtractionStats({
        chunks: result.stats.totalChunks,
        duplicates: result.stats.duplicatesRemoved,
      });
    }

    return result.events;
  }, []);

  const processFile = useCallback(
    async (file: File) => {
      setError(null);
      setFileName(file.name);
      setIsExtracting(true);
      setExtractionProgress(null);
      setExtractionStats(null);

      try {
        const buffer = await file.arrayBuffer();
        let events: Omit<AdminCalendarEvent, 'id'>[] = [];

        if (file.name.endsWith('.pdf')) {
          events = await processPdfFile(buffer);
        } else {
          events = await processExcelFile(buffer);
        }

        if (events.length === 0) {
          setError(
            'No valid events could be extracted from the file. Make sure the file contains dates and descriptions.'
          );
          return;
        }

        // Sort events by date
        events.sort((a, b) => a.date.localeCompare(b.date));

        // Detect semester dates
        const startEvent = events.find((e) => e.type === 'Start of Semester');
        const endExamEvents = events.filter((e) => e.type === 'End-Semester Exams');
        const lastEndExam = endExamEvents[endExamEvents.length - 1];

        const detectedStart = startEvent?.date || events[0]?.date || '';
        const detectedEnd =
          lastEndExam?.endDate || lastEndExam?.date || events[events.length - 1]?.date || '';

        setParsedEvents(events);
        setSemesterDates({ start: detectedStart, end: detectedEnd });
      } catch (err) {
        console.error('Error parsing file:', err);
        setError(err instanceof Error ? err.message : 'Failed to parse the file.');
      } finally {
        setIsExtracting(false);
        setExtractionProgress(null);
      }
    },
    [processExcelFile, processPdfFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (
        file &&
        (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.pdf'))
      ) {
        processFile(file);
      } else {
        setError('Please upload an Excel file (.xlsx, .xls) or PDF file (.pdf)');
      }
    },
    [processFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        processFile(file);
      }
    },
    [processFile]
  );

  const handleImport = () => {
    if (parsedEvents.length > 0) {
      onImport(parsedEvents);
      onClose();
    }
  };

  const getTypeColor = (type: EventType): string => {
    switch (type) {
      case 'Holiday':
        return 'bg-purple-500';
      case 'Mid-Semester Exams':
        return 'bg-yellow-500';
      case 'End-Semester Exams':
        return 'bg-red-500';
      case 'Start of Semester':
        return 'bg-green-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div
        className="admin-modal max-w-4xl w-[90%] max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="admin-modal-title mb-0">Upload Academic Calendar</h3>
          <button onClick={onClose} className="text-indigo-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-4 text-red-200">
            {error}
          </div>
        )}

        {/* Extraction Progress */}
        {isExtracting && extractionProgress && (
          <div className="bg-slate-800/50 rounded-lg p-6 mb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="animate-spin w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full" />
              <span className="text-white font-medium">Extracting events...</span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-indigo-300 capitalize">{extractionProgress.phase}</span>
                {extractionProgress.totalChunks > 0 && (
                  <span className="text-indigo-400">
                    Chunk {extractionProgress.currentChunk} of {extractionProgress.totalChunks}
                  </span>
                )}
              </div>

              {extractionProgress.totalChunks > 0 && (
                <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full transition-all duration-300"
                    style={{
                      width: `${(extractionProgress.completedChunks / extractionProgress.totalChunks) * 100}%`,
                    }}
                  />
                </div>
              )}

              <p className="text-indigo-400 text-sm">{extractionProgress.message}</p>
            </div>
          </div>
        )}

        {/* Extraction Stats Summary */}
        {!isExtracting && extractionStats && parsedEvents.length > 0 && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-4 text-green-300 text-sm">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>
                Processed {extractionStats.chunks} chunk{extractionStats.chunks !== 1 ? 's' : ''}
                {extractionStats.duplicates > 0 &&
                  `, removed ${extractionStats.duplicates} duplicate${extractionStats.duplicates !== 1 ? 's' : ''}`}
              </span>
            </div>
          </div>
        )}

        {parsedEvents.length === 0 ? (
          <>
            {/* Upload Zone */}
            <div
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
                isDragging
                  ? 'border-indigo-400 bg-indigo-500/10'
                  : 'border-indigo-500/30 hover:border-indigo-500/50'
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <div className="text-indigo-400 mb-4 flex justify-center">
                <UploadIcon />
              </div>
              <p className="text-white text-lg mb-2">Drag & drop your calendar file here</p>
              <p className="text-indigo-400 text-sm mb-4">or click to browse</p>
              <input
                type="file"
                accept=".xlsx,.xls,.pdf"
                onChange={handleFileSelect}
                className="hidden"
                id="calendar-file-input"
              />
              <label
                htmlFor="calendar-file-input"
                className="admin-btn admin-btn-primary cursor-pointer inline-flex"
              >
                Select File
              </label>
              <p className="text-indigo-500 text-xs mt-4">Supports: .xlsx, .xls, .pdf files</p>
            </div>

            {/* Format Info */}
            <div className="mt-6 p-4 bg-slate-800/50 rounded-lg">
              <h4 className="text-indigo-300 font-medium mb-2">Expected Format</h4>
              <p className="text-indigo-400 text-sm">
                <strong>Excel files:</strong> Should have columns for <strong>Date</strong> and{' '}
                <strong>Description</strong> (optionally <strong>End Date</strong>).
                <br />
                <strong>PDF files:</strong> Dates and event descriptions will be extracted
                automatically.
                <br />
                Event types are auto-detected based on keywords.
              </p>
            </div>
          </>
        ) : (
          <>
            {/* Preview */}
            <div className="flex items-center gap-3 mb-4 text-indigo-300">
              <svg
                className="w-5 h-5 text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>
                Extracted <strong className="text-white">{parsedEvents.length}</strong> events from{' '}
                <strong className="text-white">{fileName}</strong>
              </span>
            </div>

            {semesterDates && (
              <div className="flex gap-4 mb-4">
                <div className="flex-1 bg-slate-800/50 rounded-lg p-3">
                  <p className="text-indigo-400 text-xs mb-1">Semester Start</p>
                  <p className="text-white font-medium">{semesterDates.start}</p>
                </div>
                <div className="flex-1 bg-slate-800/50 rounded-lg p-3">
                  <p className="text-indigo-400 text-xs mb-1">Semester End</p>
                  <p className="text-white font-medium">{semesterDates.end}</p>
                </div>
              </div>
            )}

            {/* Events Table */}
            <div className="flex-1 overflow-auto bg-slate-900/50 rounded-lg">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-800">
                  <tr>
                    <th className="text-left p-3 text-indigo-300 font-medium">Date</th>
                    <th className="text-left p-3 text-indigo-300 font-medium">Description</th>
                    <th className="text-left p-3 text-indigo-300 font-medium">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedEvents.map((event, index) => (
                    <tr key={index} className="border-b border-slate-700/50 hover:bg-slate-800/50">
                      <td className="p-3 text-indigo-200 whitespace-nowrap">
                        {event.date}
                        {event.endDate && (
                          <span className="text-indigo-400"> to {event.endDate}</span>
                        )}
                      </td>
                      <td className="p-3 text-white">{event.description}</td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${getTypeColor(event.type)} text-white`}
                        >
                          {event.type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6 pt-4 border-t border-slate-700">
              <button
                onClick={() => {
                  setParsedEvents([]);
                  setSemesterDates(null);
                  setFileName(null);
                }}
                className="admin-btn admin-btn-secondary"
              >
                Upload Different File
              </button>
              <div className="flex-1" />
              <button onClick={onClose} className="admin-btn admin-btn-secondary">
                Cancel
              </button>
              <button onClick={handleImport} className="admin-btn admin-btn-success">
                <CheckIcon />
                Import {parsedEvents.length} Events
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CalendarUploader;
