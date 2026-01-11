import React, { useState } from 'react';

import { AdminConfig } from '../types';
import { AdminHeader, AcademicCapIcon } from './AdminIcons';
import AdminPageLayout from './AdminPageLayout';

interface Props {
  config: AdminConfig;
  addBranch: (branch: string) => void;
  updateBranch: (index: number, branch: string) => void;
  deleteBranch: (index: number) => void;
  reorderBranches: (branches: string[]) => void;
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

const GripIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
  </svg>
);

const BranchesEditor: React.FC<Props> = ({
  config,
  addBranch,
  updateBranch,
  deleteBranch,
  reorderBranches,
}) => {
  const [newBranch, setNewBranch] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleAddBranch = () => {
    if (newBranch.trim()) {
      addBranch(newBranch.trim());
      setNewBranch('');
    }
  };

  const handleStartEdit = (index: number, value: string) => {
    setEditingIndex(index);
    setEditValue(value);
  };

  const handleSaveEdit = () => {
    if (editingIndex !== null && editValue.trim()) {
      updateBranch(editingIndex, editValue.trim());
      setEditingIndex(null);
      setEditValue('');
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditValue('');
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newBranches = [...(config.branches || [])];
    const removed = newBranches.splice(draggedIndex, 1)[0];
    if (removed !== undefined) {
      newBranches.splice(index, 0, removed);
      reorderBranches(newBranches);
      setDraggedIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const filteredBranches = (config.branches || []).filter((branch) =>
    branch.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminPageLayout>
      <AdminHeader
        icon={<AcademicCapIcon />}
        title="Branches / Departments"
        subtitle="Manage available academic branches for students"
      />

      {/* Add New Branch */}
      <div className="admin-card">
        <h3 className="text-lg font-semibold text-white mb-4">Add New Branch</h3>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <input
            type="text"
            className="admin-input flex-1"
            placeholder="Enter branch name..."
            value={newBranch}
            onChange={(e) => setNewBranch(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddBranch()}
          />
          <button
            onClick={handleAddBranch}
            className="admin-btn admin-btn-primary w-full sm:w-auto justify-center"
          >
            <PlusIcon />
            Add Branch
          </button>
        </div>
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
          placeholder="Search branches..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Branches List */}
      <div className="admin-card">
        <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-2 mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-white">
            All Branches ({config.branches?.length || 0})
          </h3>
          <span className="text-indigo-400 text-xs sm:text-sm hidden sm:inline">
            Drag to reorder
          </span>
        </div>

        <div className="space-y-2 sm:space-y-3">
          {filteredBranches.map((branch) => {
            const actualIndex = (config.branches || []).indexOf(branch);
            return (
              <div
                key={actualIndex}
                draggable={!searchQuery}
                onDragStart={() => handleDragStart(actualIndex)}
                onDragOver={(e) => handleDragOver(e, actualIndex)}
                onDragEnd={handleDragEnd}
                className={`admin-list-item flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 ${
                  draggedIndex === actualIndex ? 'opacity-50' : ''
                }`}
              >
                {/* Top row with drag handle, number, and branch name */}
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  {!searchQuery && (
                    <span className="cursor-grab text-indigo-400 hover:text-indigo-300 hidden sm:block">
                      <GripIcon />
                    </span>
                  )}
                  <span className="text-indigo-400 text-xs sm:text-sm w-6 sm:w-8 flex-shrink-0">
                    #{actualIndex + 1}
                  </span>

                  {editingIndex === actualIndex ? (
                    <input
                      type="text"
                      className="admin-input flex-1 min-w-0"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                      autoFocus
                    />
                  ) : (
                    <span className="flex-1 text-white text-sm sm:text-base break-words min-w-0">
                      {branch}
                    </span>
                  )}
                </div>

                {/* Action buttons */}
                {editingIndex === actualIndex ? (
                  <div className="flex gap-2 sm:gap-3 ml-auto sm:ml-0">
                    <button
                      onClick={handleSaveEdit}
                      className="admin-btn admin-btn-success text-xs sm:text-sm flex-1 sm:flex-none justify-center"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="admin-btn admin-btn-secondary text-xs sm:text-sm flex-1 sm:flex-none justify-center"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 sm:gap-3 ml-auto sm:ml-0">
                    <button
                      onClick={() => handleStartEdit(actualIndex, branch)}
                      className="admin-btn admin-btn-secondary text-xs sm:text-sm flex-1 sm:flex-none justify-center"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteBranch(actualIndex)}
                      className="admin-btn admin-btn-danger text-xs sm:text-sm flex-shrink-0 justify-center"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {filteredBranches.length === 0 && (
            <div className="text-center py-8 text-indigo-400">
              {searchQuery ? 'No branches match your search' : 'No branches added yet'}
            </div>
          )}
        </div>
      </div>
    </AdminPageLayout>
  );
};

export default BranchesEditor;
