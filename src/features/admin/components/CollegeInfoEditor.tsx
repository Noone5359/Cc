import {
  uploadHeroImage,
  deleteHeroImage,
  isValidImageFile,
  isValidFileSize,
  MAX_HERO_IMAGE_SIZE,
} from '@services/storageService';
import React, { useState, useEffect, useRef } from 'react';

import { AdminConfig } from '../types';
import { AdminHeader, BuildingIcon } from './AdminIcons';
import AdminPageLayout from './AdminPageLayout';

interface Props {
  config: AdminConfig;
  updateCollegeInfo: (updates: Partial<AdminConfig['collegeInfo']>) => void;
  updateAppConstants: (updates: Partial<AdminConfig['appConstants']>) => void;
}

const CollegeInfoEditor: React.FC<Props> = ({ config, updateCollegeInfo, updateAppConstants }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local state for editing (only saved on explicit save)
  const [localCollegeInfo, setLocalCollegeInfo] = useState(config.collegeInfo);
  const [localAppConstants, setLocalAppConstants] = useState(config.appConstants);

  // Sync local state when config changes from external source
  useEffect(() => {
    if (!isEditing) {
      setLocalCollegeInfo(config.collegeInfo);
      setLocalAppConstants(config.appConstants);
    }
  }, [config.collegeInfo, config.appConstants, isEditing]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save all changes at once
      updateCollegeInfo(localCollegeInfo);
      updateAppConstants(localAppConstants);

      // Wait a bit for the save to complete
      await new Promise((resolve) => setTimeout(resolve, 500));

      setIsEditing(false);
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to original values
    setLocalCollegeInfo(config.collegeInfo);
    setLocalAppConstants(config.appConstants);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  // Display values (from local state when editing, from config when viewing)
  const collegeInfo = isEditing ? localCollegeInfo : config.collegeInfo;
  const appConstants = isEditing ? localAppConstants : config.appConstants;

  return (
    <AdminPageLayout>
      {/* Header with Edit/Save/Cancel buttons */}
      <AdminHeader
        icon={<BuildingIcon />}
        title="College Information"
        subtitle={
          isEditing
            ? 'Make your changes and click Save to apply them'
            : 'Click Edit to modify college information'
        }
      >
        <div className="flex items-center gap-3">
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="admin-btn admin-btn-secondary disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="admin-btn admin-btn-success flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Save Changes
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              onClick={handleEdit}
              className="admin-btn admin-btn-primary flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit
            </button>
          )}
        </div>
      </AdminHeader>

      {/* College Names Section */}
      <div className={`admin-card ${isEditing ? 'border-blue-500/40' : ''}`}>
        <h3 className="text-lg font-semibold text-white mb-4">College Names</h3>
        <div className="space-y-4">
          <div>
            <label className="admin-label">Full Name</label>
            <input
              type="text"
              disabled={!isEditing}
              className={`admin-input ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
              value={collegeInfo.name.full}
              onChange={(e) =>
                setLocalCollegeInfo((prev) => ({
                  ...prev,
                  name: { ...prev.name, full: e.target.value },
                }))
              }
            />
          </div>
          <div>
            <label className="admin-label">Short Name</label>
            <input
              type="text"
              disabled={!isEditing}
              className={`admin-input ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
              value={collegeInfo.name.short}
              onChange={(e) =>
                setLocalCollegeInfo((prev) => ({
                  ...prev,
                  name: { ...prev.name, short: e.target.value },
                }))
              }
            />
          </div>
          <div>
            <label className="admin-label">Abbreviation</label>
            <input
              type="text"
              disabled={!isEditing}
              className={`admin-input ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
              value={collegeInfo.name.abbreviation}
              onChange={(e) =>
                setLocalCollegeInfo((prev) => ({
                  ...prev,
                  name: { ...prev.name, abbreviation: e.target.value },
                }))
              }
            />
          </div>
        </div>
      </div>

      {/* Email Settings Section */}
      <div className={`admin-card ${isEditing ? 'border-blue-500/40' : ''}`}>
        <h3 className="text-lg font-semibold text-white mb-4">Email Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="admin-label">Email Domain</label>
            <input
              type="text"
              disabled={!isEditing}
              className={`admin-input ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
              value={collegeInfo.email.domain}
              onChange={(e) =>
                setLocalCollegeInfo((prev) => ({
                  ...prev,
                  email: { ...prev.email, domain: e.target.value },
                }))
              }
            />
          </div>
          <div>
            <label className="admin-label">Allowed Domain (for login)</label>
            <input
              type="text"
              disabled={!isEditing}
              className={`admin-input ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
              value={collegeInfo.email.allowedDomain}
              onChange={(e) =>
                setLocalCollegeInfo((prev) => ({
                  ...prev,
                  email: { ...prev.email, allowedDomain: e.target.value },
                }))
              }
              placeholder="@example.edu"
            />
          </div>
        </div>
      </div>

      {/* Website Section */}
      <div className={`admin-card ${isEditing ? 'border-blue-500/40' : ''}`}>
        <h3 className="text-lg font-semibold text-white mb-4">Website</h3>
        <div className="space-y-4">
          <div>
            <label className="admin-label">Website URL</label>
            <input
              type="url"
              disabled={!isEditing}
              className={`admin-input ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
              value={collegeInfo.website.url}
              onChange={(e) =>
                setLocalCollegeInfo((prev) => ({
                  ...prev,
                  website: { ...prev.website, url: e.target.value },
                }))
              }
            />
          </div>
          <div>
            <label className="admin-label">Website Name</label>
            <input
              type="text"
              disabled={!isEditing}
              className={`admin-input ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
              value={collegeInfo.website.name}
              onChange={(e) =>
                setLocalCollegeInfo((prev) => ({
                  ...prev,
                  website: { ...prev.website, name: e.target.value },
                }))
              }
            />
          </div>
        </div>
      </div>

      {/* Location Section */}
      <div className={`admin-card ${isEditing ? 'border-blue-500/40' : ''}`}>
        <h3 className="text-lg font-semibold text-white mb-4">Location</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="admin-label">City</label>
            <input
              type="text"
              disabled={!isEditing}
              className={`admin-input ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
              value={collegeInfo.location.city}
              onChange={(e) =>
                setLocalCollegeInfo((prev) => ({
                  ...prev,
                  location: { ...prev.location, city: e.target.value },
                }))
              }
            />
          </div>
          <div>
            <label className="admin-label">State</label>
            <input
              type="text"
              disabled={!isEditing}
              className={`admin-input ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
              value={collegeInfo.location.state}
              onChange={(e) =>
                setLocalCollegeInfo((prev) => ({
                  ...prev,
                  location: { ...prev.location, state: e.target.value },
                }))
              }
            />
          </div>
          <div>
            <label className="admin-label">Country</label>
            <input
              type="text"
              disabled={!isEditing}
              className={`admin-input ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
              value={collegeInfo.location.country}
              onChange={(e) =>
                setLocalCollegeInfo((prev) => ({
                  ...prev,
                  location: { ...prev.location, country: e.target.value },
                }))
              }
            />
          </div>
        </div>
      </div>

      {/* Hero Image Section */}
      <div className={`admin-card ${isEditing ? 'border-blue-500/40' : ''}`}>
        <h3 className="text-lg font-semibold text-white mb-4">Login Page Hero Image</h3>
        <p className="text-sm text-slate-400 mb-4">
          This image is displayed as the background on the login page.
        </p>

        {/* Current Image Preview */}
        <div className="mb-4">
          <label className="admin-label mb-2">Current Image</label>
          <div className="relative w-full max-w-md aspect-video bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
            <img
              src={collegeInfo.heroImageUrl || '/iitism_banner_new.gif'}
              alt="Hero preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/iitism_banner_new.gif';
              }}
            />
            {!collegeInfo.heroImageUrl && (
              <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-xs text-white/80">
                Default Image
              </div>
            )}
          </div>
        </div>

        {/* Upload Controls */}
        {isEditing && (
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                setUploadError(null);

                if (!isValidImageFile(file)) {
                  setUploadError(
                    'Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.'
                  );
                  return;
                }

                if (!isValidFileSize(file)) {
                  setUploadError(
                    `File too large. Maximum size is ${MAX_HERO_IMAGE_SIZE / (1024 * 1024)}MB.`
                  );
                  return;
                }

                try {
                  setUploadProgress(0);
                  const url = await uploadHeroImage(file, setUploadProgress);
                  setLocalCollegeInfo((prev) => ({ ...prev, heroImageUrl: url }));
                  setUploadProgress(null);
                } catch (error) {
                  console.error('Upload failed:', error);
                  setUploadError('Failed to upload image. Please try again.');
                  setUploadProgress(null);
                }

                // Reset input
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
            />

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadProgress !== null}
                className="admin-btn admin-btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                {uploadProgress !== null ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Uploading... {uploadProgress}%
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    Upload New Image
                  </>
                )}
              </button>

              {collegeInfo.heroImageUrl && (
                <button
                  type="button"
                  onClick={async () => {
                    if (
                      window.confirm(
                        'Are you sure you want to remove the custom hero image? The default image will be used.'
                      )
                    ) {
                      try {
                        if (collegeInfo.heroImageUrl) {
                          await deleteHeroImage(collegeInfo.heroImageUrl);
                        }
                        setLocalCollegeInfo((prev) => ({ ...prev, heroImageUrl: undefined }));
                      } catch (error) {
                        console.error('Failed to delete image:', error);
                        // Still remove from config even if storage delete fails
                        setLocalCollegeInfo((prev) => ({ ...prev, heroImageUrl: undefined }));
                      }
                    }
                  }}
                  className="admin-btn admin-btn-danger flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Remove Custom Image
                </button>
              )}
            </div>

            {uploadError && (
              <div className="text-red-400 text-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {uploadError}
              </div>
            )}

            <p className="text-xs text-slate-500">
              Accepted formats: JPEG, PNG, GIF, WebP. Maximum file size: 5MB.
            </p>
          </div>
        )}
      </div>

      {/* App Constants Section */}
      <div className={`admin-card ${isEditing ? 'border-blue-500/40' : ''}`}>
        <h3 className="text-lg font-semibold text-white mb-4">App Constants</h3>

        {/* Greeting Times */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-slate-400 mb-3">Greeting Times (24h format)</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Morning Ends At</label>
              <input
                type="number"
                min="0"
                max="23"
                disabled={!isEditing}
                className={`admin-input text-sm ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
                value={appConstants.greetingTimes.morningEnd}
                onChange={(e) =>
                  setLocalAppConstants((prev) => ({
                    ...prev,
                    greetingTimes: {
                      ...prev.greetingTimes,
                      morningEnd: parseInt(e.target.value) || 12,
                    },
                  }))
                }
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Afternoon Ends At</label>
              <input
                type="number"
                min="0"
                max="23"
                disabled={!isEditing}
                className={`admin-input text-sm ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
                value={appConstants.greetingTimes.afternoonEnd}
                onChange={(e) =>
                  setLocalAppConstants((prev) => ({
                    ...prev,
                    greetingTimes: {
                      ...prev.greetingTimes,
                      afternoonEnd: parseInt(e.target.value) || 17,
                    },
                  }))
                }
              />
            </div>
          </div>
        </div>

        {/* Weather Location */}
        <div>
          <h4 className="text-sm font-medium text-slate-400 mb-3">Weather Location</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Latitude</label>
              <input
                type="number"
                step="0.0001"
                disabled={!isEditing}
                className={`admin-input text-sm ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
                value={appConstants.weather.lat}
                onChange={(e) =>
                  setLocalAppConstants((prev) => ({
                    ...prev,
                    weather: { ...prev.weather, lat: parseFloat(e.target.value) || 0 },
                  }))
                }
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Longitude</label>
              <input
                type="number"
                step="0.0001"
                disabled={!isEditing}
                className={`admin-input text-sm ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
                value={appConstants.weather.lon}
                onChange={(e) =>
                  setLocalAppConstants((prev) => ({
                    ...prev,
                    weather: { ...prev.weather, lon: parseFloat(e.target.value) || 0 },
                  }))
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* Edit Mode Indicator */}
      {isEditing && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-full shadow-lg shadow-blue-500/30 flex items-center gap-3 z-50">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span className="font-medium">Editing Mode</span>
          <span className="text-blue-200">|</span>
          <span className="text-sm text-blue-100">Remember to save your changes</span>
        </div>
      )}
    </AdminPageLayout>
  );
};

export default CollegeInfoEditor;
