import { Plus, Search, Trash2, Edit2, Phone, Mail, Building, Upload } from 'lucide-react';
import React, { useState, useMemo } from 'react';

import { AdminConfig, AdminDirectoryEntry } from '../types';
import { AdminHeader, UsersIcon } from './AdminIcons';
import AdminPageLayout from './AdminPageLayout';
import DirectoryUploader from './DirectoryUploader';

interface Props {
  config: AdminConfig;
  addDirectoryEntry: (entry: Omit<AdminDirectoryEntry, 'id'>) => void;
  updateDirectoryEntry: (id: string, entry: Partial<AdminDirectoryEntry>) => void;
  deleteDirectoryEntry: (id: string) => void;
  deleteDirectoryEntriesByIds: (ids: string[]) => void;
  clearAllDirectoryEntries: () => void;
  importDirectoryEntries: (entries: Omit<AdminDirectoryEntry, 'id'>[]) => void;
}
const DirectoryEditor: React.FC<Props> = ({
  config,
  addDirectoryEntry,
  updateDirectoryEntry,
  deleteDirectoryEntry,
  deleteDirectoryEntriesByIds,
  clearAllDirectoryEntries,
  importDirectoryEntries,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [editingEntry, setEditingEntry] = useState<AdminDirectoryEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [newEntry, setNewEntry] = useState<Omit<AdminDirectoryEntry, 'id'>>({
    name: '',
    department: '',
    designation: '',
    email: '',
    phone: '',
  });

  // Get unique departments
  const departments = useMemo(() => {
    const depts = new Set((config.directory || []).map((e) => e.department));
    return Array.from(depts).sort();
  }, [config.directory]);

  // Filter entries
  const filteredEntries = useMemo(() => {
    return (config.directory || []).filter((entry) => {
      const matchesSearch =
        entry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.designation.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDept = filterDepartment === 'all' || entry.department === filterDepartment;
      return matchesSearch && matchesDept;
    });
  }, [config.directory, searchQuery, filterDepartment]);

  // Paginate
  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);
  const paginatedEntries = filteredEntries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleAddEntry = () => {
    if (newEntry.name.trim() && newEntry.department.trim()) {
      addDirectoryEntry({
        name: newEntry.name.trim(),
        department: newEntry.department.trim(),
        designation: newEntry.designation.trim(),
        email: newEntry.email.trim(),
        phone: newEntry.phone.trim(),
      });
      setNewEntry({ name: '', department: '', designation: '', email: '', phone: '' });
      setShowAddModal(false);
    }
  };

  const handleUpdateEntry = () => {
    if (editingEntry && editingEntry.name.trim() && editingEntry.department.trim()) {
      updateDirectoryEntry(editingEntry.id, {
        name: editingEntry.name.trim(),
        department: editingEntry.department.trim(),
        designation: editingEntry.designation.trim(),
        email: editingEntry.email.trim(),
        phone: editingEntry.phone.trim(),
      });
      setEditingEntry(null);
    }
  };

  return (
    <AdminPageLayout>
      {/* Header */}
      <AdminHeader
        icon={<UsersIcon />}
        title="Faculty & Staff Directory"
        subtitle="Manage faculty, staff, and department contacts"
      >
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {/* Delete Filtered - only show when filters are active */}
          {(searchQuery || filterDepartment !== 'all') && filteredEntries.length > 0 && (
            <button
              onClick={() => {
                if (
                  confirm(
                    `Are you sure you want to delete all ${filteredEntries.length} filtered entries? This action cannot be undone.`
                  )
                ) {
                  deleteDirectoryEntriesByIds(filteredEntries.map((e) => e.id));
                }
              }}
              className="admin-btn bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm px-3 sm:px-4"
            >
              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
              Delete {filteredEntries.length}
            </button>
          )}
          {/* Clear All */}
          {(config.directory?.length || 0) > 0 && (
            <button
              onClick={() => {
                if (
                  confirm(
                    `Are you sure you want to delete ALL ${config.directory?.length || 0} faculty entries? This action cannot be undone.`
                  )
                ) {
                  clearAllDirectoryEntries();
                }
              }}
              className="admin-btn bg-red-900 hover:bg-red-800 text-white border border-red-700 text-xs sm:text-sm px-3 sm:px-4"
            >
              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
              Clear All ({config.directory?.length || 0})
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
            Add Entry
          </button>
        </div>
      </AdminHeader>

      {/* Stats */}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="admin-search flex-1">
          <Search className="admin-search-icon w-5 h-5" />
          <input
            type="text"
            className="admin-input"
            style={{ paddingLeft: '48px' }}
            placeholder="Search by name, email, or designation..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <select
          className="admin-select w-full sm:w-auto sm:min-w-[200px]"
          value={filterDepartment}
          onChange={(e) => {
            setFilterDepartment(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="all">All Departments ({config.directory?.length || 0})</option>
          {departments.map((dept) => (
            <option key={dept} value={dept}>
              {dept} ({(config.directory || []).filter((e) => e.department === dept).length})
            </option>
          ))}
        </select>
      </div>

      {/* Directory Table - Desktop */}
      <div className="admin-card p-0 overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Profile</th>
                <th>Contact Info</th>
                <th>Designation</th>
                <th>Department</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEntries.map((entry) => (
                <tr key={entry.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-semibold border border-slate-600">
                        {entry.name.charAt(0)}
                      </div>
                      <div className="font-medium text-white">{entry.name}</div>
                    </div>
                  </td>
                  <td>
                    <div className="space-y-1">
                      {entry.email && (
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <Mail className="w-3 h-3" />
                          <span className="truncate max-w-[180px]">{entry.email}</span>
                        </div>
                      )}
                      {entry.phone && (
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <Phone className="w-3 h-3" />
                          <span>{entry.phone}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="text-blue-400 text-sm">{entry.designation}</td>
                  <td>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      <Building className="w-3 h-3" />
                      {entry.department}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingEntry({ ...entry })}
                        className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteDirectoryEntry(entry.id)}
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

        {paginatedEntries.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            {searchQuery || filterDepartment !== 'all'
              ? 'No entries match your filters'
              : 'No directory entries yet. Add your first entry.'}
          </div>
        )}

        {/* Pagination - Desktop */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-blue-500/10">
            <div className="text-sm text-slate-400">
              Page {currentPage} of {totalPages}
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
      </div>

      {/* Directory Cards - Mobile */}
      <div className="space-y-3 md:hidden">
        {paginatedEntries.map((entry) => (
          <div key={entry.id} className="admin-card p-4">
            {/* Header with avatar, name and actions */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-semibold border border-slate-600 flex-shrink-0">
                  {entry.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-white text-sm truncate">{entry.name}</h4>
                  <p className="text-blue-400 text-xs">{entry.designation}</p>
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => setEditingEntry({ ...entry })}
                  className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteDirectoryEntry(entry.id)}
                  className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Department badge */}
            <div className="mb-3">
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Building className="w-3 h-3" />
                {entry.department}
              </span>
            </div>

            {/* Contact info */}
            <div className="space-y-1">
              {entry.email && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Mail className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{entry.email}</span>
                </div>
              )}
              {entry.phone && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Phone className="w-3 h-3 flex-shrink-0" />
                  <span>{entry.phone}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {paginatedEntries.length === 0 && (
          <div className="text-center py-12 text-slate-500 admin-card">
            {searchQuery || filterDepartment !== 'all'
              ? 'No entries match your filters'
              : 'No directory entries yet. Add your first entry.'}
          </div>
        )}
      </div>

      {/* Pagination - Mobile */}
      {totalPages > 1 && (
        <div className="admin-card md:hidden">
          <div className="flex flex-col gap-3">
            <div className="text-xs text-slate-400 text-center">
              Page {currentPage} of {totalPages}
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

      {/* Add Modal */}
      {showAddModal && (
        <div className="admin-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="admin-modal max-w-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="admin-modal-title">Add Directory Entry</h3>
            <div className="space-y-4">
              <div>
                <label className="admin-label">Name</label>
                <input
                  type="text"
                  className="admin-input"
                  placeholder="Full name..."
                  value={newEntry.name}
                  onChange={(e) => setNewEntry({ ...newEntry, name: e.target.value })}
                />
              </div>
              <div>
                <label className="admin-label">Department</label>
                <input
                  type="text"
                  className="admin-input"
                  placeholder="e.g., Computer Science and Engineering"
                  value={newEntry.department}
                  onChange={(e) => setNewEntry({ ...newEntry, department: e.target.value })}
                  list="departments-list"
                />
                <datalist id="departments-list">
                  {departments.map((dept) => (
                    <option key={dept} value={dept} />
                  ))}
                </datalist>
              </div>
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
                <div>
                  <label className="admin-label">Designation</label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="e.g., Professor"
                    value={newEntry.designation}
                    onChange={(e) => setNewEntry({ ...newEntry, designation: e.target.value })}
                  />
                </div>
                <div>
                  <label className="admin-label">Phone</label>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="+91-XXX-XXX-XXXX"
                    value={newEntry.phone}
                    onChange={(e) => setNewEntry({ ...newEntry, phone: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="admin-label">Email</label>
                <input
                  type="email"
                  className="admin-input"
                  placeholder="email@example.com"
                  value={newEntry.email}
                  onChange={(e) => setNewEntry({ ...newEntry, email: e.target.value })}
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="admin-btn admin-btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button onClick={handleAddEntry} className="admin-btn admin-btn-primary flex-1">
                  Add Entry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingEntry && (
        <div className="admin-modal-overlay" onClick={() => setEditingEntry(null)}>
          <div className="admin-modal max-w-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="admin-modal-title">Edit Directory Entry</h3>
            <div className="space-y-4">
              <div>
                <label className="admin-label">Name</label>
                <input
                  type="text"
                  className="admin-input"
                  value={editingEntry.name}
                  onChange={(e) => setEditingEntry({ ...editingEntry, name: e.target.value })}
                />
              </div>
              <div>
                <label className="admin-label">Department</label>
                <input
                  type="text"
                  className="admin-input"
                  value={editingEntry.department}
                  onChange={(e) => setEditingEntry({ ...editingEntry, department: e.target.value })}
                  list="departments-list-edit"
                />
                <datalist id="departments-list-edit">
                  {departments.map((dept) => (
                    <option key={dept} value={dept} />
                  ))}
                </datalist>
              </div>
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
                <div>
                  <label className="admin-label">Designation</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={editingEntry.designation}
                    onChange={(e) =>
                      setEditingEntry({ ...editingEntry, designation: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="admin-label">Phone</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={editingEntry.phone}
                    onChange={(e) => setEditingEntry({ ...editingEntry, phone: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="admin-label">Email</label>
                <input
                  type="email"
                  className="admin-input"
                  value={editingEntry.email}
                  onChange={(e) => setEditingEntry({ ...editingEntry, email: e.target.value })}
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setEditingEntry(null)}
                  className="admin-btn admin-btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button onClick={handleUpdateEntry} className="admin-btn admin-btn-primary flex-1">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Directory Uploader Modal */}
      {showUploader && (
        <DirectoryUploader
          onImport={importDirectoryEntries}
          onClose={() => setShowUploader(false)}
          existingDepartments={departments}
        />
      )}
    </AdminPageLayout>
  );
};

export default DirectoryEditor;
