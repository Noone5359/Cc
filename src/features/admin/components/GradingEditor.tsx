import React, { useState } from 'react';

import { AdminGradeDefinition } from '../types';
import AdminPageLayout from './AdminPageLayout';

interface GradingEditorProps {
  config: {
    gradingScale?: AdminGradeDefinition[];
  };
  addGrade: (grade: Omit<AdminGradeDefinition, 'id'>) => void;
  updateGrade: (id: string, grade: Partial<AdminGradeDefinition>) => void;
  deleteGrade: (id: string) => void;
  reorderGrades: (gradingScale: AdminGradeDefinition[]) => void;
  updateGradingScale: (gradingScale: AdminGradeDefinition[]) => void;
}

// Predefined color options for grade display
const COLOR_OPTIONS = [
  {
    name: 'Green (A+)',
    value: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400',
  },
  {
    name: 'Emerald (A)',
    value: 'text-emerald-800 bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200',
  },
  { name: 'Blue (B+)', value: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400' },
  { name: 'Sky (B)', value: 'text-sky-700 bg-sky-200 dark:bg-sky-900/40 dark:text-sky-300' },
  {
    name: 'Amber (C+)',
    value: 'text-amber-700 bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300',
  },
  {
    name: 'Yellow (C)',
    value: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  {
    name: 'Orange (D)',
    value: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400',
  },
  { name: 'Red (F)', value: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400' },
  {
    name: 'Purple',
    value: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400',
  },
  { name: 'Pink', value: 'text-pink-600 bg-pink-100 dark:bg-pink-900/30 dark:text-pink-400' },
  {
    name: 'Indigo',
    value: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400',
  },
  { name: 'Teal', value: 'text-teal-600 bg-teal-100 dark:bg-teal-900/30 dark:text-teal-400' },
];

// Default grading scale to show when no config is present
const DEFAULT_GRADING_SCALE: AdminGradeDefinition[] = [
  {
    id: 'grade-1',
    grade: 'A+',
    points: 10,
    color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400',
  },
  {
    id: 'grade-2',
    grade: 'A',
    points: 9,
    color: 'text-emerald-800 bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200',
  },
  {
    id: 'grade-3',
    grade: 'B+',
    points: 8,
    color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400',
  },
  {
    id: 'grade-4',
    grade: 'B',
    points: 7,
    color: 'text-sky-700 bg-sky-200 dark:bg-sky-900/40 dark:text-sky-300',
  },
  {
    id: 'grade-5',
    grade: 'C+',
    points: 6,
    color: 'text-amber-700 bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300',
  },
  {
    id: 'grade-6',
    grade: 'C',
    points: 5,
    color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  {
    id: 'grade-7',
    grade: 'D',
    points: 4,
    color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400',
  },
  {
    id: 'grade-8',
    grade: 'F',
    points: 0,
    color: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400',
  },
];

const GradingEditor: React.FC<GradingEditorProps> = ({
  config,
  addGrade,
  updateGrade,
  deleteGrade,
  reorderGrades,
  updateGradingScale,
}) => {
  // Use config grades if available, otherwise use defaults
  const gradingScale =
    config.gradingScale && config.gradingScale.length > 0
      ? config.gradingScale
      : DEFAULT_GRADING_SCALE;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGrade, setNewGrade] = useState<Omit<AdminGradeDefinition, 'id'>>({
    grade: '',
    points: 0,
    color: COLOR_OPTIONS[0]!.value,
  });

  const handleAddGrade = () => {
    if (!newGrade.grade.trim()) return;
    addGrade(newGrade);
    setNewGrade({ grade: '', points: 0, color: COLOR_OPTIONS[0]!.value });
    setShowAddForm(false);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newScale = [...gradingScale];
    const temp = newScale[index - 1];
    newScale[index - 1] = newScale[index]!;
    newScale[index] = temp!;
    reorderGrades(newScale);
  };

  const handleMoveDown = (index: number) => {
    if (index === gradingScale.length - 1) return;
    const newScale = [...gradingScale];
    const temp = newScale[index];
    newScale[index] = newScale[index + 1]!;
    newScale[index + 1] = temp!;
    reorderGrades(newScale);
  };

  // Check if we're using defaults (config doesn't have grades)
  const isUsingDefaults = !config.gradingScale || config.gradingScale.length === 0;

  // Save default grades to database
  const handleSaveDefaults = () => {
    updateGradingScale(DEFAULT_GRADING_SCALE);
  };

  return (
    <AdminPageLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold admin-gradient-text">
            Grading Scale Configuration
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            Configure letter grades and their corresponding grade points used for SGPA/CGPA
            calculations
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isUsingDefaults && (
            <button
              onClick={handleSaveDefaults}
              className="admin-btn admin-btn-secondary flex items-center gap-2"
              title="Save these default grades to the database"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                />
              </svg>
              Save Defaults
            </button>
          )}
          <button
            onClick={() => setShowAddForm(true)}
            className="admin-btn admin-btn-primary flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Grade
          </button>
        </div>
      </div>

      {/* Defaults Notice */}
      {isUsingDefaults && (
        <div className="admin-card p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <p className="font-medium">Showing Default Grades</p>
              <p className="text-amber-700 dark:text-amber-300 mt-1">
                These are the standard grades. Click "Save Defaults" to save them to the database,
                or customize as needed.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add Grade Form */}
      {showAddForm && (
        <div className="admin-card p-4 sm:p-6 border-2 border-dashed border-blue-500/30">
          <h3 className="text-lg font-semibold mb-4">Add New Grade</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Grade Letter
              </label>
              <input
                type="text"
                value={newGrade.grade}
                onChange={(e) => setNewGrade({ ...newGrade, grade: e.target.value.toUpperCase() })}
                placeholder="e.g., A+"
                className="admin-input w-full"
                maxLength={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Grade Points
              </label>
              <input
                type="number"
                value={newGrade.points}
                onChange={(e) =>
                  setNewGrade({ ...newGrade, points: parseFloat(e.target.value) || 0 })
                }
                placeholder="e.g., 10"
                className="admin-input w-full"
                min="0"
                max="15"
                step="0.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Display Color
              </label>
              <select
                value={newGrade.color}
                onChange={(e) => setNewGrade({ ...newGrade, color: e.target.value })}
                className="admin-input w-full"
              >
                {COLOR_OPTIONS.map((color) => (
                  <option key={color.value} value={color.value}>
                    {color.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleAddGrade}
                disabled={!newGrade.grade.trim()}
                className="admin-btn admin-btn-primary flex-1"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewGrade({ grade: '', points: 0, color: COLOR_OPTIONS[0]!.value });
                }}
                className="admin-btn admin-btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
          {/* Preview */}
          {newGrade.grade && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">Preview:</span>
              <span className={`px-3 py-1 rounded-lg font-semibold ${newGrade.color}`}>
                {newGrade.grade}
              </span>
              <span className="text-sm text-slate-500">= {newGrade.points} points</span>
            </div>
          )}
        </div>
      )}

      {/* Grade Scale - Desktop Table (hidden on mobile) */}
      <div className="admin-card overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-indigo-500/30">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                  Grade
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                  Points
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                  Color
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                  Preview
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-500/20">
              {gradingScale.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-indigo-400">
                    No grades configured. Click "Add Grade" to get started.
                  </td>
                </tr>
              ) : (
                gradingScale.map((grade, index) => (
                  <tr key={grade.id} className="hover:bg-indigo-500/10 transition-colors">
                    {/* Order Controls */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className="p-1 rounded hover:bg-indigo-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-indigo-400"
                          title="Move Up"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 15l7-7 7 7"
                            />
                          </svg>
                        </button>
                        <span className="text-sm text-indigo-400 w-6 text-center">{index + 1}</span>
                        <button
                          onClick={() => handleMoveDown(index)}
                          disabled={index === gradingScale.length - 1}
                          className="p-1 rounded hover:bg-indigo-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-indigo-400"
                          title="Move Down"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>

                    {/* Grade Letter */}
                    <td className="px-4 py-3">
                      {editingId === grade.id ? (
                        <input
                          type="text"
                          value={grade.grade}
                          onChange={(e) =>
                            updateGrade(grade.id, { grade: e.target.value.toUpperCase() })
                          }
                          className="admin-input w-20"
                          maxLength={3}
                        />
                      ) : (
                        <span className="font-semibold text-lg text-white">{grade.grade}</span>
                      )}
                    </td>

                    {/* Points */}
                    <td className="px-4 py-3">
                      {editingId === grade.id ? (
                        <input
                          type="number"
                          value={grade.points}
                          onChange={(e) =>
                            updateGrade(grade.id, { points: parseFloat(e.target.value) || 0 })
                          }
                          className="admin-input w-24"
                          min="0"
                          max="15"
                          step="0.5"
                        />
                      ) : (
                        <span className="text-white font-medium">{grade.points}</span>
                      )}
                    </td>

                    {/* Color Selector */}
                    <td className="px-4 py-3">
                      {editingId === grade.id ? (
                        <select
                          value={grade.color}
                          onChange={(e) => updateGrade(grade.id, { color: e.target.value })}
                          className="admin-input w-full max-w-[150px]"
                        >
                          {COLOR_OPTIONS.map((color) => (
                            <option key={color.value} value={color.value}>
                              {color.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs text-indigo-400">
                          {COLOR_OPTIONS.find((c) => c.value === grade.color)?.name || 'Custom'}
                        </span>
                      )}
                    </td>

                    {/* Preview */}
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-lg font-semibold ${grade.color}`}>
                        {grade.grade}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {editingId === grade.id ? (
                          <button
                            onClick={() => setEditingId(null)}
                            className="admin-btn admin-btn-secondary text-sm px-3 py-1"
                          >
                            Done
                          </button>
                        ) : (
                          <button
                            onClick={() => setEditingId(grade.id)}
                            className="p-2 rounded-lg hover:bg-indigo-500/20 transition-colors"
                            title="Edit"
                          >
                            <svg
                              className="w-4 h-4 text-indigo-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (
                              window.confirm(
                                `Delete grade "${grade.grade}"? This action cannot be undone.`
                              )
                            ) {
                              deleteGrade(grade.id);
                            }
                          }}
                          className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
                          title="Delete"
                        >
                          <svg
                            className="w-4 h-4 text-red-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grade Scale - Mobile Card View (hidden on desktop) */}
      <div className="admin-card md:hidden">
        <h3 className="text-lg font-semibold text-white mb-4">
          All Grades ({gradingScale.length})
        </h3>
        <div className="space-y-3">
          {gradingScale.length === 0 ? (
            <div className="text-center py-8 text-indigo-400">
              No grades configured. Click "Add Grade" to get started.
            </div>
          ) : (
            gradingScale.map((grade, index) => (
              <div key={grade.id} className="admin-list-item flex flex-col gap-3 p-4">
                {/* Top Row: Order, Preview Badge, and Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Order Controls */}
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="p-0.5 rounded hover:bg-indigo-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-indigo-400"
                      >
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 15l7-7 7 7"
                          />
                        </svg>
                      </button>
                      <span className="text-xs text-indigo-400 text-center">{index + 1}</span>
                      <button
                        onClick={() => handleMoveDown(index)}
                        disabled={index === gradingScale.length - 1}
                        className="p-0.5 rounded hover:bg-indigo-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-indigo-400"
                      >
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                    </div>
                    {/* Preview Badge */}
                    <span className={`px-4 py-2 rounded-lg font-bold text-lg ${grade.color}`}>
                      {grade.grade}
                    </span>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {editingId === grade.id ? (
                      <button
                        onClick={() => setEditingId(null)}
                        className="admin-btn admin-btn-secondary text-xs px-2 py-1"
                      >
                        Done
                      </button>
                    ) : (
                      <button
                        onClick={() => setEditingId(grade.id)}
                        className="p-2 rounded-lg hover:bg-indigo-500/20 transition-colors"
                      >
                        <svg
                          className="w-4 h-4 text-indigo-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete grade "${grade.grade}"?`)) {
                          deleteGrade(grade.id);
                        }
                      }}
                      className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
                    >
                      <svg
                        className="w-4 h-4 text-red-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Info Row */}
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <span className="text-indigo-400">Points: </span>
                    {editingId === grade.id ? (
                      <input
                        type="number"
                        value={grade.points}
                        onChange={(e) =>
                          updateGrade(grade.id, { points: parseFloat(e.target.value) || 0 })
                        }
                        className="admin-input w-16 text-sm py-1"
                        min="0"
                        max="15"
                        step="0.5"
                      />
                    ) : (
                      <span className="text-white font-semibold">{grade.points}</span>
                    )}
                  </div>
                  <div>
                    <span className="text-indigo-400">Color: </span>
                    {editingId === grade.id ? (
                      <select
                        value={grade.color}
                        onChange={(e) => updateGrade(grade.id, { color: e.target.value })}
                        className="admin-input text-xs py-1"
                      >
                        {COLOR_OPTIONS.map((color) => (
                          <option key={color.value} value={color.value}>
                            {color.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-white">
                        {COLOR_OPTIONS.find((c) => c.value === grade.color)?.name || 'Custom'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Edit Grade Letter (only in edit mode) */}
                {editingId === grade.id && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-indigo-400">Grade Letter: </span>
                    <input
                      type="text"
                      value={grade.grade}
                      onChange={(e) =>
                        updateGrade(grade.id, { grade: e.target.value.toUpperCase() })
                      }
                      className="admin-input w-16 text-sm py-1"
                      maxLength={3}
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="admin-card p-4 border border-indigo-500/30">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="text-sm text-indigo-200">
            <p className="font-medium text-white mb-1">About the Grading Scale</p>
            <ul className="list-disc list-inside space-y-1 text-indigo-300">
              <li>Grade points are used to calculate SGPA and CGPA</li>
              <li>The order of grades matters for display in dropdowns</li>
              <li>Typically, higher grades appear first (A+ → F)</li>
              <li>Changes are reflected immediately on the Grades page</li>
            </ul>
          </div>
        </div>
      </div>
    </AdminPageLayout>
  );
};

export default GradingEditor;
