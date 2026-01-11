// FIX: Add optional properties to User interface to resolve property access errors across components.
export interface User {
  id: string;
  name: string;
  role: 'user' | 'admin'; // User role for access control
  admissionNumber: string;
  branch: string;
  hostel: string;
  email: string;
  phone: string;
  profilePicture?: string;
  profilePicturePath?: string;

  bannerGradient?: string;
  profileFrame?: string;
  fullName?: string;
  rollNumber?: string;
  year?: string;
  semester?: number;
  courseOption?: 'CBCS' | 'NEP';
  quickLinks?: QuickLink[];
  bio?: string;
  socialLinks?: SocialLinks;
  createdAt?: any; // Firestore Timestamp
  lastSemesterReset?: string; // Date string of the last semester reset (YYYY-MM-DD)
}

export interface Grade {
  subjectCode: string;
  subjectName: string;
  credits: number;
  grade: string;
  attendance: number;
  ltp?: string; // L-T-P format (e.g., "3-1-0")
}

export type SessionType = 'Monsoon' | 'Winter' | 'Summer';

export interface Semester {
  semester: number;
  sessionYear: string;
  sessionType: SessionType;
  sgpa: number;
  grades: Grade[];
}

export interface ClassSchedule {
  slotId: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  startTime: string;
  endTime: string;
  courseName: string;
  courseCode: string;
  instructor: string;
  location: string;
  isCustomTask?: boolean; // Marks tasks created by user vs. auto-generated course classes
}

export interface TimeTableCourse {
  courseCode: string;
  courseName: string;
  ltp: string;
  credits: number;
  slots: {
    day: string;
    startTime: string;
    endTime: string;
    venue: string;
  }[];
}

export interface CampusEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  category: string;
  organizer: string;
  imageUrl: string;
  sourceUrl?: string;
}

export interface Announcement {
  id: string;
  title: string;
  date: string;
  content: string;
  category: string;
  author: string;
  sourceUrl?: string;
}

export type NewsItem =
  | (CampusEvent & { type: 'event' })
  | (Announcement & { type: 'announcement' });

export interface DirectoryEntry {
  id: string;
  name: string;
  department: string;
  designation: string;
  email: string;
  phone: string;
}

export interface StudentDirectoryEntry {
  id: string;
  admNo: string;
  name: string;
  branch: string;
  // FIX: Add optional 'year' property to resolve type error in Directory.tsx
  year?: string;
}

// New types for Academic Calendar
export type CalendarEventType =
  | 'Start of Semester'
  | 'Mid-Semester Exams'
  | 'End-Semester Exams'
  | 'Holiday'
  | 'Other';

export interface CalendarEvent {
  date: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  description: string;
  type: CalendarEventType;
  remindMe?: boolean; // User wants to be reminded about this event
  userId?: string; // User who created this event (for user-created events)
  id?: string; // Unique identifier for the event
}

export interface AcademicCalendarData {
  semesterStartDate: string; // YYYY-MM-DD
  semesterEndDate: string; // YYYY-MM-DD
  semesterName?: string; // Name of the ongoing semester (e.g., "Monsoon 2025-26")
  academicYearStartDate?: string; // YYYY-MM-DD
  academicYearEndDate?: string; // YYYY-MM-DD
  events: CalendarEvent[];
}

// User's reminder preferences for events
export interface UserReminderPreferences {
  userId: string;
  reminderEventKeys: string[]; // Array of event keys (date + description) that user wants reminders for
}

// FIX: Added LostFoundStatus enum and LostFoundItem interface to resolve missing type errors.
export enum LostFoundStatus {
  Lost = 'Lost',
  Found = 'Found',
}

export interface LostFoundItem {
  id: string;
  name: string;
  description: string;
  lastSeenLocation: string;
  date: string;
  reporterName: string;
  reporterContact: string;
  status: LostFoundStatus;
  imageUrl: string;
}

// Campus Map types
export type CampusLocationCategory =
  | 'academic'
  | 'residential'
  | 'facilities'
  | 'dining'
  | 'administration';

export interface CampusLocation {
  id: string;
  name: string;
  category: CampusLocationCategory;
  coordinates: {
    lat: number;
    lng: number;
  };
  description: string;
  icon: string;
  details?: {
    address?: string;
    contact?: string;
    openingHours?: string;
    capacity?: number;
    facilities?: string[];
  };
}

export interface QuickRoute {
  id: string;
  from: string;
  to: string;
  time: string;
  distance: string;
  steps?: string[];
}

// College Forms
export interface Form {
  title: string;
  formNumber: string;
  downloadLink: string;
  submitTo: string;
  category?: 'general' | 'ug' | 'pg' | 'phd';
}

export interface UserFormsData {
  favorites: string[]; // array of formNumbers
  recentDownloads: Array<{
    formNumber: string;
    title: string;
    timestamp: number;
  }>;
}

// Quick Links type
export interface QuickLink {
  id: string;
  name: string;
  href: string;
  isExternal?: boolean;
  color?: string;
  isCustom?: boolean;
  icon?: string;
}

// Activity Log type
export type ActivityType =
  | 'event'
  | 'reminder'
  | 'form'
  | 'update'
  | 'login'
  | 'logout'
  | 'grades'
  | 'schedule'
  | 'map';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: { seconds: number; nanoseconds: number }; // Firestore Timestamp shape
  icon: string;
  link?: string;
}

// Social Links
export interface SocialLinks {
  github?: string;
  linkedin?: string;
  instagram?: string;
  twitter?: string;
  website?: string;
}
