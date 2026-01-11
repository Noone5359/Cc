import React, { useState } from 'react';

import { AdminConfig, AdminForm } from '../types';
import { AdminHeader, DocumentIcon } from './AdminIcons';
import AdminPageLayout from './AdminPageLayout';

interface Props {
  config: AdminConfig;
  addForm: (form: Omit<AdminForm, 'id'>) => void;
  updateForm: (id: string, form: Partial<AdminForm>) => void;
  deleteForm: (id: string) => void;
}

const CATEGORIES = [
  { value: 'general', label: 'General Forms', color: 'from-blue-500 to-blue-600' },
  { value: 'ug', label: 'UG Forms', color: 'from-green-500 to-green-600' },
  { value: 'pg', label: 'PG Forms', color: 'from-purple-500 to-purple-600' },
  { value: 'phd', label: 'Ph.D Forms', color: 'from-orange-500 to-orange-600' },
];

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

const DownloadIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
    />
  </svg>
);

const FormsEditor: React.FC<Props> = ({ config, addForm, updateForm, deleteForm }) => {
  const [activeCategory, setActiveCategory] = useState<AdminForm['category']>('general');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingForm, setEditingForm] = useState<AdminForm | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [newForm, setNewForm] = useState<Omit<AdminForm, 'id'>>({
    title: '',
    formNumber: '',
    downloadLink: '',
    submitTo: '',
    category: 'general',
  });

  const handleAddForm = () => {
    if (newForm.title.trim() && newForm.formNumber.trim() && newForm.downloadLink.trim()) {
      addForm({
        title: newForm.title.trim(),
        formNumber: newForm.formNumber.trim(),
        downloadLink: newForm.downloadLink.trim(),
        submitTo: newForm.submitTo.trim(),
        category: newForm.category,
      });
      setNewForm({
        title: '',
        formNumber: '',
        downloadLink: '',
        submitTo: '',
        category: activeCategory,
      });
      setShowAddModal(false);
    }
  };

  const handleUpdateForm = () => {
    if (editingForm && editingForm.title.trim() && editingForm.formNumber.trim()) {
      updateForm(editingForm.id, {
        title: editingForm.title.trim(),
        formNumber: editingForm.formNumber.trim(),
        downloadLink: editingForm.downloadLink.trim(),
        submitTo: editingForm.submitTo.trim(),
        category: editingForm.category,
      });
      setEditingForm(null);
    }
  };

  const categoryForms = (config.forms || []).filter((f) => f.category === activeCategory);
  const filteredForms = categoryForms.filter(
    (form) =>
      form.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      form.formNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredForms.length / itemsPerPage);
  const paginatedForms = filteredForms.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getCategoryCount = (cat: AdminForm['category']) =>
    (config.forms || []).filter((f) => f.category === cat).length;

  return (
    <AdminPageLayout>
      <AdminHeader
        icon={<DocumentIcon />}
        title="Academic Forms"
        subtitle="Manage downloadable forms for students"
      >
        <button
          onClick={() => {
            setNewForm({ ...newForm, category: activeCategory });
            setShowAddModal(true);
          }}
          className="admin-btn admin-btn-primary text-xs sm:text-sm"
        >
          <PlusIcon />
          Add Form
        </button>
      </AdminHeader>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 sm:gap-3">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => {
              setActiveCategory(cat.value as AdminForm['category']);
              setCurrentPage(1);
            }}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
              activeCategory === cat.value
                ? `bg-gradient-to-r ${cat.color} text-white shadow-lg`
                : 'bg-slate-800/50 text-indigo-300 hover:bg-slate-700/50'
            }`}
          >
            {cat.label} ({getCategoryCount(cat.value as AdminForm['category'])})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="admin-search flex-1 max-w-2xl">
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
          placeholder="Search forms..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* Forms Table - Desktop */}
      <div className="admin-card overflow-hidden p-0 hidden md:block">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Form #</th>
              <th>Title</th>
              <th>Submit To</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredForms.map((form) => (
              <tr key={form.id}>
                <td>
                  <span className="admin-badge admin-badge-info">{form.formNumber}</span>
                </td>
                <td>{form.title}</td>
                <td className="text-indigo-400">{form.submitTo || '—'}</td>
                <td>
                  <div className="flex gap-2">
                    <a
                      href={form.downloadLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="admin-btn admin-btn-secondary text-sm"
                    >
                      <DownloadIcon />
                    </a>
                    <button
                      onClick={() => setEditingForm({ ...form })}
                      className="admin-btn admin-btn-secondary text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteForm(form.id)}
                      className="admin-btn admin-btn-danger text-sm"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredForms.length === 0 && (
          <div className="text-center py-12 text-indigo-400">
            {searchQuery ? 'No forms match your search' : 'No forms in this category yet'}
          </div>
        )}
      </div>

      {/* Forms Cards - Mobile */}
      <div className="space-y-3 md:hidden">
        {paginatedForms.map((form) => (
          <div key={form.id} className="admin-card">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <span className="admin-badge admin-badge-info text-xs">{form.formNumber}</span>
                <h4 className="text-white font-medium text-sm mt-2 break-words">{form.title}</h4>
                {form.submitTo && (
                  <p className="text-indigo-400 text-xs mt-1">Submit to: {form.submitTo}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <a
                href={form.downloadLink}
                target="_blank"
                rel="noopener noreferrer"
                className="admin-btn admin-btn-secondary text-xs flex-1 justify-center"
              >
                <DownloadIcon />
                Download
              </a>
              <button
                onClick={() => setEditingForm({ ...form })}
                className="admin-btn admin-btn-secondary text-xs px-3"
              >
                Edit
              </button>
              <button
                onClick={() => deleteForm(form.id)}
                className="admin-btn admin-btn-danger text-xs px-3"
              >
                <TrashIcon />
              </button>
            </div>
          </div>
        ))}

        {filteredForms.length === 0 && (
          <div className="text-center py-8 text-indigo-400 text-sm admin-card">
            {searchQuery ? 'No forms match your search' : 'No forms in this category yet'}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="admin-card">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-sm text-slate-400">
              Showing {(currentPage - 1) * itemsPerPage + 1} -{' '}
              {Math.min(currentPage * itemsPerPage, filteredForms.length)} of {filteredForms.length}{' '}
              forms
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
            <h3 className="admin-modal-title">Add New Form</h3>
            <div className="space-y-4">
              <div>
                <label className="admin-label">Form Number</label>
                <input
                  type="text"
                  className="admin-input"
                  placeholder="e.g., A1, UG5"
                  value={newForm.formNumber}
                  onChange={(e) => setNewForm({ ...newForm, formNumber: e.target.value })}
                />
              </div>
              <div>
                <label className="admin-label">Title</label>
                <input
                  type="text"
                  className="admin-input"
                  placeholder="Form title..."
                  value={newForm.title}
                  onChange={(e) => setNewForm({ ...newForm, title: e.target.value })}
                />
              </div>
              <div>
                <label className="admin-label">Download Link</label>
                <input
                  type="url"
                  className="admin-input"
                  placeholder="https://example.com/form.pdf"
                  value={newForm.downloadLink}
                  onChange={(e) => setNewForm({ ...newForm, downloadLink: e.target.value })}
                />
              </div>
              <div>
                <label className="admin-label">Submit To</label>
                <input
                  type="text"
                  className="admin-input"
                  placeholder="e.g., Academic Section"
                  value={newForm.submitTo}
                  onChange={(e) => setNewForm({ ...newForm, submitTo: e.target.value })}
                />
              </div>
              <div>
                <label className="admin-label">Category</label>
                <select
                  className="admin-select"
                  value={newForm.category}
                  onChange={(e) =>
                    setNewForm({ ...newForm, category: e.target.value as AdminForm['category'] })
                  }
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={handleAddForm} className="admin-btn admin-btn-primary flex-1">
                  Add Form
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
      {editingForm && (
        <div className="admin-modal-overlay" onClick={() => setEditingForm(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="admin-modal-title">Edit Form</h3>
            <div className="space-y-4">
              <div>
                <label className="admin-label">Form Number</label>
                <input
                  type="text"
                  className="admin-input"
                  value={editingForm.formNumber}
                  onChange={(e) => setEditingForm({ ...editingForm, formNumber: e.target.value })}
                />
              </div>
              <div>
                <label className="admin-label">Title</label>
                <input
                  type="text"
                  className="admin-input"
                  value={editingForm.title}
                  onChange={(e) => setEditingForm({ ...editingForm, title: e.target.value })}
                />
              </div>
              <div>
                <label className="admin-label">Download Link</label>
                <input
                  type="url"
                  className="admin-input"
                  value={editingForm.downloadLink}
                  onChange={(e) => setEditingForm({ ...editingForm, downloadLink: e.target.value })}
                />
              </div>
              <div>
                <label className="admin-label">Submit To</label>
                <input
                  type="text"
                  className="admin-input"
                  value={editingForm.submitTo}
                  onChange={(e) => setEditingForm({ ...editingForm, submitTo: e.target.value })}
                />
              </div>
              <div>
                <label className="admin-label">Category</label>
                <select
                  className="admin-select"
                  value={editingForm.category}
                  onChange={(e) =>
                    setEditingForm({
                      ...editingForm,
                      category: e.target.value as AdminForm['category'],
                    })
                  }
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={handleUpdateForm} className="admin-btn admin-btn-success flex-1">
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingForm(null)}
                  className="admin-btn admin-btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
};

export default FormsEditor;
