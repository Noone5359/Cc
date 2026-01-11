import React, { useState } from 'react';

import { AdminConfig, AdminQuickLink } from '../types';
import { AdminHeader, LinkIcon as HeaderLinkIcon } from './AdminIcons';
import AdminPageLayout from './AdminPageLayout';

interface Props {
  config: AdminConfig;
  addQuickLink: (link: Omit<AdminQuickLink, 'id'>) => void;
  updateQuickLink: (id: string, link: Partial<AdminQuickLink>) => void;
  deleteQuickLink: (id: string) => void;
}

const ICON_OPTIONS = [
  { value: 'website', label: '🌐 Website' },
  { value: 'cloud', label: '☁️ Cloud' },
  { value: 'video', label: '📹 Video' },
  { value: 'code', label: '💻 Code' },
  { value: 'chat', label: '💬 Chat' },
  { value: 'document', label: '📄 Document' },
  { value: 'music', label: '🎵 Music' },
  { value: 'shopping', label: '🛒 Shopping' },
  { value: 'photo', label: '📷 Photo' },
  { value: 'calculator', label: '🔢 Calculator' },
  { value: 'game', label: '🎮 Game' },
  { value: 'bookmark', label: '🔖 Bookmark' },
  { value: 'newspaper', label: '📰 News' },
];

const COLOR_OPTIONS = [
  { value: 'text-blue-600 dark:text-blue-400', label: 'Blue', class: 'bg-blue-500' },
  { value: 'text-red-600 dark:text-red-400', label: 'Red', class: 'bg-red-500' },
  { value: 'text-green-600 dark:text-green-400', label: 'Green', class: 'bg-green-500' },
  { value: 'text-purple-600 dark:text-purple-400', label: 'Purple', class: 'bg-purple-500' },
  { value: 'text-orange-600 dark:text-orange-400', label: 'Orange', class: 'bg-orange-500' },
  { value: 'text-indigo-600 dark:text-indigo-400', label: 'Indigo', class: 'bg-indigo-500' },
  { value: 'text-teal-600 dark:text-teal-400', label: 'Teal', class: 'bg-teal-500' },
  { value: 'text-pink-600 dark:text-pink-400', label: 'Pink', class: 'bg-pink-500' },
  { value: 'text-cyan-600 dark:text-cyan-400', label: 'Cyan', class: 'bg-cyan-500' },
  { value: 'text-yellow-600 dark:text-yellow-400', label: 'Yellow', class: 'bg-yellow-500' },
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

const LinkIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
    />
  </svg>
);

