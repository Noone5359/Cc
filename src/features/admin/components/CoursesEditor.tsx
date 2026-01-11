import { Plus, Search, Upload, Trash2, Edit, X, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import React, { useState, useMemo } from 'react';

import { AdminConfig, AdminCourse } from '../types';
import { AdminHeader, BookOpenIcon } from './AdminIcons';
import AdminPageLayout from './AdminPageLayout';
import CourseUploader from './CourseUploader';

interface Props {
  config: AdminConfig;
  addCourse: (course: Omit<AdminCourse, 'id'>) => void;
  updateCourse: (id: string, course: Partial<AdminCourse>) => void;
  deleteCourse: (id: string) => void;
  deleteCoursesByIds: (ids: string[]) => void;
  clearAllCourses: () => void;
  importCourses: (courses: Omit<AdminCourse, 'id'>[]) => void;
}

const CoursesEditor: React.FC<Props> = ({
  config,
  addCourse,
  updateCourse,
  deleteCourse,
  deleteCoursesByIds,
  clearAllCourses,
  importCourses,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'CBCS' | 'NEP'>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [editingCourse, setEditingCourse] = useState<AdminCourse | null>(null);
  const [editingSlots, setEditingSlots] = useState<
    { day: string; startTime: string; endTime: string; venue: string }[]
  >([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);
  const itemsPerPage = 20;

  // Filter courses
  const filteredCourses = useMemo(() => {
    return config.courses.filter((course) => {
      const matchesSearch =
        course.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.courseName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = typeFilter === 'All' || course.courseType === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [config.courses, searchTerm, typeFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
  const paginatedCourses = filteredCourses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  /* New State for Controlled Inputs */
  const [newSlot, setNewSlot] = useState({
    day: 'Monday',
    startTime: '',
    endTime: '',
    venue: '',
  });
  const [editingSlotIndex, setEditingSlotIndex] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    // Validate L-T-P format
    const ltp = formData.get('ltp') as string;
    const ltpRegex = /^\d+-\d+-\d+$/;
    if (!ltpRegex.test(ltp)) {
      alert('Invalid L-T-P format. Please use the format: 3-0-0 (Lecture-Tutorial-Practical)');
      return;
    }

    const courseData = {
      courseCode: formData.get('courseCode') as string,
      courseName: formData.get('courseName') as string,
      ltp: ltp,
      credits: parseInt(formData.get('credits') as string),
      courseType: formData.get('courseType') as 'CBCS' | 'NEP',
      slots: editingSlots,
    };

    if (editingCourse) {
      updateCourse(editingCourse.id, courseData);
      setEditingCourse(null);
    } else {
      addCourse(courseData);
    }
    setShowAddModal(false);
    setNewSlot({ day: 'Monday', startTime: '', endTime: '', venue: '' }); // Reset slot state
    form.reset();
  };

  const handleAddSlot = () => {
    if (newSlot.day && newSlot.startTime && newSlot.endTime) {
      setEditingSlots((prev) => [...prev, newSlot]);
      // Reset only time and venue, keep day for convenience or reset day too if preferred
      setNewSlot((prev) => ({ ...prev, startTime: '', endTime: '', venue: '' }));
    } else {
      alert('Please fill in Day, Start Time, and End Time for the slot.');
    }
  };

  return (
    <AdminPageLayout>
      {/* Header */}
      <AdminHeader
        icon={<BookOpenIcon />}
        title="Courses"
        subtitle="Manage course catalog and schedules"
      >
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {/* Delete Filtered - only show when filters are active */}
          {(searchTerm || typeFilter !== 'All') && filteredCourses.length > 0 && (
            <button
              onClick={() => {
                if (
                  confirm(
                    `Are you sure you want to delete all ${filteredCourses.length} filtered courses? This action cannot be undone.`
                  )
                ) {
                  // Use atomic bulk delete to avoid race conditions
                  deleteCoursesByIds(filteredCourses.map((c) => c.id));
                }
              }}
              className="admin-btn bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm px-3 sm:px-4"
            >
              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
              Delete {filteredCourses.length}
            </button>
          )}
          {/* Clear All Courses */}
          {config.courses.length > 0 && (
            <button
              onClick={() => {
                if (
                  confirm(
                    `Are you sure you want to delete ALL ${config.courses.length} courses? This action cannot be undone.`
                  )
                ) {
                  clearAllCourses();
                }
              }}
              className="admin-btn bg-red-900 hover:bg-red-800 text-white border border-red-700 text-xs sm:text-sm px-3 sm:px-4"
            >
              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
              Clear All ({config.courses.length})
            </button>
          )}
          <button
            onClick={() => setShowUploader(true)}
            className="admin-btn admin-btn-secondary text-xs sm:text-sm px-3 sm:px-4"
          >
            <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
            Upload Excel
          </button>
          <button
            onClick={() => {
              setEditingCourse(null);
              setEditingSlots([]);
              setShowAddModal(true);
            }}
            className="admin-btn admin-btn-primary text-xs sm:text-sm px-3 sm:px-4"
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
            Add Course
          </button>
        </div>
      </AdminHeader>

      {/* Stats - Placeholder if needed */}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="admin-search flex-1">
          <Search className="admin-search-icon w-5 h-5" />
          <input
            type="text"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="admin-input"
            style={{ paddingLeft: '48px' }}
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value as 'All' | 'CBCS' | 'NEP');
            setCurrentPage(1);
          }}
          className="admin-select w-full sm:w-auto sm:min-w-[120px]"
        >
          <option value="All">All Types</option>
          <option value="CBCS">CBCS</option>
          <option value="NEP">NEP</option>
        </select>
      </div>

      {/* Course Table - Desktop */}
      <div className="admin-card p-0 overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>L-T-P</th>
                <th>Credits</th>
                <th>Type</th>
                <th>Slots</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCourses.map((course) => (
                <React.Fragment key={course.id}>
                  <tr>
                    <td className="font-mono text-blue-400">{course.courseCode}</td>
                    <td>{course.courseName}</td>
                    <td className="text-slate-400">{course.ltp}</td>
                    <td className="text-slate-400">{course.credits}</td>
                    <td>
                      <span
                        className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                          course.courseType === 'CBCS'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {course.courseType}
                      </span>
                    </td>
                    <td>
                      {course.slots && course.slots.length > 0 ? (
                        <button
                          onClick={() =>
                            setExpandedCourseId(expandedCourseId === course.id ? null : course.id)
                          }
                          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30 transition-colors"
                        >
                          <Clock className="w-3 h-3" />
                          {course.slots.length} slot{course.slots.length !== 1 ? 's' : ''}
                          {expandedCourseId === course.id ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-500">No slots</span>
                      )}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingCourse(course);
                            setEditingSlots(course.slots || []);
                            setShowAddModal(true);
                          }}
                          className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteCourse(course.id)}
                          className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {/* Expanded Slots Row */}
                  {expandedCourseId === course.id && course.slots && course.slots.length > 0 && (
                    <tr>
                      <td colSpan={7} className="bg-purple-500/5 border-l-2 border-purple-500">
                        <div className="pl-6 py-3 space-y-2">
                          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                            Class Schedule
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {course.slots.map(
                              (
                                slot: {
                                  day: string;
                                  startTime: string;
                                  endTime: string;
                                  venue?: string;
                                },
                                idx: number
                              ) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-3 bg-slate-800/50 rounded-lg px-3 py-2 text-sm border border-purple-500/20"
                                >
                                  <div className="flex-shrink-0 w-20 font-medium text-purple-400">
                                    {slot.day}
                                  </div>
                                  <div className="flex-1 text-slate-300">
                                    {slot.startTime} - {slot.endTime}
                                  </div>
                                  {slot.venue && (
                                    <div className="text-xs text-slate-400 bg-slate-700/50 px-2 py-1 rounded">
                                      {slot.venue}
                                    </div>
                                  )}
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Course Cards - Mobile */}
      <div className="space-y-3 md:hidden">
        {paginatedCourses.map((course) => (
          <div key={course.id} className="admin-card p-4">
            {/* Header row with code, type, and actions */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-blue-400 text-sm">{course.courseCode}</span>
                  <span
                    className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                      course.courseType === 'CBCS'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {course.courseType}
                  </span>
                </div>
                <h4 className="text-white text-sm font-medium mt-1 break-words">
                  {course.courseName}
                </h4>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => {
                    setEditingCourse(course);
                    setEditingSlots(course.slots || []);
                    setShowAddModal(true);
                  }}
                  className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteCourse(course.id)}
                  className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Details row */}
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span>L-T-P: {course.ltp}</span>
              <span>•</span>
              <span>{course.credits} Credits</span>
            </div>

            {/* Slots section */}
            {course.slots && course.slots.length > 0 && (
              <div className="mt-3">
                <button
                  onClick={() =>
                    setExpandedCourseId(expandedCourseId === course.id ? null : course.id)
                  }
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30 transition-colors"
                >
                  <Clock className="w-3 h-3" />
                  {course.slots.length} slot{course.slots.length !== 1 ? 's' : ''}
                  {expandedCourseId === course.id ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>

                {expandedCourseId === course.id && (
                  <div className="mt-3 space-y-2">
                    {course.slots.map(
                      (
                        slot: { day: string; startTime: string; endTime: string; venue?: string },
                        idx: number
                      ) => (
                        <div
                          key={idx}
                          className="flex flex-wrap items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-2 text-sm border border-purple-500/20"
                        >
                          <span className="font-medium text-purple-400">{slot.day}</span>
                          <span className="text-slate-300">
                            {slot.startTime} - {slot.endTime}
                          </span>
                          {slot.venue && (
                            <span className="text-xs text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded">
                              {slot.venue}
                            </span>
                          )}
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination - Desktop */}
      {totalPages > 1 && (
        <div className="hidden md:flex items-center justify-between px-6 py-4 border-t border-blue-500/10">
          <div className="text-sm text-slate-400">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, filteredCourses.length)} of{' '}
            {filteredCourses.length}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="admin-btn admin-btn-secondary text-sm disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="admin-btn admin-btn-secondary text-sm disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Pagination - Mobile */}
      {totalPages > 1 && (
        <div className="admin-card md:hidden">
          <div className="flex flex-col gap-3">
            <div className="text-xs text-slate-400 text-center">
              Showing {(currentPage - 1) * itemsPerPage + 1}-
              {Math.min(currentPage * itemsPerPage, filteredCourses.length)} of{' '}
              {filteredCourses.length}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="admin-btn admin-btn-secondary text-sm disabled:opacity-40 flex-1 justify-center"
              >
                Previous
              </button>
              <span className="flex items-center justify-center text-sm text-slate-400 min-w-[60px]">
                {currentPage}/{totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="admin-btn admin-btn-secondary text-sm disabled:opacity-40 flex-1 justify-center"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div
          className="admin-modal-overlay"
          onClick={() => {
            setShowAddModal(false);
            setEditingCourse(null);
          }}
        >
          <div className="admin-modal max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="admin-modal-title">{editingCourse ? 'Edit Course' : 'Add Course'}</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingCourse(null);
                }}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="admin-label">Course Code</label>
                <input
                  type="text"
                  name="courseCode"
                  required
                  defaultValue={editingCourse?.courseCode}
                  className="admin-input"
                  placeholder="e.g., CSC305"
                />
              </div>
              <div>
                <label className="admin-label">Course Name</label>
                <input
                  type="text"
                  name="courseName"
                  required
                  defaultValue={editingCourse?.courseName}
                  className="admin-input"
                  placeholder="e.g., Computer Networks"
                />
              </div>
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
                <div>
                  <label className="admin-label">L-T-P</label>
                  <input
                    type="text"
                    name="ltp"
                    required
                    defaultValue={editingCourse?.ltp}
                    className="admin-input"
                    placeholder="3-0-0"
                    title="Format: Lecture-Tutorial-Practical (e.g., 3-0-0)"
                  />
                  <span className="text-xs text-slate-500 mt-1 block">
                    Format: L-T-P (e.g., 3-0-0)
                  </span>
                </div>
                <div>
                  <label className="admin-label">Credits</label>
                  <input
                    type="number"
                    name="credits"
                    required
                    defaultValue={editingCourse?.credits}
                    className="admin-input"
                    placeholder="9"
                  />
                </div>
              </div>
              <div>
                <label className="admin-label">Class Slots</label>
                <div className="space-y-2 mb-3">
                  {editingSlots.map((slot, idx) => (
                    <div
                      key={idx}
                      className={`p-3 bg-slate-800/50 rounded-lg border ${
                        editingSlotIndex === idx ? 'border-emerald-500/50' : 'border-blue-500/20'
                      }`}
                    >
                      {editingSlotIndex === idx ? (
                        // Editing mode
                        <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
                          <select
                            value={slot.day}
                            onChange={(e) => {
                              setEditingSlots((prev) =>
                                prev.map((s, i) => (i === idx ? { ...s, day: e.target.value } : s))
                              );
                            }}
                            className="admin-select text-sm py-2 col-span-1 xs:col-span-2"
                          >
                            {[
                              'Monday',
                              'Tuesday',
                              'Wednesday',
                              'Thursday',
                              'Friday',
                              'Saturday',
                              'Sunday',
                            ].map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>
                          <input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) => {
                              setEditingSlots((prev) =>
                                prev.map((s, i) =>
                                  i === idx ? { ...s, startTime: e.target.value } : s
                                )
                              );
                            }}
                            className="admin-input text-sm py-2"
                          />
                          <input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) => {
                              setEditingSlots((prev) =>
                                prev.map((s, i) =>
                                  i === idx ? { ...s, endTime: e.target.value } : s
                                )
                              );
                            }}
                            className="admin-input text-sm py-2"
                          />
                          <input
                            type="text"
                            placeholder="Venue (optional)"
                            value={slot.venue}
                            onChange={(e) => {
                              setEditingSlots((prev) =>
                                prev.map((s, i) =>
                                  i === idx ? { ...s, venue: e.target.value } : s
                                )
                              );
                            }}
                            className="admin-input text-sm py-2 col-span-1 xs:col-span-2"
                          />
                          <button
                            type="button"
                            onClick={() => setEditingSlotIndex(null)}
                            className="col-span-1 xs:col-span-2 admin-btn bg-emerald-600 hover:bg-emerald-700 text-white text-sm py-2"
                          >
                            Done Editing
                          </button>
                        </div>
                      ) : (
                        // Display mode
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="w-24 text-sm font-medium text-blue-400">{slot.day}</div>
                          <div className="text-sm text-slate-300">
                            {slot.startTime} - {slot.endTime}
                          </div>
                          {slot.venue && (
                            <div className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded">
                              {slot.venue}
                            </div>
                          )}
                          <div className="ml-auto flex gap-1">
                            <button
                              type="button"
                              onClick={() => setEditingSlotIndex(idx)}
                              className="text-blue-400 hover:text-blue-300 p-1 hover:bg-blue-500/20 rounded transition-colors"
                              title="Edit slot"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setEditingSlots((prev) => prev.filter((_, i) => i !== idx))
                              }
                              className="text-red-400 hover:text-red-300 p-1 hover:bg-red-500/20 rounded transition-colors"
                              title="Remove slot"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {editingSlots.length === 0 && (
                    <div className="text-sm text-slate-500 italic text-center py-3">
                      No slots added yet
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 bg-blue-500/10 p-3 rounded-lg border border-blue-500/20">
                  <select
                    value={newSlot.day}
                    onChange={(e) => setNewSlot({ ...newSlot, day: e.target.value })}
                    className="admin-select text-sm py-2 col-span-1 xs:col-span-2"
                  >
                    {[
                      'Monday',
                      'Tuesday',
                      'Wednesday',
                      'Thursday',
                      'Friday',
                      'Saturday',
                      'Sunday',
                    ].map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <input
                    type="time"
                    value={newSlot.startTime}
                    onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                    className="admin-input text-sm py-2"
                    placeholder="Start"
                  />
                  <input
                    type="time"
                    value={newSlot.endTime}
                    onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                    className="admin-input text-sm py-2"
                    placeholder="End"
                  />
                  <input
                    type="text"
                    placeholder="Venue (optional)"
                    value={newSlot.venue}
                    onChange={(e) => setNewSlot({ ...newSlot, venue: e.target.value })}
                    className="admin-input text-sm py-2 col-span-1 xs:col-span-2"
                  />
                  <button
                    type="button"
                    onClick={handleAddSlot}
                    className="col-span-1 xs:col-span-2 mt-1 admin-btn admin-btn-secondary text-sm py-2"
                  >
                    + Add Slot
                  </button>
                </div>
              </div>

              <div>
                <label className="admin-label">Type</label>
                <select
                  name="courseType"
                  defaultValue={editingCourse?.courseType || 'CBCS'}
                  className="admin-select"
                >
                  <option value="CBCS">CBCS</option>
                  <option value="NEP">NEP</option>
                </select>
              </div>
              <button type="submit" className="w-full admin-btn admin-btn-primary py-3">
                {editingCourse ? 'Update Course' : 'Add Course'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Course Uploader Modal */}
      {showUploader && (
        <CourseUploader onImport={importCourses} onClose={() => setShowUploader(false)} />
      )}
    </AdminPageLayout>
  );
};

export default CoursesEditor;
