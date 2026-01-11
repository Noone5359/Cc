import React, { useState } from 'react';

import { AdminConfig, AdminCalendarEvent } from '../types';
import { AdminHeader, CalendarIcon } from './AdminIcons';
import AdminPageLayout from './AdminPageLayout';
import CalendarUploader from './CalendarUploader';

interface Props {
  config: AdminConfig;
  addCalendarEvent: (event: Omit<AdminCalendarEvent, 'id'>) => void;
  updateCalendarEvent: (id: string, event: Partial<AdminCalendarEvent>) => void;
  deleteCalendarEvent: (id: string) => void;
  clearAllCalendarEvents?: () => void;
  importCalendarEvents?: (events: Omit<AdminCalendarEvent, 'id'>[]) => void;
  updateCalendarDates?: (dates: {
    semesterStartDate?: string;
    semesterEndDate?: string;
    semesterName?: string;
  }) => void;
}

const EVENT_TYPES: AdminCalendarEvent['type'][] = [
  'Start of Semester',
  'Mid-Semester Exams',
  'End-Semester Exams',
  'Holiday',
  'Other',
];

const EVENT_TYPE_COLORS: Record<AdminCalendarEvent['type'], string> = {
  'Start of Semester': 'bg-green-500',
  'Mid-Semester Exams': 'bg-yellow-500',
  'End-Semester Exams': 'bg-red-500',
  Holiday: 'bg-purple-500',
  Other: 'bg-blue-500',
};

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

const UploadIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
    />
  </svg>
);

