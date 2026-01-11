import { Copy, Check, Download, FileCode, Save, Info, Terminal } from 'lucide-react';
import React, { useState } from 'react';

import { AdminConfig } from '../types';

interface Props {
  config: AdminConfig;
  markAsSaved: () => void;
}

type ExportType =
  | 'collegeInfo'
  | 'branches'
  | 'hostels'
  | 'quotes'
  | 'quickLinks'
  | 'forms'
  | 'calendar'
  | 'directory';

const EXPORT_OPTIONS: { id: ExportType; label: string; filename: string }[] = [
  { id: 'collegeInfo', label: 'College Info & Constants', filename: 'collegeInfo.ts' },
  { id: 'branches', label: 'Branches', filename: 'branches.ts' },
  { id: 'hostels', label: 'Hostels', filename: 'hostels.ts' },
  { id: 'quotes', label: 'Quotes', filename: 'quotes.ts' },
  { id: 'quickLinks', label: 'Quick Links', filename: 'quickLinks.ts' },
  { id: 'forms', label: 'Academic Forms', filename: 'forms.tsx' },
  { id: 'calendar', label: 'Academic Calendar', filename: 'academicCalendar.ts' },
  { id: 'directory', label: 'Campus Directory', filename: 'directory.ts' },
];

const ConfigExporter: React.FC<Props> = ({ config, markAsSaved }) => {
  const [selectedExport, setSelectedExport] = useState<ExportType>('collegeInfo');
  const [copied, setCopied] = useState(false);

  const generateCode = (type: ExportType): string => {
    switch (type) {
      case 'collegeInfo':
        return `/**
 * College Information Configuration
 * 
 * This file contains college-specific information that administrators can customize.
 */

export const COLLEGE_INFO = {
  name: {
    full: '${config.collegeInfo.name.full}',
    short: '${config.collegeInfo.name.short}',
    abbreviation: '${config.collegeInfo.name.abbreviation}',
  },
  email: {
    domain: '${config.collegeInfo.email.domain}',
    allowedDomain: '${config.collegeInfo.email.allowedDomain}',
  },
  website: {
    url: '${config.collegeInfo.website.url}',
    name: '${config.collegeInfo.website.name}',
  },
  location: {
    city: '${config.collegeInfo.location.city}',
    state: '${config.collegeInfo.location.state}',
    country: '${config.collegeInfo.location.country}',
  },
} as const;

export const getAppTitle = () => \`College Central - \${COLLEGE_INFO.name.short} Student Portal\`;

export const getEmailValidationMessage = () => 
  \`Only \${COLLEGE_INFO.name.abbreviation} email addresses (\${COLLEGE_INFO.email.allowedDomain}) are allowed.\`;
`;

      case 'branches':
        return `export const BRANCH_OPTIONS: string[] = [
${config.branches.map((b) => `  "${b}",`).join('\n')}
];
`;

      case 'hostels':
        return `export const HOSTEL_OPTIONS: string[] = [
${config.hostels.map((h) => `  "${h}",`).join('\n')}
];
`;

      case 'quotes':
        return `export const MOTIVATIONAL_QUOTES = [
${config.quotes.map((q) => `  { text: "${q.text.replace(/"/g, '\\"')}", author: "${q.author}" },`).join('\n')}
] as const;
`;

      case 'quickLinks':
        return `import { QuickLink } from '../types';
import { COLLEGE_INFO } from './collegeInfo';

export const defaultQuickLinks: QuickLink[] = [
${config.quickLinks.map((l) => `    { id: '${l.id}', name: '${l.name}', href: '${l.href}', isExternal: true, color: '${l.color}', isCustom: false },`).join('\n')}
];
`;

      case 'forms':
        const generalForms = config.forms.filter((f) => f.category === 'general');
        const ugForms = config.forms.filter((f) => f.category === 'ug');
        const pgForms = config.forms.filter((f) => f.category === 'pg');
        const phdForms = config.forms.filter((f) => f.category === 'phd');

        return `import { Form } from '../types';

export const generalForms: Form[] = [
${generalForms.map((f) => `    { title: '${f.title}', formNumber: '${f.formNumber}', downloadLink: '${f.downloadLink}', submitTo: '${f.submitTo}' },`).join('\n')}
];

export const ugForms: Form[] = [
${ugForms.map((f) => `    { title: '${f.title}', formNumber: '${f.formNumber}', downloadLink: '${f.downloadLink}', submitTo: '${f.submitTo}' },`).join('\n')}
];

export const pgForms: Form[] = [
${pgForms.map((f) => `    { title: '${f.title}', formNumber: '${f.formNumber}', downloadLink: '${f.downloadLink}', submitTo: '${f.submitTo}' },`).join('\n')}
];

export const phdForms: Form[] = [
${phdForms.map((f) => `    { title: '${f.title}', formNumber: '${f.formNumber}', downloadLink: '${f.downloadLink}', submitTo: '${f.submitTo}' },`).join('\n')}
];

export const allForms: Form[] = [...generalForms, ...ugForms, ...pgForms, ...phdForms];
`;

      case 'calendar':
        return `import { AcademicCalendarData } from '../types';

export const PRELOADED_CALENDAR_DATA: AcademicCalendarData = {
  semesterStartDate: '${config.calendar.semesterStartDate}',
  semesterEndDate: '${config.calendar.semesterEndDate}',
  events: [
${config.calendar.events.map((e) => `    { date: '${e.date}'${e.endDate ? `, endDate: '${e.endDate}'` : ''}, description: '${e.description.replace(/'/g, "\\'")}', type: '${e.type}' },`).join('\n')}
  ],
};
`;

      case 'directory':
        return `import { DirectoryEntry } from '../types';

export const CAMPUS_DIRECTORY: DirectoryEntry[] = [
${config.directory.map((d) => `  { id: '${d.id}', name: '${d.name.replace(/'/g, "\\'")}', department: '${d.department}', designation: '${d.designation.replace(/'/g, "\\'")}', email: '${d.email}', phone: '${d.phone}' },`).join('\n')}
];
`;

      default:
        return '';
    }
  };

  const handleCopy = async () => {
    const code = generateCode(selectedExport);
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const code = generateCode(selectedExport);
    const option = EXPORT_OPTIONS.find((o) => o.id === selectedExport);
    const blob = new Blob([code], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = option?.filename || 'config.ts';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    markAsSaved();
  };

  const handleDownloadAll = () => {
    EXPORT_OPTIONS.forEach((option) => {
      const code = generateCode(option.id);
      const blob = new Blob([code], { type: 'text/typescript' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = option.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
    markAsSaved();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <FileCode className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Export Configuration</h2>
          <p className="text-slate-400 text-sm">
            Generate TypeScript config files from your changes
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="admin-card bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/30">
        <div className="flex items-start gap-4">
          <Info className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-emerald-300 mb-2">
              How to update configuration
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-emerald-100/70 text-sm">
              <li>Select the config file you want to export (or download all)</li>
              <li>
                Download the generated <code>.ts</code> or <code>.tsx</code> file
              </li>
              <li>
                Replace the corresponding file in your project's{' '}
                <code className="bg-slate-900/50 px-1.5 py-0.5 rounded text-emerald-300 font-mono">
                  config/
                </code>{' '}
                directory
              </li>
              <li>Restart the development server if needed to see changes</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Export Selection */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {EXPORT_OPTIONS.map((option) => (
          <button
            key={option.id}
            onClick={() => setSelectedExport(option.id)}
            className={`p-4 rounded-xl text-left transition-all border ${
              selectedExport === option.id
                ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg border-blue-500/50'
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white border-transparent hover:border-slate-700'
            }`}
          >
            <p className="font-medium text-sm">{option.label}</p>
            <p className="text-xs opacity-60 mt-1 font-mono">{option.filename}</p>
          </button>
        ))}
      </div>

      {/* Code Preview */}
      <div className="admin-card overflow-hidden p-0">
        <div className="bg-slate-900/80 p-4 border-b border-slate-700/50 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-slate-400" />
            <span className="font-mono text-sm text-slate-300 font-medium">
              {EXPORT_OPTIONS.find((o) => o.id === selectedExport)?.filename}
            </span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCopy}
              className={`admin-btn h-8 text-xs ${copied ? 'admin-btn-success' : 'admin-btn-secondary'}`}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
            <button onClick={handleDownload} className="admin-btn admin-btn-primary h-8 text-xs">
              <Download className="w-3 h-3" />
              Download File
            </button>
          </div>
        </div>

        <div className="p-0 overflow-x-auto">
          <pre className="text-xs font-mono text-slate-300 p-6 leading-relaxed">
            {generateCode(selectedExport)}
          </pre>
        </div>
      </div>

      {/* Download All */}
      <div className="admin-card flex items-center justify-between p-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Export All Configurations</h3>
          <p className="text-slate-400 text-sm">
            Download a zip of all config files (actually individual downloads)
          </p>
        </div>
        <button onClick={handleDownloadAll} className="admin-btn admin-btn-success">
          <Save className="w-4 h-4" />
          Download All Files
        </button>
      </div>
    </div>
  );
};

export default ConfigExporter;
