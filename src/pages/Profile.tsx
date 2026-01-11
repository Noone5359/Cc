import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BRANCH_OPTIONS } from '@config/branches';
import { COURSE_OPTIONS } from '@config/credits';
import { HOSTEL_OPTIONS } from '@config/hostels';
import { useAppConfig } from '@contexts/AppConfigContext';
import { useCalendar } from '@contexts/CalendarContext';
import { useCampusMap } from '@contexts/CampusMapContext';
import { useForms } from '@contexts/FormsContext';
import { useUser } from '@contexts/UserContext';
import { useAuth } from '@features/auth/hooks/useAuth';
import { db } from '@lib/firebase';
import 'firebase/firestore';
import { X, Download, Calendar, Bell, MapPin, Check, Edit2, Globe, RotateCcw } from 'lucide-react';

import { User, ActivityItem, Form, CampusLocation, CalendarEvent } from '@/types';

const formatTimeAgo = (timestamp: { seconds: number; nanoseconds: number } | null) => {
  if (!timestamp) return '...';
  const now = new Date();
  const activityDate = new Date(timestamp.seconds * 1000);
  const diffSeconds = Math.floor((now.getTime() - activityDate.getTime()) / 1000);

  if (diffSeconds < 60) return 'just now';
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return activityDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const Profile: React.FC = () => {
  const { user, updateUser, uploadProfilePicture, loading } = useUser();
  const { currentUser } = useAuth();
  const { userFormsData, addRecentDownload } = useForms();
  const { savedPlaces, locations } = useCampusMap();
  const { reminderPreferences, calendarData, getEventKey } = useCalendar();
  const { config: appConfig } = useAppConfig();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({});
  const [activeTab, setActiveTab] = useState<'overview' | 'activity'>('overview');
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  const [imageError, setImageError] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isImageExpanded, setIsImageExpanded] = useState(false);
  const [showModalContent, setShowModalContent] = useState(false);
  const [modalData, setModalData] = useState<{
    title: string;
    data: any[];
    type: 'forms' | 'events' | 'reminders' | 'places';
    link: string;
    linkText: string;
  } | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Frame options
  const FRAME_OPTIONS = [
    { id: 'none', name: 'None', class: 'ring-4 ring-white/50 rounded-full' },
    {
      id: 'gradient-blue',
      name: 'Ocean',
      class:
        'p-1 bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 rounded-full',
    },
    {
      id: 'gradient-purple',
      name: 'Nebula',
      class:
        'p-1 bg-gradient-to-br from-fuchsia-500 via-purple-600 to-indigo-500 shadow-lg shadow-purple-500/30 rounded-full',
    },
    {
      id: 'gradient-gold',
      name: 'Gold',
      class:
        'p-1 bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-700 shadow-lg shadow-yellow-500/40 border border-yellow-300 rounded-full',
    },
    {
      id: 'neon-green',
      name: 'Cyber',
      class: 'ring-4 ring-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.6)] bg-black rounded-full',
    },
    {
      id: 'royal',
      name: 'Royal',
      class:
        'p-1 bg-gradient-to-tr from-amber-700 via-yellow-500 to-amber-700 shadow-xl border border-yellow-600 rounded-full',
    },
    {
      id: 'holographic',
      name: 'Holo',
      class:
        'p-1 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 animate-gradient-x shadow-lg rounded-full',
    },
    {
      id: 'neon-blue',
      name: 'Tron',
      class:
        'ring-4 ring-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.6)] bg-slate-900 rounded-full',
    },
    {
      id: 'minimal',
      name: 'Minimal',
      class: 'ring-1 ring-white/80 offset-4 offset-black rounded-full',
    },
  ];

  // Banner Gradients

  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [activitySearch, setActivitySearch] = useState('');
  const [activitySortBy, setActivitySortBy] = useState<'recent' | 'oldest' | 'type'>('recent');
  const [activityFilterType, setActivityFilterType] = useState<string>('all');

  // Bio, Social Links, and Goals state
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState('');
  const [isEditingSocial, setIsEditingSocial] = useState(false);
  const [socialLinks, setSocialLinks] = useState({
    github: '',
    linkedin: '',
    instagram: '',
    twitter: '',
    website: '',
  });

  // Calculate stats for overview - filter to only count favorites that still exist
  const existingFormNumbers = new Set((appConfig?.forms || []).map((f: Form) => f.formNumber));
  const savedFormsCount = (userFormsData?.favorites || []).filter((formNumber) =>
    existingFormNumbers.has(formNumber)
  ).length;
  const userAddedEventsCount =
    calendarData?.events.filter((e) => e.userId === currentUser?.uid).length ?? 0;
  const remindersCount = reminderPreferences?.length ?? 0;
  // Filter saved places to only count locations that still exist
  const existingLocationIds = new Set(
    (appConfig?.campusMap || []).map((loc: CampusLocation) => loc.id)
  );
  const savedPlacesCount = (savedPlaces || []).filter((locId) =>
    existingLocationIds.has(locId)
  ).length;

  // Get unique activity types for filter
  const activityTypes = ['all', ...Array.from(new Set(activity.map((item) => item.type)))];

  // Filter, search, and sort activities
  const filteredAndSortedActivities = React.useMemo(() => {
    let filtered = [...activity];

    // Apply type filter
    if (activityFilterType !== 'all') {
      filtered = filtered.filter((item) => item.type === activityFilterType);
    }

    // Apply search
    if (activitySearch.trim()) {
      const searchLower = activitySearch.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(searchLower) ||
          item.description.toLowerCase().includes(searchLower) ||
          item.type.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    if (activitySortBy === 'recent') {
      filtered.sort((a, b) => {
        const timeA = a.timestamp?.seconds || 0;
        const timeB = b.timestamp?.seconds || 0;
        return timeB - timeA;
      });
    } else if (activitySortBy === 'oldest') {
      filtered.sort((a, b) => {
        const timeA = a.timestamp?.seconds || 0;
        const timeB = b.timestamp?.seconds || 0;
        return timeA - timeB;
      });
    } else if (activitySortBy === 'type') {
      filtered.sort((a, b) => a.type.localeCompare(b.type));
    }

    return filtered;
  }, [activity, activityFilterType, activitySearch, activitySortBy]);

  useEffect(() => {
    if (!currentUser) {
      setActivityLoading(false);
      return;
    }

    const activityQuery = db
      .collection('users')
      .doc(currentUser.uid)
      .collection('activity')
      .orderBy('timestamp', 'desc')
      .limit(30);

    const unsubscribe = activityQuery.onSnapshot(
      (snapshot) => {
        const activities = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            }) as ActivityItem
        );
        setActivity(activities);
        setActivityLoading(false);
      },
      (error: any) => {
        console.error('Error fetching activity: ', error);
        if (error.code === 'permission-denied') {
          console.error(
            'Firestore Security Rules Error: The current user does not have permission to read their own activity log. ' +
              "Please ensure your Firestore rules allow reads on the 'users/{userId}/activity/{activityId}' path for authenticated users."
          );
        }
        setActivityLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (user) {
      setFormData(user);
      setBioText(user.bio || '');
      setSocialLinks({
        github: user.socialLinks?.github || '',
        linkedin: user.socialLinks?.linkedin || '',
        instagram: user.socialLinks?.instagram || '',
        twitter: user.socialLinks?.twitter || '',
        website: user.socialLinks?.website || '',
      });
    }
  }, [user]);

  useEffect(() => {
    if (user?.profilePicture) {
      setImageError(false);
    }
  }, [user?.profilePicture]);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      setFormData((prev) => ({ ...prev, [name]: value.replace(/\D/g, '') }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    try {
      await updateUser(formData);
      setIsEditing(false);
      showNotification('Profile updated successfully!', 'success');
    } catch (error) {
      showNotification('Failed to update profile', 'error');
    }
  };

  // Bio handlers
  const handleSaveBio = async () => {
    try {
      await updateUser({ bio: bioText });
      setIsEditingBio(false);
      showNotification('Bio updated successfully!', 'success');
    } catch (error) {
      showNotification('Failed to update bio', 'error');
    }
  };

  // Social links handlers
  const handleSaveSocialLinks = async () => {
    try {
      await updateUser({ socialLinks });
      setIsEditingSocial(false);
      showNotification('Social links updated!', 'success');
    } catch (error) {
      showNotification('Failed to update social links', 'error');
    }
  };

  // Image compression function
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                reject(new Error('Image compression failed'));
              }
            },
            'image/jpeg',
            0.85
          );
        };
        img.onerror = () => reject(new Error('Failed to load image'));
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
    });
  };

  const processAndUploadImage = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      showNotification('Please upload an image file', 'error');
      return;
    }

    // Validate file size (max 10MB before compression)
    if (file.size > 10 * 1024 * 1024) {
      showNotification('Image too large. Maximum size is 10MB', 'error');
      return;
    }

    setIsUploading(true);
    showNotification('Processing image...', 'success');

    try {
      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setPreviewImage(previewUrl);

      // Compress image
      const compressedFile = await compressImage(file);
      showNotification('Uploading...', 'success');

      // Upload
      await uploadProfilePicture(compressedFile);
      showNotification('Profile picture updated! ✨', 'success');
      setPreviewImage(null);
    } catch (error: unknown) {
      console.error(error);
      showNotification(
        error instanceof Error ? error.message : 'Upload failed. Please try again.',
        'error'
      );
      setPreviewImage(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processAndUploadImage(file);
    }
    // Reset input
    if (e.target) {
      e.target.value = '';
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (isEditing && !isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (!isEditing || isUploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processAndUploadImage(file);
    }
  };

  const getFrameClass = (frameId?: string) => {
    const frame = FRAME_OPTIONS.find((f) => f.id === frameId);
    return frame ? frame.class : 'ring-4 ring-white/50';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const openModal = () => {
    if (user?.profilePicture && !imageError) {
      setIsImageExpanded(true);
      setTimeout(() => setShowModalContent(true), 50); // a tiny delay to ensure transition works on mount
    }
  };

  const closeModal = () => {
    setShowModalContent(false);
    setTimeout(() => {
      setIsImageExpanded(false);
    }, 300); // should match the transition duration
  };

  const handlePictureClick = () => {
    if (isEditing) {
      if (!isUploading) {
        fileInputRef.current?.click();
      }
    } else {
      openModal();
    }
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-transparent border-primary rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 lg:p-6 pb-16 mb-12">
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 animate-slideIn">
          <div
            className={`px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3 ${
              notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {notification.type === 'success' ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
            <span className="font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Customization Toolbar (Edit Mode) */}
      {isEditing && (
        <div className="flex flex-col md:flex-row justify-end gap-4 mb-4 animate-fadeIn">
          {/* Banner Controls */}
          <div className="bg-white dark:bg-slate-800 rounded-full p-2 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-3 pr-5">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium ml-3 uppercase tracking-wider">
              Banner
            </span>

            <div className="flex items-center gap-2 ml-2 flex-wrap max-w-[200px] md:max-w-none">
              {[
                {
                  id: 'gradient-midnight',
                  class:
                    'bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-purple-900 to-slate-900',
                },
                {
                  id: 'gradient-sunset',
                  class:
                    'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-200 via-orange-500 to-rose-500',
                },
                {
                  id: 'gradient-forest',
                  class: 'bg-gradient-to-br from-emerald-900 via-green-800 to-teal-900',
                },
                {
                  id: 'gradient-ocean',
                  class: 'bg-gradient-to-r from-blue-700 via-blue-800 to-gray-900',
                },
                {
                  id: 'gradient-northern',
                  class: 'bg-gradient-to-r from-teal-400 via-blue-500 to-purple-600',
                },
                {
                  id: 'gradient-deepspace',
                  class: 'bg-gradient-to-b from-black via-gray-900 to-slate-900',
                },
                {
                  id: 'gradient-crimson',
                  class: 'bg-gradient-to-br from-red-900 via-rose-800 to-pink-900',
                },
                {
                  id: 'gradient-golden',
                  class: 'bg-gradient-to-r from-amber-500 via-orange-400 to-yellow-500',
                },
                {
                  id: 'gradient-synthwave',
                  class: 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500',
                },
                {
                  id: 'gradient-emerald',
                  class: 'bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600',
                },
              ].map((gradient) => (
                <button
                  key={gradient.id}
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      bannerGradient: gradient.class,
                    }));
                  }}
                  className={`w-8 h-8 rounded-full ${gradient.class} ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 transition-all ${
                    formData.bannerGradient === gradient.class ||
                    (!formData.bannerGradient && gradient.id === 'gradient-midnight') || // default check logic could be improved but this is a start
                    (!formData.bannerGradient && user.bannerGradient === gradient.class)
                      ? 'ring-primary scale-110'
                      : 'ring-transparent opacity-70 hover:opacity-100 hover:scale-105'
                  }`}
                />
              ))}
            </div>

            {(formData.bannerGradient || user.bannerGradient) && (
              <>
                <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                <button
                  onClick={async () => {
                    setFormData((prev) => ({ ...prev, bannerGradient: '' }));
                    await updateUser({ bannerGradient: '' });
                  }}
                  className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 rounded-full transition-colors"
                  title="Reset Banner"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* Frame Controls */}
          <div className="bg-white dark:bg-slate-800 rounded-full p-2 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-3 pr-5">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium ml-3 uppercase tracking-wider">
              Frame
            </span>
            <div className="flex items-center gap-2 flex-wrap max-w-[200px] md:max-w-none">
              {FRAME_OPTIONS.map((frame) => (
                <button
                  key={frame.id}
                  onClick={() => setFormData((prev) => ({ ...prev, profileFrame: frame.id }))}
                  className={`w-8 h-8 rounded-full transition-all ${frame.class} ${
                    (formData.profileFrame || user.profileFrame || 'none') === frame.id
                      ? 'ring-2 ring-primary ring-offset-2 ring-offset-white dark:ring-offset-slate-900 scale-110'
                      : 'opacity-70 hover:opacity-100 hover:scale-105'
                  }`}
                  title={frame.name}
                >
                  <div className="w-full h-full rounded-full bg-white/20"></div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="relative rounded-xl shadow-lg overflow-hidden group/banner">
        {/* Banner Image */}
        <div
          className={`absolute inset-0 ${
            formData.bannerGradient ||
            user.bannerGradient ||
            'bg-gradient-to-r from-primary to-secondary'
          }`}
        >
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]"></div>

          {/* Default Pattern if no banner */}
          {!(user.bannerGradient || formData.bannerGradient) && (
            <div className="absolute inset-0 opacity-10">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                  backgroundSize: '1.25rem 1.25rem',
                }}
              ></div>
            </div>
          )}
        </div>

        {/* Banner Actions (Edit Mode) */}
        {/* Banner Actions (Edit Mode) - REMOVED REDUNDANT BUTTONS */}

        <div className="p-8 relative z-10">
          <div className="relative flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Profile Picture with Drag & Drop */}
            <div
              className={`relative group ${isEditing ? 'cursor-pointer' : user.profilePicture && !imageError ? 'cursor-zoom-in' : 'cursor-default'}`}
              onClick={handlePictureClick}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {/* Main Profile Image */}
              {previewImage || (user.profilePicture && !imageError) ? (
                <div className={getFrameClass(formData.profileFrame || user.profileFrame)}>
                  <img
                    className={`h-32 w-32 rounded-full object-cover transition-all duration-300 ${
                      isDragging ? 'scale-105 opacity-80' : ''
                    } ${isUploading ? 'opacity-50' : 'opacity-100'}`}
                    src={previewImage || user.profilePicture}
                    alt="Profile"
                    onError={() => setImageError(true)}
                  />
                </div>
              ) : (
                <div
                  className={`h-32 w-32 rounded-full bg-white text-primary flex items-center justify-center text-4xl font-bold transition-all duration-300 ${getFrameClass(formData.profileFrame || user.profileFrame)} ${
                    isDragging ? 'scale-105' : ''
                  }`}
                >
                  {getInitials(user.name)}
                </div>
              )}

              {/* Hidden File Input */}
              {isEditing && (
                <input
                  type="file"
                  ref={fileInputRef}
                  hidden
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                />
              )}

              {/* Hover Overlay with Upload Icon */}
              {isEditing && (
                <div
                  className={`absolute inset-0 rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
                    isDragging
                      ? 'bg-blue-500/80 opacity-100'
                      : 'bg-black/50 opacity-0 group-hover:opacity-100'
                  }`}
                >
                  {isUploading ? (
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 border-4 border-t-transparent border-white rounded-full animate-spin mb-2"></div>
                      <span className="text-white text-xs font-medium">Uploading...</span>
                    </div>
                  ) : isDragging ? (
                    <div className="flex flex-col items-center text-white">
                      <svg
                        className="w-10 h-10 mb-1 animate-bounce"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <span className="text-xs font-bold">Drop here!</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-white">
                      <svg
                        className="w-10 h-10 mb-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span className="text-xs font-medium">Click or Drop</span>
                    </div>
                  )}
                </div>
              )}

              {/* Upload Progress Indicator */}
              {isUploading && (
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                  <div className="bg-white/90 backdrop-blur-sm text-primary text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
                    Processing...
                  </div>
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left text-white">
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleInputChange}
                  className="text-3xl font-bold bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg px-4 py-2 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 w-full mb-2"
                  placeholder="Your Name"
                />
              ) : (
                <h1 className="text-3xl md:text-4xl font-bold mb-2">{user.name}</h1>
              )}

              {isEditing ? (
                <select
                  name="branch"
                  value={formData.branch || ''}
                  onChange={handleInputChange}
                  className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/50 w-full"
                >
                  <option value="" className="text-slate-800">
                    Select a branch...
                  </option>
                  {(appConfig?.branches || BRANCH_OPTIONS).map((branch) => (
                    <option key={branch} value={branch} className="text-slate-800">
                      {branch}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-lg text-white/90 mb-4">{user.branch || 'Branch not set'}</p>
              )}

              <div className="flex flex-wrap gap-3 justify-center md:justify-start mt-4">
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                  <span className="text-sm font-medium">{user.hostel || 'Not set'}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                  </svg>
                  <span className="text-sm font-medium">{user.admissionNumber}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={isUploading}
                    className={`px-6 py-2.5 rounded-lg font-medium transition-all shadow-lg flex items-center gap-2 ${
                      isUploading
                        ? 'bg-white/50 text-primary/50 cursor-not-allowed'
                        : 'bg-white text-primary hover:bg-white/90'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Save Changes
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setFormData(user);
                    }}
                    className="px-6 py-2.5 bg-white/20 backdrop-blur-sm text-white border border-white/30 rounded-lg font-medium hover:bg-white/30 transition-all"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-2.5 bg-white text-primary rounded-lg font-medium hover:bg-white/90 transition-all shadow-lg flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white dark:bg-dark-card rounded-xl shadow-lg overflow-hidden">
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 px-6 py-4 font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'overview'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            Overview
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`flex-1 px-6 py-4 font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'activity'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Activity
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information Card */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-900 dark:text-blue-100">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Personal Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-blue-700 dark:text-blue-300">
                        Email Address
                      </label>
                      {isEditing ? (
                        <input
                          type="email"
                          name="email"
                          value={formData.email || ''}
                          onChange={handleInputChange}
                          className="w-full mt-1 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      ) : (
                        <p className="text-sm text-slate-800 dark:text-white mt-1 flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                          {user.email}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-medium text-blue-700 dark:text-blue-300">
                        Phone Number
                      </label>
                      {isEditing ? (
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone || ''}
                          onChange={handleInputChange}
                          className="w-full mt-1 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Enter phone number"
                          maxLength={15}
                        />
                      ) : (
                        <p className="text-sm text-slate-800 dark:text-white mt-1 flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            />
                          </svg>
                          {user.phone || 'Not set'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Academic Information Card */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-purple-900 dark:text-purple-100">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                    Academic Details
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-purple-700 dark:text-purple-300">
                        Admission Number
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="admissionNumber"
                          value={formData.admissionNumber || ''}
                          onChange={handleInputChange}
                          className="w-full mt-1 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      ) : (
                        <p className="text-sm font-mono text-slate-800 dark:text-white mt-1 flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-purple-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          {user.admissionNumber}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-medium text-purple-700 dark:text-purple-300">
                        Hostel
                      </label>
                      {isEditing ? (
                        <select
                          name="hostel"
                          value={formData.hostel || ''}
                          onChange={handleInputChange}
                          className="w-full mt-1 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="">Select a hostel...</option>
                          {(appConfig?.hostels || HOSTEL_OPTIONS).map((hostel) => (
                            <option key={hostel} value={hostel}>
                              {hostel}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-sm text-slate-800 dark:text-white mt-1 flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-purple-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                            />
                          </svg>
                          {user.hostel || 'Not set'}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-medium text-purple-700 dark:text-purple-300">
                        Course Type
                      </label>
                      {isEditing ? (
                        <select
                          name="courseOption"
                          value={formData.courseOption || ''}
                          onChange={handleInputChange}
                          className="w-full mt-1 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="">Select course type...</option>
                          {COURSE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-sm text-slate-800 dark:text-white mt-1 flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-purple-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                            />
                          </svg>
                          {user.courseOption || 'Not set'}
                        </p>
                      )}
                      {!isEditing && user.courseOption && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {
                            COURSE_OPTIONS.find((opt) => opt.value === user.courseOption)
                              ?.description
                          }
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <button
                  onClick={() => {
                    const configForms = appConfig?.forms || [];
                    const favoriteForms = configForms.filter((form: Form) =>
                      userFormsData?.favorites?.includes(form.formNumber)
                    );
                    setModalData({
                      title: 'Saved Forms',
                      data: favoriteForms,
                      type: 'forms',
                      link: '/college-forms',
                      linkText: 'Forms',
                    });
                  }}
                  className="w-full text-left group relative overflow-hidden bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-4 md:p-5 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-105 active:scale-95"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10 flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-xs md:text-sm font-medium mb-1">
                        Saved Forms
                      </p>
                      <p className="text-2xl md:text-3xl font-black group-hover:scale-110 transition-transform origin-left">
                        {savedFormsCount}
                      </p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm p-2 md:p-3 rounded-xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                      <svg
                        className="w-6 h-6 md:w-8 md:h-8"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    const userEvents =
                      calendarData?.events.filter((e) => e.userId === currentUser?.uid) ?? [];
                    setModalData({
                      title: 'Your Events',
                      data: userEvents,
                      type: 'events',
                      link: '/academic-calendar',
                      linkText: 'Calendar',
                    });
                  }}
                  className="w-full text-left group relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-4 md:p-5 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-105 active:scale-95"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10 flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-xs md:text-sm font-medium mb-1">Events</p>
                      <p className="text-2xl md:text-3xl font-black group-hover:scale-110 transition-transform origin-left">
                        {userAddedEventsCount}
                      </p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm p-2 md:p-3 rounded-xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                      <svg
                        className="w-6 h-6 md:w-8 md:h-8"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    const reminderEvents =
                      calendarData?.events.filter((event) =>
                        reminderPreferences.includes(getEventKey(event))
                      ) ?? [];
                    setModalData({
                      title: 'Active Reminders',
                      data: reminderEvents,
                      type: 'reminders',
                      link: '/academic-calendar',
                      linkText: 'Calendar',
                    });
                  }}
                  className="w-full text-left group relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-4 md:p-5 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-105 active:scale-95"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10 flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-xs md:text-sm font-medium mb-1">
                        Reminders
                      </p>
                      <p className="text-2xl md:text-3xl font-black group-hover:scale-110 transition-transform origin-left">
                        {remindersCount}
                      </p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm p-2 md:p-3 rounded-xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                      <svg
                        className="w-6 h-6 md:w-8 md:h-8"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                        />
                      </svg>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    const userSavedPlaces = locations.filter((loc) => savedPlaces.includes(loc.id));
                    setModalData({
                      title: 'Saved Places',
                      data: userSavedPlaces,
                      type: 'places',
                      link: '/campus-map',
                      linkText: 'Map',
                    });
                  }}
                  className="w-full text-left group relative overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl p-4 md:p-5 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-105 active:scale-95"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10 flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-xs md:text-sm font-medium mb-1">
                        Saved Places
                      </p>
                      <p className="text-2xl md:text-3xl font-black group-hover:scale-110 transition-transform origin-left">
                        {savedPlacesCount}
                      </p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm p-2 md:p-3 rounded-xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                      <svg
                        className="w-6 h-6 md:w-8 md:h-8"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                  </div>
                </button>
              </div>

              {/* Bio Section */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-700/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    About Me
                  </h3>
                  {!isEditingBio && (
                    <button
                      onClick={() => setIsEditingBio(true)}
                      className="p-2 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {isEditingBio ? (
                  <div className="space-y-3">
                    <textarea
                      value={bioText}
                      onChange={(e) => setBioText(e.target.value)}
                      placeholder="Tell us about yourself..."
                      className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      rows={4}
                      maxLength={500}
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">{bioText.length}/500</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setIsEditingBio(false);
                            setBioText(user?.bio || '');
                          }}
                          className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveBio}
                          className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-1"
                        >
                          <Check className="w-4 h-4" />
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                    {user?.bio || 'No bio added yet. Click edit to add information about yourself.'}
                  </p>
                )}
              </div>

              {/* Social Links */}
              <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20 rounded-xl p-6 border border-cyan-200 dark:border-cyan-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-cyan-900 dark:text-cyan-100 flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    Social Links
                  </h3>
                  <button
                    onClick={() => setIsEditingSocial(!isEditingSocial)}
                    className="px-3 py-1.5 text-sm font-medium bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
                  >
                    {isEditingSocial ? 'Cancel' : 'Edit'}
                  </button>
                </div>

                {isEditingSocial ? (
                  <div className="space-y-3">
                    {Object.entries(socialLinks).map(([platform, url]) => (
                      <div key={platform}>
                        <label className="block text-xs font-medium text-cyan-700 dark:text-cyan-300 mb-1 capitalize">
                          {platform}
                        </label>
                        <input
                          type="url"
                          value={url}
                          onChange={(e) =>
                            setSocialLinks({ ...socialLinks, [platform]: e.target.value })
                          }
                          placeholder={`https://...`}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                        />
                      </div>
                    ))}
                    <button
                      onClick={handleSaveSocialLinks}
                      className="w-full px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors font-medium text-sm mt-2"
                    >
                      Save Links
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(socialLinks).map(([platform, url]) => {
                      if (!url) return null;

                      const getSocialIcon = (platformName: string) => {
                        switch (platformName) {
                          case 'github':
                            return (
                              <svg
                                className="w-5 h-5 flex-shrink-0 text-gray-800 dark:text-gray-200"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                              </svg>
                            );
                          case 'linkedin':
                            return (
                              <svg
                                className="w-5 h-5 flex-shrink-0 text-blue-600 dark:text-blue-400"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                              </svg>
                            );
                          case 'instagram':
                            return (
                              <svg
                                className="w-5 h-5 flex-shrink-0 text-pink-600 dark:text-pink-400"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                              </svg>
                            );
                          case 'twitter':
                            return (
                              <svg
                                className="w-5 h-5 flex-shrink-0 text-slate-800 dark:text-slate-200"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                              </svg>
                            );
                          case 'website':
                          default:
                            return (
                              <Globe className="w-5 h-5 flex-shrink-0 text-cyan-600 dark:text-cyan-400" />
                            );
                        }
                      };

                      return (
                        <a
                          key={platform}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white dark:bg-slate-800 rounded-lg hover:shadow-md transition-all group overflow-hidden min-w-0"
                        >
                          <div className="group-hover:scale-110 transition-transform flex-shrink-0">
                            {getSocialIcon(platform)}
                          </div>
                          <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-white capitalize truncate">
                            {platform}
                          </span>
                        </a>
                      );
                    })}
                    {!Object.values(socialLinks).some((url) => url) && (
                      <p className="col-span-2 text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                        No social links added yet
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-4">
              <div className="flex flex-col gap-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Recent Activity</h3>
                </div>

                {/* Search, Filter, and Sort Controls */}
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 space-y-3">
                  {/* Search Bar */}
                  <div className="relative">
                    <input
                      type="text"
                      value={activitySearch}
                      onChange={(e) => setActivitySearch(e.target.value)}
                      placeholder="Search activities..."
                      className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                    />
                    <svg
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    {activitySearch && (
                      <button
                        onClick={() => setActivitySearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Filter and Sort Row */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    {/* Filter by Type */}
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Filter by Type
                      </label>
                      <select
                        value={activityFilterType}
                        onChange={(e) => setActivityFilterType(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-sm"
                      >
                        {activityTypes.map((type: string) => (
                          <option key={type} value={type}>
                            {type === 'all'
                              ? 'All Types'
                              : type.charAt(0).toUpperCase() + type.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Sort By */}
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Sort By
                      </label>
                      <select
                        value={activitySortBy}
                        onChange={(e) =>
                          setActivitySortBy(e.target.value as 'recent' | 'oldest' | 'type')
                        }
                        className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-sm"
                      >
                        <option value="recent">Most Recent</option>
                        <option value="oldest">Oldest First</option>
                        <option value="type">By Type</option>
                      </select>
                    </div>
                  </div>

                  {/* Results Count */}
                  {(activitySearch || activityFilterType !== 'all') && (
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {filteredAndSortedActivities.length}{' '}
                        {filteredAndSortedActivities.length === 1 ? 'result' : 'results'} found
                      </p>
                      {(activitySearch || activityFilterType !== 'all') && (
                        <button
                          onClick={() => {
                            setActivitySearch('');
                            setActivityFilterType('all');
                            setActivitySortBy('recent');
                          }}
                          className="text-sm text-primary hover:text-primary-dark font-medium flex items-center gap-1"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                          </svg>
                          Clear All
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {activityLoading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-t-transparent border-primary rounded-full animate-spin mx-auto"></div>
                  <p className="mt-2 text-sm text-slate-500">Loading activity...</p>
                </div>
              ) : filteredAndSortedActivities.length > 0 ? (
                <>
                  <div className="space-y-2">
                    {(showAllActivity
                      ? filteredAndSortedActivities
                      : filteredAndSortedActivities.slice(0, 10)
                    ).map((activityItem: ActivityItem) => {
                      const content = (
                        <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg hover:shadow-md transition-all w-full">
                          <div className="text-2xl pt-1">{activityItem.icon}</div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-900 dark:text-white">
                              {activityItem.title}
                            </h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {activityItem.description}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                              {formatTimeAgo(activityItem.timestamp)}
                            </p>
                          </div>
                          <span
                            className={`self-start px-2 py-1 text-xs font-medium rounded-full ${
                              activityItem.type === 'reminder'
                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                : activityItem.type === 'form'
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                  : activityItem.type === 'event'
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                    : activityItem.type === 'login' ||
                                        activityItem.type === 'logout'
                                      ? 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
                                      : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                            }`}
                          >
                            {activityItem.type}
                          </span>
                        </div>
                      );

                      return activityItem.link ? (
                        <Link to={activityItem.link} key={activityItem.id} className="block">
                          {content}
                        </Link>
                      ) : (
                        <div key={activityItem.id}>{content}</div>
                      );
                    })}
                  </div>

                  {filteredAndSortedActivities.length > 10 && (
                    <div className="text-center pt-4">
                      <button
                        onClick={() => setShowAllActivity(!showAllActivity)}
                        className="text-sm text-primary hover:text-primary-dark font-medium flex items-center gap-1 transition-colors mx-auto"
                      >
                        {showAllActivity ? (
                          <>
                            <span>Show Less</span>
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 15l7-7 7 7"
                              />
                            </svg>
                          </>
                        ) : (
                          <>
                            <span>View All ({filteredAndSortedActivities.length})</span>
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="text-slate-400 mb-3">
                    <svg
                      className="w-16 h-16 mx-auto"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M12 12h.01M12 12h.01M12 12h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">
                    {activitySearch || activityFilterType !== 'all'
                      ? 'No activities found matching your criteria'
                      : 'No recent activity to display'}
                  </p>
                  {(activitySearch || activityFilterType !== 'all') && (
                    <button
                      onClick={() => {
                        setActivitySearch('');
                        setActivityFilterType('all');
                      }}
                      className="mt-4 text-primary hover:text-primary-dark font-medium"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Expanded Image Modal */}
      {isImageExpanded && user.profilePicture && (
        <div
          className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out ${showModalContent ? 'opacity-100' : 'opacity-0'}`}
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
          aria-label="Expanded profile picture view"
        >
          {/* Full-screen blurred background of the same image */}
          <img
            src={user.profilePicture}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover filter blur-xl scale-110"
          />
          {/* Semi-transparent overlay for contrast */}
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>

          <button
            className="absolute top-6 right-6 text-white/70 hover:text-white hover:scale-110 transition-all z-[101]"
            aria-label="Close image view"
            onClick={closeModal}
          >
            <X size={32} />
          </button>
          <div
            className={`relative transition-all duration-300 ease-out ${showModalContent ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={user.profilePicture}
              alt="Expanded profile"
              className="w-[70vmin] h-[70vmin] max-w-lg max-h-lg object-cover rounded-full shadow-2xl ring-4 ring-white/20"
            />
          </div>
        </div>
      )}

      {/* Data Modal */}
      {modalData && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 transition-opacity duration-300"
          onClick={() => setModalData(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all max-h-[90vh] flex flex-col"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center flex-shrink-0">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {modalData.title}
              </h2>
              <button
                onClick={() => setModalData(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3 overflow-y-auto">
              {modalData.data.length === 0 ? (
                <p className="text-center text-slate-500 dark:text-slate-400 py-8">
                  No items to display.
                </p>
              ) : modalData.type === 'forms' ? (
                modalData.data.map((form: Form) => (
                  <div
                    key={form.formNumber}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                  >
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-white">{form.title}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Form No: {form.formNumber}
                      </p>
                    </div>
                    <a
                      href={form.downloadLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => addRecentDownload(form)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary-dark transition-colors"
                    >
                      <Download className="w-4 h-4" /> Download
                    </a>
                  </div>
                ))
              ) : modalData.type === 'events' ? (
                modalData.data.map((event: CalendarEvent) => (
                  <div
                    key={event.id}
                    className="flex items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                  >
                    <Calendar className="w-5 h-5 mr-3 text-primary" />
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-white">
                        {event.description}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {new Date(event.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : modalData.type === 'reminders' ? (
                modalData.data.map((event: CalendarEvent) => (
                  <div
                    key={getEventKey(event)}
                    className="flex items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                  >
                    <Bell className="w-5 h-5 mr-3 text-primary" />
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-white">
                        {event.description}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {new Date(event.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : modalData.type === 'places' ? (
                modalData.data.map((place: CampusLocation) => (
                  <div
                    key={place.id}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{place.icon}</span>
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-white">{place.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {place.category}
                        </p>
                      </div>
                    </div>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${place.coordinates.lat},${place.coordinates.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary-dark transition-colors"
                    >
                      <MapPin className="w-4 h-4" /> Directions
                    </a>
                  </div>
                ))
              ) : null}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0 text-center">
              <Link
                to={modalData.link}
                onClick={() => setModalData(null)}
                className="text-sm font-medium text-primary hover:underline"
              >
                View all in {modalData.linkText} page →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(Profile);
