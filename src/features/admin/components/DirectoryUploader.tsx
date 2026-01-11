import React, { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';

import { AdminDirectoryEntry } from '../types';

interface Props {
  onImport: (entries: Omit<AdminDirectoryEntry, 'id'>[]) => void;
  onClose: () => void;
  existingDepartments: string[];
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

interface RawFacultyRow {
  name?: string;
  facultyName?: string;
  faculty_name?: string;
  department?: string;
  dept?: string;
  designation?: string;
  title?: string;
  position?: string;
  email?: string;
  emailId?: string;
  email_id?: string;
  phone?: string;
  mobile?: string;
  contact?: string;
  [key: string]: unknown;
}

const DirectoryUploader: React.FC<Props> = ({
  onImport,
  onClose,
  existingDepartments: _existingDepartments,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedEntries, setParsedEntries] = useState<Omit<AdminDirectoryEntry, 'id'>[]>([]);
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

      const jsonData = XLSX.utils.sheet_to_json<RawFacultyRow>(worksheet);

      const entries: Omit<AdminDirectoryEntry, 'id'>[] = [];

      for (const row of jsonData) {
        // Extract name
        const name = String(
          row.name ||
            row.facultyName ||
            row.faculty_name ||
            row['Name'] ||
            row['Faculty Name'] ||
            row['Full Name'] ||
            ''
        ).trim();
        if (!name) continue;

        // Extract department
        const department = String(
          row.department || row.dept || row['Department'] || row['Dept'] || ''
        ).trim();

        // Extract designation
        const designation = String(
          row.designation ||
            row.title ||
            row.position ||
            row['Designation'] ||
            row['Title'] ||
            row['Position'] ||
            ''
        ).trim();

        // Extract email
        const email = String(
          row.email ||
            row.emailId ||
            row.email_id ||
            row['Email'] ||
            row['Email ID'] ||
            row['E-mail'] ||
            ''
        )
          .trim()
          .toLowerCase();

        // Extract phone
        const phone = String(
          row.phone ||
            row.mobile ||
            row.contact ||
            row['Phone'] ||
            row['Mobile'] ||
            row['Contact'] ||
            ''
        ).trim();

        entries.push({
          name,
          department: department || 'UNKNOWN',
          designation: designation || '',
          email: email || '',
          phone: phone || '',
        });
      }

      if (entries.length === 0) {
        throw new Error(
          'No valid faculty entries found. Make sure your Excel has columns: Name, Department, Designation, Email, Phone'
        );
      }

      setParsedEntries(entries);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
      setParsedEntries([]);
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
    if (parsedEntries.length > 0) {
      onImport(parsedEntries);
      onClose();
    }
  };

  // Get stats about parsed entries
  const stats =
    parsedEntries.length > 0
      ? {
          total: parsedEntries.length,
          departments: [...new Set(parsedEntries.map((e) => e.department))].length,
          withEmail: parsedEntries.filter((e) => e.email).length,
        }
      : null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Upload Faculty Directory
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Import faculty from Excel file
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
          {parsedEntries.length === 0 && (
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
                  {isDragging ? 'Drop your file here' : 'Drag & drop your Excel file'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">or click to browse</p>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="directory-file-input"
                />
                <label
                  htmlFor="directory-file-input"
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer transition-colors"
                >
                  Select File
                </label>
              </div>
            </div>
          )}

          {/* Expected Format */}
          {parsedEntries.length === 0 && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                Expected Format:
              </h4>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-mono overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead>
                    <tr className="border-b dark:border-gray-600">
                      <th className="py-1 px-2">Name</th>
                      <th className="py-1 px-2">Department</th>
                      <th className="py-1 px-2">Designation</th>
                      <th className="py-1 px-2">Email</th>
                      <th className="py-1 px-2">Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-1 px-2">Dr. John Doe</td>
                      <td className="py-1 px-2">Computer Science</td>
                      <td className="py-1 px-2">Professor</td>
                      <td className="py-1 px-2">john@example.edu</td>
                      <td className="py-1 px-2">+91-XXX-XXX-XXXX</td>
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
          {parsedEntries.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Preview ({parsedEntries.length.toLocaleString()} entries found)
                  </h3>
                  {stats && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {stats.departments} departments • {stats.withEmail} with email
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setParsedEntries([])}
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
                          Name
                        </th>
                        <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-300">
                          Department
                        </th>
                        <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-300">
                          Designation
                        </th>
                        <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-300">
                          Email
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                      {parsedEntries.slice(0, 50).map((entry, i) => (
                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-4 py-2 text-gray-900 dark:text-white">{entry.name}</td>
                          <td className="px-4 py-2 text-gray-500 dark:text-gray-400 truncate max-w-[150px]">
                            {entry.department}
                          </td>
                          <td className="px-4 py-2 text-blue-500">{entry.designation}</td>
                          <td className="px-4 py-2 text-gray-500 dark:text-gray-400 truncate max-w-[180px]">
                            {entry.email || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsedEntries.length > 50 && (
                  <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 text-sm text-gray-500">
                    Showing first 50 of {parsedEntries.length.toLocaleString()} entries
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
            disabled={parsedEntries.length === 0}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Import {parsedEntries.length.toLocaleString()} Entries
          </button>
        </div>
      </div>
    </div>
  );
};

export default DirectoryUploader;
