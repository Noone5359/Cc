// Admin-specific types for the dev-only admin dashboard
// These types mirror the config structures but are used for editing

import { CampusLocation, CampusLocationCategory, QuickRoute } from '@/types';

// Re-export campus map types for use in components
export type { CampusLocation, CampusLocationCategory, QuickRoute };

export interface AdminCollegeInfo {
  name: {
    full: string;
    short: string;
    abbreviation: string;
  };
  email: {
    domain: string;
    allowedDomain: string;
  };
  website: {
    url: string;
    name: string;
  };
  location: {
    city: string;
    state: string;
    country: string;
  };
  heroImageUrl?: string; // URL for the login page hero/banner image
}

export interface AdminAppConstants {
  greetingTimes: {
    morningEnd: number;
    afternoonEnd: number;
  };
  weather: {
    lat: number;
    lon: number;
  };
}

export interface AdminQuote {
  id: string;
  text: string;
  author: string;
}

export interface AdminQuickLink {
  id: string;
  name: string;
  href: string;
  color: string;
  icon: string;
}

export interface AdminForm {
  id: string;
  title: string;
  formNumber: string;
  downloadLink: string;
  submitTo: string;
  category: 'general' | 'ug' | 'pg' | 'phd';
}

export interface AdminCalendarEvent {
  id: string;
  date: string;
  endDate?: string;
  description: string;
  type: 'Start of Semester' | 'Mid-Semester Exams' | 'End-Semester Exams' | 'Holiday' | 'Other';
}

export interface AdminCalendarData {
  semesterStartDate: string;
  semesterEndDate: string;
  semesterName?: string; // Name of the ongoing semester (e.g., "Monsoon 2025-26")
  events: AdminCalendarEvent[];
}

export interface AdminDirectoryEntry {
  id: string;
  name: string;
  department: string;
  designation: string;
  email: string;
  phone: string;
}

export interface AdminCourseSlot {
  day: string;
  startTime: string;
  endTime: string;
  venue: string;
}

export interface AdminCourse {
  id: string;
  courseCode: string;
  courseName: string;
  ltp: string;
  credits: number;
  slots: AdminCourseSlot[];
  courseType: 'CBCS' | 'NEP';
}

export interface AdminStudentEntry {
  id: string;
  admNo: string;
  name: string;
  branch: string;
}

export interface AdminGradeDefinition {
  id: string;
  grade: string; // e.g., 'A+', 'A', 'B+', etc.
  points: number; // e.g., 10, 9, 8, etc.
  minPercentage?: number; // Optional: minimum percentage for this grade
  color: string; // Tailwind color class for display
}

export interface AdminConfig {
  collegeInfo: AdminCollegeInfo;
  adminEmails: string[]; // List of admin email addresses
  appConstants: AdminAppConstants;
  branches: string[];
  hostels: string[];
  quotes: AdminQuote[];
  quickLinks: AdminQuickLink[];
  forms: AdminForm[];
  calendar: AdminCalendarData;
  directory: AdminDirectoryEntry[];
  courses: AdminCourse[];
  students: AdminStudentEntry[];
  campusMap: CampusLocation[];
  quickRoutes: QuickRoute[];
  gradingScale: AdminGradeDefinition[];
}

export type AdminTab =
  | 'college-info'
  | 'branches'
  | 'hostels'
  | 'quick-links'
  | 'quotes'
  | 'forms'
  | 'calendar'
  | 'directory'
  | 'courses'
  | 'students'
  | 'campus-map'
  | 'grading'
  | 'analytics'
  | 'support'
  | 'export';
