// Import default config values for fallback
import { PRELOADED_CALENDAR_DATA } from '@config/academicCalendar';
import { GREETING_TIMES, WEATHER } from '@config/appConstants';
import { BRANCH_OPTIONS } from '@config/branches';
import { CAMPUS_DIRECTORY } from '@config/directory';
import { CAMPUS_LOCATIONS, CAMPUS_QUICK_ROUTES } from '@config/campusMap';
import { COLLEGE_INFO } from '@config/collegeInfo';
import { TIMETABLE_DATA as CBCS_COURSES } from '@config/courseData';
import { generalForms, ugForms, pgForms, phdForms } from '@config/forms';
import { HOSTEL_OPTIONS } from '@config/hostels';
import { NEP_TIMETABLE_DATA as NEP_COURSES } from '@config/nepCourseData';
import { defaultQuickLinks } from '@config/quickLinks';
import { MOTIVATIONAL_QUOTES } from '@config/quotes';
import { STUDENT_DIRECTORY } from '@config/studentDirectory';
import { AdminConfig } from '@features/admin/types';
import { subscribeToConfig, initializeConfig } from '@services/configService';
import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';

interface AppConfigContextType {
  config: AdminConfig;
  loading: boolean;
  error: Error | null;
  isFirestoreConfig: boolean; // true if config is from Firestore, false if fallback
}

const AppConfigContext = createContext<AppConfigContextType | undefined>(undefined);

// Generate default config from static files (fallback)
const generateDefaultConfig = (): AdminConfig => {
  return {
    collegeInfo: {
      name: { ...COLLEGE_INFO.name },
      email: { ...COLLEGE_INFO.email },
      website: { ...COLLEGE_INFO.website },
      location: { ...COLLEGE_INFO.location },
      heroImageUrl: undefined, // Uses default image when undefined
    },
    adminEmails: [], // Empty by default, configure in Firestore
    appConstants: {
      greetingTimes: {
        morningEnd: GREETING_TIMES.MORNING_END,
        afternoonEnd: GREETING_TIMES.AFTERNOON_END,
      },
      weather: {
        lat: WEATHER.DHANBAD_LAT,
        lon: WEATHER.DHANBAD_LON,
      },
    },
    branches: [...BRANCH_OPTIONS],
    hostels: [...HOSTEL_OPTIONS],
    quotes: MOTIVATIONAL_QUOTES.map((q, i) => ({
      id: `quote-${i}`,
      text: q.text,
      author: q.author,
    })),
    quickLinks: defaultQuickLinks.map((link) => ({
      id: link.id,
      name: link.name,
      href: link.href,
      color: link.color || 'text-blue-600 dark:text-blue-400',
      icon: link.icon || 'website',
    })),
    forms: [
      ...generalForms.map((f, i) => ({ ...f, id: `general-${i}`, category: 'general' as const })),
      ...ugForms.map((f, i) => ({ ...f, id: `ug-${i}`, category: 'ug' as const })),
      ...pgForms.map((f, i) => ({ ...f, id: `pg-${i}`, category: 'pg' as const })),
      ...phdForms.map((f, i) => ({ ...f, id: `phd-${i}`, category: 'phd' as const })),
    ],
    calendar: {
      semesterStartDate: PRELOADED_CALENDAR_DATA.semesterStartDate,
      semesterEndDate: PRELOADED_CALENDAR_DATA.semesterEndDate,
      events: PRELOADED_CALENDAR_DATA.events.map((e, i) => ({
        id: `event-${i}`,
        ...e,
      })),
    },
    directory: CAMPUS_DIRECTORY.map((entry) => ({ ...entry })),
    courses: [
      ...CBCS_COURSES.map((c, i) => ({
        id: `cbcs-${i}`,
        courseCode: c.courseCode,
        courseName: c.courseName,
        ltp: c.ltp,
        credits: c.credits,
        slots: c.slots.map((s) => ({ ...s })),
        courseType: 'CBCS' as const,
      })),
      ...NEP_COURSES.map((c, i) => ({
        id: `nep-${i}`,
        courseCode: c.courseCode,
        courseName: c.courseName,
        ltp: c.ltp,
        credits: c.credits,
        slots: c.slots.map((s) => ({ ...s })),
        courseType: 'NEP' as const,
      })),
    ],
    students: STUDENT_DIRECTORY.map((s) => ({ ...s })),
    campusMap: CAMPUS_LOCATIONS.map((l) => ({ ...l })),
    quickRoutes: CAMPUS_QUICK_ROUTES.map((r) => ({ ...r })),
    gradingScale: [
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
    ],
  };
};

export const AppConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<AdminConfig>(generateDefaultConfig);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isFirestoreConfig, setIsFirestoreConfig] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);

    // Initialize config if it doesn't exist
    const defaultConfig = generateDefaultConfig();
    initializeConfig(defaultConfig).catch(console.error);

    // Subscribe to real-time updates - this is independent of auth
    // Config is read-only and should always be available
    const unsubscribe = subscribeToConfig((firestoreConfig) => {
      if (firestoreConfig) {
        setConfig(firestoreConfig);
        setIsFirestoreConfig(true);
      } else {
        // Fallback to default config
        setConfig(defaultConfig);
        setIsFirestoreConfig(false);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []); // No dependencies - subscribe once on mount

  const contextValue = useMemo(
    () => ({
      config,
      loading,
      error,
      isFirestoreConfig,
    }),
    [config, loading, error, isFirestoreConfig]
  );

  return <AppConfigContext.Provider value={contextValue}>{children}</AppConfigContext.Provider>;
};

export const useAppConfig = (): AppConfigContextType => {
  const context = useContext(AppConfigContext);
  if (context === undefined) {
    throw new Error('useAppConfig must be used within an AppConfigProvider');
  }
  return context;
};

// Export default config generator for use elsewhere
export { generateDefaultConfig };
