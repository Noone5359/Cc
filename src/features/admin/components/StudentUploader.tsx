import React, { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';

import { AdminStudentEntry } from '../types';

interface Props {
  onImport: (students: Omit<AdminStudentEntry, 'id'>[]) => void;
  onClose: () => void;
  existingBranches: string[];
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

interface RawStudentRow {
  admNo?: string;
  adm_no?: string;
  admission_no?: string;
  rollNo?: string;
  roll_no?: string;
  name?: string;
  studentName?: string;
  student_name?: string;
  branch?: string;
  department?: string;
  [key: string]: unknown;
}

const StudentUploader: React.FC<Props> = ({
  onImport,
  onClose,
  existingBranches: _existingBranches,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedStudents, setParsedStudents] = useState<Omit<AdminStudentEntry, 'id'>[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

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

      const jsonData = XLSX.utils.sheet_to_json<RawStudentRow>(worksheet);

      const students: Omit<AdminStudentEntry, 'id'>[] = [];

      for (const row of jsonData) {
        // Extract admission number
        const admNo = String(
          row.admNo ||
            row.adm_no ||
            row.admission_no ||
            row.rollNo ||
            row.roll_no ||
            row['Adm No'] ||
            row['Admission No'] ||
            row['Roll No'] ||
            row['ID'] ||
            ''
        ).trim();
        if (!admNo) continue;

        // Extract name
        const name = String(
          row.name ||
            row.studentName ||
            row.student_name ||
            row['Name'] ||
            row['Student Name'] ||
            ''
        )
          .trim()
          .toUpperCase();
        if (!name) continue;

        // Extract branch
        const branch = String(
          row.branch || row.department || row['Branch'] || row['Department'] || row['Program'] || ''
        )
          .trim()
          .toUpperCase();

        students.push({
          admNo: admNo.toUpperCase(),
          name,
          branch: branch || 'UNKNOWN',
        });
      }

      if (students.length === 0) {
        throw new Error(
          'No valid students found. Make sure your Excel has columns: Adm No, Name, Branch'
        );
      }

      setParsedStudents(students);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
      setParsedStudents([]);
    }
  }, []);

  const processFile = useCallback(
    (file: File) => {
      if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
        setError('Please upload an Excel file (.xlsx, .xls) or CSV');
        return;
      }

      setIsProcessing(true);
      const reader = new FileReader();

      reader.onload = (e) => {
        const data = e.target?.result as ArrayBuffer;
        parseExcel(data);
        setIsProcessing(false);
      };

      reader.onerror = () => {
        setError('Failed to read file');
        setIsProcessing(false);
      };

      reader.readAsArrayBuffer(file);
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
    if (parsedStudents.length > 0) {
      onImport(parsedStudents);
      onClose();
    }
  };

  // Get stats about parsed students
  const stats =
    parsedStudents.length > 0
      ? {
          total: parsedStudents.length,
          branches: [...new Set(parsedStudents.map((s) => s.branch))].length,
          years: [
            ...new Set(parsedStudents.map((s) => s.admNo.match(/^(\d{2})/)?.[1]).filter(Boolean)),
          ].length,
        }
      : null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Upload Student Directory
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Import students from Excel file
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
          {parsedStudents.length === 0 && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
                isDragging
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-emerald-400'
              }`}
            >
              <div className="flex flex-col items-center">
                <div className={`mb-4 ${isDragging ? 'text-emerald-500' : 'text-gray-400'}`}>
                  <UploadIcon />
                </div>
                <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isDragging ? 'Drop your file here' : 'Drag & drop your Excel file'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">or click to browse</p>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="student-file-input"
                />
                <label
                  htmlFor="student-file-input"
                  className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer transition-colors"
                >
                  Select File
                </label>
              </div>
            </div>
          )}

          {/* Expected Format */}
          {parsedStudents.length === 0 && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                Expected Format:
              </h4>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-mono overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead>
                    <tr className="border-b dark:border-gray-600">
                      <th className="py-1 px-2">Adm No</th>
                      <th className="py-1 px-2">Name</th>
                      <th className="py-1 px-2">Branch</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-1 px-2">23JE0653</td>
                      <td className="py-1 px-2">NIMMAGADDA PREETHAM</td>
                      <td className="py-1 px-2">ELECTRONICS AND COMMUNICATION ENGINEERING</td>
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Processing file...</span>
            </div>
          )}

          {/* Preview */}
          {parsedStudents.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Preview ({parsedStudents.length.toLocaleString()} students found)
                  </h3>
                  {stats && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {stats.branches} branches • {stats.years} batch years
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setParsedStudents([])}
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
                          Adm No
                        </th>
                        <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-300">
                          Name
                        </th>
                        <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-300">
                          Branch
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                      {parsedStudents.slice(0, 50).map((student, i) => (
                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-4 py-2 font-mono text-gray-900 dark:text-white">
                            {student.admNo}
                          </td>
                          <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                            {student.name}
                          </td>
                          <td className="px-4 py-2 text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                            {student.branch}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsedStudents.length > 50 && (
                  <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 text-sm text-gray-500">
                    Showing first 50 of {parsedStudents.length.toLocaleString()} students
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
            disabled={parsedStudents.length === 0}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Import {parsedStudents.length.toLocaleString()} Students
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentUploader;
