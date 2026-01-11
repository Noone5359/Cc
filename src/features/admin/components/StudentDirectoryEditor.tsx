import { Plus, Search, Upload, Trash2, Edit, X } from 'lucide-react';
import React, { useState, useMemo } from 'react';

import { AdminConfig, AdminStudentEntry } from '../types';
import { AdminHeader, UserGroupIcon } from './AdminIcons';
import AdminPageLayout from './AdminPageLayout';
import StudentUploader from './StudentUploader';

interface Props {
  config: AdminConfig;
  addStudent: (student: Omit<AdminStudentEntry, 'id'>) => void;
  updateStudent: (id: string, student: Partial<AdminStudentEntry>) => void;
  deleteStudent: (id: string) => void;
  deleteStudentsByIds: (ids: string[]) => void;
  clearAllStudents: () => void;
  importStudents: (students: Omit<AdminStudentEntry, 'id'>[]) => void;
}

const StudentDirectoryEditor: React.FC<Props> = ({
  config,
  addStudent,
  updateStudent,
  deleteStudent,
  deleteStudentsByIds,
  clearAllStudents,
  importStudents,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState<string>('All');
  const [yearFilter, setYearFilter] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [editingStudent, setEditingStudent] = useState<AdminStudentEntry | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  // Get year from admission number
  const getYear = (admNo: string): string => {
    const match = admNo.match(/^(\d{2})/);
    return match ? `20${match[1]}` : 'Unknown';
  };

  // Get unique branches and years
  const { branches, years } = useMemo(() => {
    const branchSet = new Set<string>();
    const yearSet = new Set<string>();

    config.students.forEach((student) => {
      branchSet.add(student.branch);
      yearSet.add(getYear(student.admNo));
    });

    return {
      branches: Array.from(branchSet).sort(),
      years: Array.from(yearSet).sort(),
    };
  }, [config.students]);

  // Filter students
  const filteredStudents = useMemo(() => {
    return config.students.filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.admNo.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesBranch = branchFilter === 'All' || student.branch === branchFilter;
      const matchesYear = yearFilter === 'All' || getYear(student.admNo) === yearFilter;

      return matchesSearch && matchesBranch && matchesYear;
    });
  }, [config.students, searchTerm, branchFilter, yearFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const studentData = {
      admNo: formData.get('admNo') as string,
      name: formData.get('name') as string,
      branch: formData.get('branch') as string,
    };

    if (editingStudent) {
      updateStudent(editingStudent.id, studentData);
      setEditingStudent(null);
    } else {
      addStudent(studentData);
    }
    setShowAddModal(false);
    form.reset();
  };

  return (
    <AdminPageLayout>
      {/* Header */}
      <AdminHeader
        icon={<UserGroupIcon />}
        title="Student Directory"
        subtitle="Manage student records and information"
      >
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {/* Delete Filtered - only show when filters are active */}
          {(searchTerm || branchFilter !== 'All' || yearFilter !== 'All') &&
            filteredStudents.length > 0 && (
              <button
                onClick={() => {
                  if (
                    confirm(
                      `Are you sure you want to delete all ${filteredStudents.length} filtered students? This action cannot be undone.`
                    )
                  ) {
                    deleteStudentsByIds(filteredStudents.map((s) => s.id));
                  }
                }}
                className="admin-btn bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm px-3 sm:px-4"
              >
                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                Delete {filteredStudents.length}
              </button>
            )}
          {/* Clear All Students */}
          {config.students.length > 0 && (
            <button
              onClick={() => {
                if (
                  confirm(
                    `Are you sure you want to delete ALL ${config.students.length} students? This action cannot be undone.`
                  )
                ) {
                  clearAllStudents();
                }
              }}
              className="admin-btn bg-red-900 hover:bg-red-800 text-white border border-red-700 text-xs sm:text-sm px-3 sm:px-4"
            >
              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
              Clear All ({config.students.length.toLocaleString()})
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
            onClick={() => setShowAddModal(true)}
            className="admin-btn admin-btn-primary text-xs sm:text-sm px-3 sm:px-4"
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
            Add Student
          </button>
        </div>
      </AdminHeader>

      {/* Stats */}

      {/* Filters */}
      <div className="flex flex-col gap-3">
        {/* Search Bar - Always full width */}
        <div className="admin-search w-full">
          <Search className="admin-search-icon w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name or admission number..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="admin-input"
            style={{ paddingLeft: '48px' }}
          />
        </div>

        {/* Filter Dropdowns - Stack on mobile, row on larger */}
        <div className="flex flex-col xs:flex-row gap-2 sm:gap-3">
          <select
            value={yearFilter}
            onChange={(e) => {
              setYearFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="admin-select w-full xs:flex-1 sm:w-auto sm:min-w-[180px]"
          >
            <option value="All">All Years</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year} ({config.students.filter((s) => getYear(s.admNo) === year).length})
              </option>
            ))}
          </select>
          <select
            value={branchFilter}
            onChange={(e) => {
              setBranchFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="admin-select w-full xs:w-[140px] sm:w-auto sm:min-w-[140px]"
          >
            <option value="All">All Branches ({config.students.length})</option>
            {branches.map((branch) => (
              <option key={branch} value={branch}>
                {branch} ({config.students.filter((s) => s.branch === branch).length})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Student Table - Desktop */}
      <div className="admin-card p-0 overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Adm No</th>
                <th>Name</th>
                <th>Branch</th>
                <th>Year</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedStudents.map((student) => (
                <tr key={student.id}>
                  <td className="font-mono text-cyan-400">{student.admNo}</td>
                  <td>{student.name}</td>
                  <td className="text-slate-400 max-w-[200px] truncate">{student.branch}</td>
                  <td className="text-slate-400">{getYear(student.admNo)}</td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingStudent(student);
                          setShowAddModal(true);
                        }}
                        className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteStudent(student.id)}
                        className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination - Desktop */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-blue-500/10">
            <div className="text-sm text-slate-400">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, filteredStudents.length)} of{' '}
              {filteredStudents.length.toLocaleString()}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="admin-btn admin-btn-secondary text-sm disabled:opacity-40"
              >
                First
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="admin-btn admin-btn-secondary text-sm disabled:opacity-40"
              >
                Previous
              </button>
              <span className="px-3 py-2 text-sm text-slate-400">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="admin-btn admin-btn-secondary text-sm disabled:opacity-40"
              >
                Next
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="admin-btn admin-btn-secondary text-sm disabled:opacity-40"
              >
                Last
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Student Cards - Mobile */}
      <div className="space-y-3 md:hidden">
        {paginatedStudents.map((student) => (
          <div key={student.id} className="admin-card p-4">
            {/* Header with admission number and actions */}
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1 min-w-0">
                <span className="font-mono text-cyan-400 text-sm">{student.admNo}</span>
                <span className="text-slate-500 text-xs ml-2">({getYear(student.admNo)})</span>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => {
                    setEditingStudent(student);
                    setShowAddModal(true);
                  }}
                  className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteStudent(student.id)}
                  className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Name */}
            <h4 className="font-medium text-white text-sm mb-2 break-words">{student.name}</h4>

            {/* Branch */}
            <p className="text-slate-400 text-xs truncate">{student.branch}</p>
          </div>
        ))}
      </div>

      {/* Pagination - Mobile */}
      {totalPages > 1 && (
        <div className="admin-card md:hidden">
          <div className="flex flex-col gap-3">
            <div className="text-xs text-slate-400 text-center">
              Page {currentPage} of {totalPages} ({filteredStudents.length.toLocaleString()}{' '}
              students)
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="admin-btn admin-btn-secondary text-sm disabled:opacity-40 flex-1 justify-center"
              >
                Previous
              </button>
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
            setEditingStudent(null);
          }}
        >
          <div className="admin-modal max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="admin-modal-title">
                {editingStudent ? 'Edit Student' : 'Add Student'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingStudent(null);
                }}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="admin-label">Admission Number</label>
                <input
                  type="text"
                  name="admNo"
                  required
                  defaultValue={editingStudent?.admNo}
                  className="admin-input"
                  placeholder="e.g., 23JE0653"
                />
              </div>
              <div>
                <label className="admin-label">Student Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingStudent?.name}
                  className="admin-input"
                  placeholder="e.g., JOHN DOE"
                />
              </div>
              <div>
                <label className="admin-label">Branch</label>
                <select
                  name="branch"
                  required
                  defaultValue={editingStudent?.branch || ''}
                  className="admin-select"
                >
                  <option value="">Select Branch</option>
                  {branches.map((branch) => (
                    <option key={branch} value={branch}>
                      {branch}
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" className="w-full admin-btn admin-btn-primary py-3">
                {editingStudent ? 'Update Student' : 'Add Student'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Student Uploader Modal */}
      {showUploader && (
        <StudentUploader
          onImport={importStudents}
          onClose={() => setShowUploader(false)}
          existingBranches={branches}
        />
      )}
    </AdminPageLayout>
  );
};

export default StudentDirectoryEditor;
