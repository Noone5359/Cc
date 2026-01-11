import React, { useState, useEffect } from 'react';

import { AdminConfig, AdminQuote } from '../types';
import { AdminHeader, SparklesIcon } from './AdminIcons';
import AdminPageLayout from './AdminPageLayout';

interface Props {
  config: AdminConfig;
  addQuote: (quote: Omit<AdminQuote, 'id'>) => void;
  updateQuote: (id: string, quote: Partial<AdminQuote>) => void;
  deleteQuote: (id: string) => void;
}

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

const QuoteIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
    />
  </svg>
);

const QuotesEditor: React.FC<Props> = ({ config, addQuote, updateQuote, deleteQuote }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingQuote, setEditingQuote] = useState<AdminQuote | null>(null);
  const [newQuote, setNewQuote] = useState({ text: '', author: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Handle responsive items per page
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setItemsPerPage(10);
      } else {
        setItemsPerPage(20);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleAddQuote = () => {
    if (newQuote.text.trim() && newQuote.author.trim()) {
      addQuote({
        text: newQuote.text.trim(),
        author: newQuote.author.trim(),
      });
      setNewQuote({ text: '', author: '' });
      setShowAddModal(false);
    }
  };

  const handleUpdateQuote = () => {
    if (editingQuote && editingQuote.text.trim() && editingQuote.author.trim()) {
      updateQuote(editingQuote.id, {
        text: editingQuote.text.trim(),
        author: editingQuote.author.trim(),
      });
      setEditingQuote(null);
    }
  };

  const filteredQuotes = (config.quotes || []).filter(
    (quote) =>
      quote.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredQuotes.length / itemsPerPage);
  const paginatedQuotes = filteredQuotes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <AdminPageLayout>
      <AdminHeader
        icon={<SparklesIcon />}
        title="Motivational Quotes"
        subtitle="Quotes displayed on the student dashboard"
      >
        <button
          onClick={() => setShowAddModal(true)}
          className="admin-btn admin-btn-primary text-xs sm:text-sm"
        >
          <PlusIcon />
          Add Quote
        </button>
      </AdminHeader>

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
          placeholder="Search quotes..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="admin-stat-card p-3 sm:p-6">
          <div className="admin-stat-value text-xl sm:text-3xl">{config.quotes?.length || 0}</div>
          <div className="admin-stat-label text-xs">Total Quotes</div>
        </div>
        <div className="admin-stat-card p-3 sm:p-6">
          <div className="admin-stat-value text-xl sm:text-3xl">
            {new Set((config.quotes || []).map((q) => q.author)).size}
          </div>
          <div className="admin-stat-label text-xs">Unique Authors</div>
        </div>
      </div>

      {/* Quotes List */}
      <div className="space-y-3 sm:space-y-4">
        {paginatedQuotes.map((quote) => (
          <div key={quote.id} className="admin-card">
            <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-500/30 to-orange-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
                <QuoteIcon />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm sm:text-lg italic break-words">"{quote.text}"</p>
                <p className="text-indigo-400 text-xs sm:text-base mt-2">— {quote.author}</p>
              </div>
              <div className="flex sm:flex-col gap-2 mt-2 sm:mt-0">
                <button
                  onClick={() => setEditingQuote({ ...quote })}
                  className="admin-btn admin-btn-secondary text-xs sm:text-sm flex-1 sm:flex-none justify-center"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteQuote(quote.id)}
                  className="admin-btn admin-btn-danger text-xs sm:text-sm flex-1 sm:flex-none justify-center"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredQuotes.length === 0 && (
          <div className="text-center py-8 sm:py-12 text-indigo-400 text-sm sm:text-base admin-card">
            {searchQuery
              ? 'No quotes match your search'
              : 'No quotes added. Click "Add Quote" to create one.'}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="admin-card">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-sm text-slate-400">
              Showing {(currentPage - 1) * itemsPerPage + 1} -{' '}
              {Math.min(currentPage * itemsPerPage, filteredQuotes.length)} of{' '}
              {filteredQuotes.length} quotes
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
            <h3 className="admin-modal-title">Add New Quote</h3>
            <div className="space-y-4">
              <div>
                <label className="admin-label">Quote Text</label>
                <textarea
                  className="admin-input min-h-[100px]"
                  placeholder="Enter the quote..."
                  value={newQuote.text}
                  onChange={(e) => setNewQuote({ ...newQuote, text: e.target.value })}
                />
              </div>
              <div>
                <label className="admin-label">Author</label>
                <input
                  type="text"
                  className="admin-input"
                  placeholder="e.g., Albert Einstein"
                  value={newQuote.author}
                  onChange={(e) => setNewQuote({ ...newQuote, author: e.target.value })}
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={handleAddQuote} className="admin-btn admin-btn-primary flex-1">
                  Add Quote
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
      {editingQuote && (
        <div className="admin-modal-overlay" onClick={() => setEditingQuote(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="admin-modal-title">Edit Quote</h3>
            <div className="space-y-4">
              <div>
                <label className="admin-label">Quote Text</label>
                <textarea
                  className="admin-input min-h-[100px]"
                  value={editingQuote.text}
                  onChange={(e) => setEditingQuote({ ...editingQuote, text: e.target.value })}
                />
              </div>
              <div>
                <label className="admin-label">Author</label>
                <input
                  type="text"
                  className="admin-input"
                  value={editingQuote.author}
                  onChange={(e) => setEditingQuote({ ...editingQuote, author: e.target.value })}
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={handleUpdateQuote} className="admin-btn admin-btn-success flex-1">
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingQuote(null)}
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

export default QuotesEditor;