const CalendarEditor: React.FC<Props> = ({
  config,
  addCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  clearAllCalendarEvents,
  importCalendarEvents,
  updateCalendarDates,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AdminCalendarEvent | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<AdminCalendarEvent['type'] | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [newEvent, setNewEvent] = useState<Omit<AdminCalendarEvent, 'id'>>({
    date: '',
    endDate: '',
    description: '',
    type: 'Other',
  });

  // Semester name editing state
  const [editingSemesterName, setEditingSemesterName] = useState(false);
  const [tempSemesterName, setTempSemesterName] = useState(config.calendar.semesterName || '');

  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });

  const handleImportCalendar = (events: Omit<AdminCalendarEvent, 'id'>[]) => {
    setIsImporting(true);
    setImportProgress({ current: 0, total: events.length });

    // Use bulk import function if available (assigns unique IDs properly)
    if (importCalendarEvents) {
      importCalendarEvents(events);
      setImportProgress({ current: events.length, total: events.length });
      setIsImporting(false);
      setShowUploader(false);
    } else {
      // Fallback: clear events, then add one by one
      if (clearAllCalendarEvents) {
        clearAllCalendarEvents();
      }

      // Add events with small delay between each to prevent ID collision
      events.forEach((event, index) => {
        setTimeout(() => {
          addCalendarEvent(event);
          setImportProgress({ current: index + 1, total: events.length });
          if (index === events.length - 1) {
            setIsImporting(false);
            setShowUploader(false);
          }
        }, index * 10);
      });
    }
  };

  const handleAddEvent = () => {
    if (newEvent.date && newEvent.description.trim()) {
      const eventToAdd: Omit<AdminCalendarEvent, 'id'> = {
        date: newEvent.date,
        description: newEvent.description.trim(),
        type: newEvent.type,
      };
      // Only include endDate if it has a value (Firestore doesn't accept undefined)
      if (newEvent.endDate) {
        eventToAdd.endDate = newEvent.endDate;
      }
      addCalendarEvent(eventToAdd);
      setNewEvent({ date: '', endDate: '', description: '', type: 'Other' });
      setShowAddModal(false);
    }
  };

  const handleUpdateEvent = () => {
    if (editingEvent && editingEvent.date && editingEvent.description.trim()) {
      const eventUpdate: Partial<AdminCalendarEvent> = {
        date: editingEvent.date,
        description: editingEvent.description.trim(),
        type: editingEvent.type,
      };
      // Only include endDate if it has a value (Firestore doesn't accept undefined)
      if (editingEvent.endDate) {
        eventUpdate.endDate = editingEvent.endDate;
      }
      updateCalendarEvent(editingEvent.id, eventUpdate);
      setEditingEvent(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Filter and sort events
  const filteredEvents = config.calendar.events
    .filter((event) => {
      const matchesSearch =
        event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.date.includes(searchQuery);
      const matchesType = filterType === 'all' || event.type === filterType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  // Pagination
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <AdminPageLayout>
      <AdminHeader
        icon={<CalendarIcon />}
        title="Academic Calendar"
        subtitle="Manage semester dates and calendar events"
      >
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <button
            onClick={() => setShowUploader(true)}
            className="admin-btn admin-btn-secondary text-xs sm:text-sm"
          >
            <UploadIcon />
            <span className="hidden xs:inline">Upload</span> Calendar
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="admin-btn admin-btn-primary text-xs sm:text-sm"
          >
            <PlusIcon />
            Add Event
          </button>
        </div>
      </AdminHeader>

      {/* Ongoing Semester Name */}
      <div className="admin-card">
        <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-white">Ongoing Semester</h3>
          <span className="px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            Displayed in Dashboard
          </span>
        </div>
        <p className="text-indigo-300 text-sm mb-4">
          Set the name of the current/ongoing semester. This will be displayed in the user
          dashboard's semester progress section.
        </p>
        <div className="p-4 rounded-xl bg-slate-700/50 border border-slate-600/50">
          <label className="text-indigo-400 text-xs font-medium mb-2 block">Semester Name</label>

          {editingSemesterName ? (
            // Edit mode
            <div className="space-y-3">
              <input
                type="text"
                className="admin-input"
                placeholder='e.g., "Monsoon 2025-26" or "Winter 2025-26"'
                value={tempSemesterName}
                onChange={(e) => setTempSemesterName(e.target.value)}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (updateCalendarDates) {
                      updateCalendarDates({ semesterName: tempSemesterName.trim() || undefined });
                    }
                    setEditingSemesterName(false);
                  }}
                  className="admin-btn admin-btn-success text-sm"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setTempSemesterName(config.calendar.semesterName || '');
                    setEditingSemesterName(false);
                  }}
                  className="admin-btn admin-btn-secondary text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            // View mode
            <div className="flex items-center justify-between">
              <p className="text-white text-lg font-medium">
                {config.calendar.semesterName || (
                  <span className="text-slate-400 italic">Auto-detect from events</span>
                )}
              </p>
              <button
                onClick={() => {
                  setTempSemesterName(config.calendar.semesterName || '');
                  setEditingSemesterName(true);
                }}
                className="admin-btn admin-btn-secondary text-sm"
              >
                Edit
              </button>
            </div>
          )}

          <p className="text-slate-400 text-xs mt-3">
            💡 Leave empty to auto-detect from "Start of Semester" events
          </p>
        </div>
      </div>

      {/* Semester Dates - Auto-detected */}
      {(() => {
        // Auto-detect semester dates from events
        const startEvents = config.calendar.events
          .filter((e) => e.type === 'Start of Semester')
          .sort((a, b) => a.date.localeCompare(b.date));
        const endEvents = config.calendar.events
          .filter((e) => e.type === 'End-Semester Exams')
          .sort((a, b) => (a.endDate || a.date).localeCompare(b.endDate || b.date));

        const detectedStart = startEvents[0]?.date;
        const detectedEnd =
          endEvents[endEvents.length - 1]?.endDate || endEvents[endEvents.length - 1]?.date;

        return (
          <div className="admin-card">
            <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-white">Academic Year Dates</h3>
              <span className="px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                Auto-detected
              </span>
            </div>
            <p className="text-indigo-300 text-sm mb-4">
              These dates are automatically detected from "Start of Semester" and "End-Semester
              Exams" events.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 rounded-xl bg-slate-700/50 border border-slate-600/50">
                <label className="text-indigo-400 text-xs font-medium mb-2 block">
                  Year Start Date
                </label>
                <p className="text-white text-lg font-medium">
                  {detectedStart ? (
                    formatDate(detectedStart)
                  ) : (
                    <span className="text-slate-400 italic">
                      No "Start of Semester" event found
                    </span>
                  )}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-700/50 border border-slate-600/50">
                <label className="text-indigo-400 text-xs font-medium mb-2 block">
                  Year End Date
                </label>
                <p className="text-white text-lg font-medium">
                  {detectedEnd ? (
                    formatDate(detectedEnd)
                  ) : (
                    <span className="text-slate-400 italic">
                      No "End-Semester Exams" event found
                    </span>
                  )}
                </p>
              </div>
            </div>
            {(!detectedStart || !detectedEnd) && (
              <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <p className="text-amber-400 text-sm">
                  💡 Add events with type "Start of Semester" and "End-Semester Exams" for automatic
                  detection.
                </p>
              </div>
            )}
          </div>
        );
      })()}

      {/* Stats */}
      <div className="grid grid-cols-2 xs:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-4">
        {EVENT_TYPES.map((type) => (
          <div key={type} className="admin-stat-card p-3 sm:p-6">
            <div className="admin-stat-value text-xl sm:text-3xl">
              {config.calendar.events.filter((e) => e.type === type).length}
            </div>
            <div className="admin-stat-label text-xs leading-tight">{type}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="admin-search flex-1">
          <svg
            className="admin-search-icon w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            className="admin-input"
            style={{ paddingLeft: '48px' }}
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <select
          className="admin-select w-full sm:w-auto"
          value={filterType}
          onChange={(e) => {
            setFilterType(e.target.value as AdminCalendarEvent['type'] | 'all');
            setCurrentPage(1);
          }}
        >
          <option value="all">All Types</option>
          {EVENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {/* Events List */}
      <div className="space-y-3">
        {paginatedEvents.map((event) => (
          <div
            key={event.id}
            className="admin-list-item flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4"
          >
            {/* Top row on mobile: color dot, date, and type */}
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
              <div
                className={`w-3 h-3 rounded-full flex-shrink-0 ${EVENT_TYPE_COLORS[event.type]}`}
              />
              <div className="text-indigo-400 text-xs sm:text-sm sm:w-32 flex-shrink-0">
                {formatDate(event.date)}
                {event.endDate && event.endDate !== event.date && (
                  <span className="block sm:inline"> - {formatDate(event.endDate)}</span>
                )}
              </div>
              <div className="flex-1 min-w-0 hidden sm:block">
                <p className="text-white text-sm sm:text-base break-words">{event.description}</p>
                <span className="text-indigo-400 text-xs">{event.type}</span>
              </div>
            </div>
            {/* Description on mobile - separate row */}
            <div className="flex-1 min-w-0 sm:hidden pl-6">
              <p className="text-white text-sm break-words">{event.description}</p>
              <span className="text-indigo-400 text-xs">{event.type}</span>
            </div>
            {/* Action buttons */}
            <div className="flex gap-2 ml-auto sm:ml-0 flex-shrink-0">
              <button
                onClick={() => setEditingEvent({ ...event })}
                className="admin-btn admin-btn-secondary text-xs sm:text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => deleteCalendarEvent(event.id)}
                className="admin-btn admin-btn-danger text-xs sm:text-sm"
              >
                <TrashIcon />
              </button>
            </div>
          </div>
        ))}

        {filteredEvents.length === 0 && (
          <div className="text-center py-12 text-indigo-400 admin-card">
            {searchQuery || filterType !== 'all'
              ? 'No events match your filters'
              : 'No calendar events yet. Add your first event.'}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="admin-card">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-sm text-slate-400">
              Showing {(currentPage - 1) * itemsPerPage + 1} -{' '}
              {Math.min(currentPage * itemsPerPage, filteredEvents.length)} of{' '}
              {filteredEvents.length} events
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="admin-btn admin-btn-secondary text-sm disabled:opacity-40"
              >
                Previous
              </button>
              <span className="flex items-center px-3 text-sm text-slate-400">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="admin-btn admin-btn-secondary text-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="admin-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="admin-modal-title">Add Calendar Event</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
                <div>
                  <label className="admin-label">Start Date</label>
                  <input
                    type="date"
                    className="admin-input"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="admin-label">End Date (optional)</label>
                  <input
                    type="date"
                    className="admin-input"
                    value={newEvent.endDate}
                    onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="admin-label">Event Type</label>
                <select
                  className="admin-select"
                  value={newEvent.type}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, type: e.target.value as AdminCalendarEvent['type'] })
                  }
                >
                  {EVENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="admin-label">Description</label>
                <textarea
                  className="admin-input min-h-[80px]"
                  placeholder="Event description..."
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={handleAddEvent} className="admin-btn admin-btn-primary flex-1">
                  Add Event
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="admin-btn admin-btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingEvent && (
        <div className="admin-modal-overlay" onClick={() => setEditingEvent(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="admin-modal-title">Edit Calendar Event</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
                <div>
                  <label className="admin-label">Start Date</label>
                  <input
                    type="date"
                    className="admin-input"
                    value={editingEvent.date}
                    onChange={(e) => setEditingEvent({ ...editingEvent, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="admin-label">End Date (optional)</label>
                  <input
                    type="date"
                    className="admin-input"
                    value={editingEvent.endDate || ''}
                    onChange={(e) => setEditingEvent({ ...editingEvent, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="admin-label">Event Type</label>
                <select
                  className="admin-select"
                  value={editingEvent.type}
                  onChange={(e) =>
                    setEditingEvent({
                      ...editingEvent,
                      type: e.target.value as AdminCalendarEvent['type'],
                    })
                  }
                >
                  {EVENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="admin-label">Description</label>
                <textarea
                  className="admin-input min-h-[80px]"
                  value={editingEvent.description}
                  onChange={(e) =>
                    setEditingEvent({ ...editingEvent, description: e.target.value })
                  }
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={handleUpdateEvent} className="admin-btn admin-btn-success flex-1">
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingEvent(null)}
                  className="admin-btn admin-btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Progress Indicator */}
      {isImporting && (
        <div className="admin-modal-overlay">
          <div className="admin-modal text-center">
            <h3 className="admin-modal-title">Importing Calendar Events</h3>
            <div className="space-y-4">
              <div className="w-full bg-slate-700 rounded-full h-3">
                <div
                  className="bg-indigo-500 h-3 rounded-full transition-all duration-200"
                  style={{
                    width: `${importProgress.total > 0 ? (importProgress.current / importProgress.total) * 100 : 0}%`,
                  }}
                />
              </div>
              <p className="text-indigo-300">
                {importProgress.current} of {importProgress.total} events imported
              </p>
              <p className="text-sm text-indigo-400">Please wait while events are being added...</p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Calendar Modal */}
      {showUploader && !isImporting && (
        <CalendarUploader onImport={handleImportCalendar} onClose={() => setShowUploader(false)} />
      )}
    </AdminPageLayout>
  );
};

export default CalendarEditor;