const QuickLinksEditor: React.FC<Props> = ({
  config,
  addQuickLink,
  updateQuickLink,
  deleteQuickLink,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLink, setEditingLink] = useState<AdminQuickLink | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const defaultColor = COLOR_OPTIONS[0]?.value ?? 'text-blue-600 dark:text-blue-400';
  const [newLink, setNewLink] = useState({
    name: '',
    href: '',
    color: defaultColor,
    icon: 'website',
  });

  const handleAddLink = () => {
    if (newLink.name.trim() && newLink.href.trim()) {
      addQuickLink({
        name: newLink.name.trim(),
        href: newLink.href.startsWith('http') ? newLink.href : `https://${newLink.href}`,
        color: newLink.color,
        icon: newLink.icon,
      });
      setNewLink({ name: '', href: '', color: defaultColor, icon: 'website' });
      setShowAddModal(false);
    }
  };

  const handleUpdateLink = () => {
    if (editingLink && editingLink.name.trim() && editingLink.href.trim()) {
      updateQuickLink(editingLink.id, {
        name: editingLink.name.trim(),
        href: editingLink.href.startsWith('http')
          ? editingLink.href
          : `https://${editingLink.href}`,
        color: editingLink.color,
        icon: editingLink.icon,
      });
      setEditingLink(null);
    }
  };

  const getIconEmoji = (iconValue: string) => {
    return ICON_OPTIONS.find((opt) => opt.value === iconValue)?.label.split(' ')[0] || '🌐';
  };

  // Filter links based on search query
  const filteredLinks = (config.quickLinks || []).filter(
    (link) =>
      link.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.href.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminPageLayout>
      <AdminHeader
        icon={<HeaderLinkIcon />}
        title="Quick Links"
        subtitle="Default institutional links shown on the dashboard"
      >
        <button
          onClick={() => setShowAddModal(true)}
          className="admin-btn admin-btn-primary text-xs sm:text-sm"
        >
          <PlusIcon />
          Add Link
        </button>
      </AdminHeader>

      {/* Search */}
      <div className="admin-search">
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
          placeholder="Search links..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Links Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {filteredLinks.map((link) => (
          <div key={link.id} className="admin-card">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-indigo-500/30 to-purple-500/30 flex items-center justify-center text-xl sm:text-2xl flex-shrink-0">
                {getIconEmoji(link.icon)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-medium text-sm sm:text-base truncate">
                  {link.name}
                </h4>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 text-xs sm:text-sm hover:text-indigo-300 flex items-center gap-1 truncate"
                >
                  <LinkIcon />
                  <span className="truncate">{link.href}</span>
                </a>
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className={`w-3 h-3 rounded-full ${COLOR_OPTIONS.find((c) => c.value === link.color)?.class || 'bg-blue-500'}`}
                  ></span>
                  <span className="text-indigo-400 text-xs">
                    {COLOR_OPTIONS.find((c) => c.value === link.color)?.label || 'Blue'}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1 sm:gap-2 flex-shrink-0">
                <button
                  onClick={() => setEditingLink({ ...link })}
                  className="admin-btn admin-btn-secondary text-xs sm:text-sm px-2 sm:px-3"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteQuickLink(link.id)}
                  className="admin-btn admin-btn-danger text-xs sm:text-sm px-2 sm:px-3"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredLinks.length === 0 && (
          <div className="col-span-full text-center py-8 sm:py-12 text-indigo-400 text-sm sm:text-base admin-card">
            {searchQuery
              ? 'No links match your search'
              : 'No quick links added. Click "Add Link" to create one.'}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="admin-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="admin-modal-title">Add Quick Link</h3>
            <div className="space-y-4">
              <div>
                <label className="admin-label">Link Name</label>
                <input
                  type="text"
                  className="admin-input"
                  placeholder="e.g., MIS Portal"
                  value={newLink.name}
                  onChange={(e) => setNewLink({ ...newLink, name: e.target.value })}
                />
              </div>
              <div>
                <label className="admin-label">URL</label>
                <input
                  type="url"
                  className="admin-input"
                  placeholder="https://example.com"
                  value={newLink.href}
                  onChange={(e) => setNewLink({ ...newLink, href: e.target.value })}
                />
              </div>
              <div>
                <label className="admin-label">Icon</label>
                <select
                  className="admin-select"
                  value={newLink.icon}
                  onChange={(e) => setNewLink({ ...newLink, icon: e.target.value })}
                >
                  {ICON_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="admin-label">Color</label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setNewLink({ ...newLink, color: color.value })}
                      className={`w-8 h-8 rounded-full ${color.class} ${
                        newLink.color === color.value
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900'
                          : ''
                      }`}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={handleAddLink} className="admin-btn admin-btn-primary flex-1">
                  Add Link
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
      {editingLink && (
        <div className="admin-modal-overlay" onClick={() => setEditingLink(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="admin-modal-title">Edit Quick Link</h3>
            <div className="space-y-4">
              <div>
                <label className="admin-label">Link Name</label>
                <input
                  type="text"
                  className="admin-input"
                  value={editingLink.name}
                  onChange={(e) => setEditingLink({ ...editingLink, name: e.target.value })}
                />
              </div>
              <div>
                <label className="admin-label">URL</label>
                <input
                  type="url"
                  className="admin-input"
                  value={editingLink.href}
                  onChange={(e) => setEditingLink({ ...editingLink, href: e.target.value })}
                />
              </div>
              <div>
                <label className="admin-label">Icon</label>
                <select
                  className="admin-select"
                  value={editingLink.icon}
                  onChange={(e) => setEditingLink({ ...editingLink, icon: e.target.value })}
                >
                  {ICON_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="admin-label">Color</label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setEditingLink({ ...editingLink, color: color.value })}
                      className={`w-8 h-8 rounded-full ${color.class} ${
                        editingLink.color === color.value
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900'
                          : ''
                      }`}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={handleUpdateLink} className="admin-btn admin-btn-success flex-1">
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingLink(null)}
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

export default QuickLinksEditor;
