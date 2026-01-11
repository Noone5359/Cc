import {
  InstructorIcon,
  LocationIcon,
  LibraryIcon,
  CalendarCheckIcon,
  HealthIcon,
  FeeIcon,
  WebsiteIcon,
  CdcIcon,
  ScholarshipIcon,
  DirectoryIcon,
  MisIcon,
  AbhikalpIcon,
  ArkIcon,
  CloudIcon,
  VideoIcon,
  CodeIcon,
  ChatIcon,
  DocumentIcon,
  MusicIcon,
  ShoppingIcon,
  PhotoIcon,
  CalculatorIcon,
  GameIcon,
  BookmarkIcon,
  NewspaperIcon,
} from '@components/icons/SidebarIcons';
import { TIME_INTERVALS, SEMESTER_DEFAULTS } from '@config/appConstants';
import { useAppConfig } from '@contexts/AppConfigContext';
import { useCalendar } from '@contexts/CalendarContext';
import { useGrades } from '@contexts/GradesContext';
import { useSchedule } from '@contexts/ScheduleContext';
import { useUser } from '@contexts/UserContext';
import { usePageLoadTrace } from '@hooks/usePerformanceTrace';
import {
  toInputDateString,
  formatTime,
  isToday as checkIsToday,
  isSameDay,
  addDays,
  calculateDateProgress,
  getWeekNumber,
} from '@lib/utils/dateUtils';
import { getGreeting, getRandomItem } from '@lib/utils/helpers';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ClassSchedule, CalendarEvent, QuickLink } from '@/types';

import { getWeatherAdvice } from '@/data/weatherAdvice';
import { cities, City } from '@/data/cities';

// Helper function to get emoji for calendar event type
const getEventEmoji = (event: CalendarEvent): string => {
  const desc = event.description.toLowerCase();
  const type = event.type;

  // Check event type first
  if (type === 'Mid-Semester Exams' || type === 'End-Semester Exams') {
    return '📝';
  }
  if (type === 'Start of Semester') {
    return '🎓';
  }
  if (type === 'Holiday') {
    // Check for specific holidays
    if (desc.includes('diwali') || desc.includes('deepavali')) return '🪔';
    if (desc.includes('holi')) return '🎨';
    if (desc.includes('christmas')) return '🎄';
    if (desc.includes('new year')) return '🎊';
    if (desc.includes('independence') || desc.includes('republic')) return '🇮🇳';
    if (desc.includes('dussehra') || desc.includes('durga')) return '🙏';
    if (desc.includes('eid')) return '🌙';
    if (desc.includes('gandhi')) return '🕊️';
    return '🎉';
  }

  // Check description for specific keywords
  if (desc.includes('exam') || desc.includes('test')) return '📝';
  if (desc.includes('registration') || desc.includes('enroll')) return '📋';
  if (desc.includes('vacation') || desc.includes('break')) return '🏖️';
  if (desc.includes('convocation') || desc.includes('graduation')) return '🎓';
  if (desc.includes('orientation')) return '🧭';
  if (desc.includes('sports') || desc.includes('athletics')) return '🏆';
  if (desc.includes('cultural') || desc.includes('fest')) return '🎭';
  if (desc.includes('technical') || desc.includes('hackathon')) return '💻';
  if (desc.includes('workshop') || desc.includes('seminar')) return '📚';
  if (desc.includes('deadline') || desc.includes('submission')) return '⏰';
  if (desc.includes('meeting')) return '👥';
  if (desc.includes('timetable') || desc.includes('schedule')) return '📅';

  // Default based on type
  return '📌';
};

// Interface for semester information
interface SemesterInfo {
  name: string; // "Monsoon 2025" or "Winter 2025-26"
  startDate: Date;
  endDate: Date;
  isActive: boolean; // Whether we're currently in this semester
}

/**
 * Intelligently detects the current/next semester from calendar events
 * Uses "Start of Semester" and "End-Semester Exams" events to determine boundaries
 */
const getSemesterInfo = (events: CalendarEvent[], today: Date): SemesterInfo | null => {
  if (!events || events.length === 0) return null;

  // Find all semester start events
  const startEvents = events
    .filter((e) => e.type === 'Start of Semester')
    .map((e) => ({
      date: new Date(e.date),
      description: e.description,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  // Find all end-semester exam events (use endDate if available, else date)
  const endEvents = events
    .filter((e) => e.type === 'End-Semester Exams')
    .map((e) => ({
      date: new Date(e.endDate || e.date),
      description: e.description,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (startEvents.length === 0) return null;

  // Build semester periods by pairing each start with the next available end
  const semesters: SemesterInfo[] = [];

  for (const start of startEvents) {
    // Find the next end event after this start
    const nextEnd = endEvents.find((e) => e.date > start.date);

    if (nextEnd) {
      // Determine semester name from description or month
      const startMonth = start.date.getMonth();
      const startYear = start.date.getFullYear();

      // Determine academic year based on semester type
      // Monsoon (Jul-Dec): Academic year starts same year (2025-26 for Monsoon starting Jul 2025)
      // Winter (Dec-May): Academic year started previous year (2025-26 for Winter starting Jan 2026)

      let academicYearStart: number;
      let name: string;
      const desc = start.description.toLowerCase();
      const isMonsoon = desc.includes('monsoon') || (startMonth >= 6 && startMonth <= 11);
      const isWinter =
        desc.includes('winter') || desc.includes('spring') || (startMonth >= 0 && startMonth <= 5);

      if (isMonsoon) {
        // Monsoon: starts Jul-Dec, academic year is that year to next year
        academicYearStart = startYear;
      } else if (isWinter || startMonth === 11) {
        // Winter: starts Dec-May, academic year uses previous year if Jan-May
        academicYearStart = startMonth >= 0 && startMonth <= 5 ? startYear - 1 : startYear;
      } else {
        academicYearStart = startYear;
      }

      const academicYear = `${academicYearStart}-${((academicYearStart + 1) % 100).toString().padStart(2, '0')}`;

      if (isMonsoon) {
        name = `Monsoon Semester ${academicYear}`;
      } else {
        name = `Winter Semester ${academicYear}`;
      }

      semesters.push({
        name,
        startDate: start.date,
        endDate: nextEnd.date,
        isActive: today >= start.date && today <= nextEnd.date,
      });
    }
  }

  // Find the active semester (current date falls within)
  const activeSemester = semesters.find((s) => s.isActive);
  if (activeSemester) return activeSemester;

  // If no active semester, find the next upcoming one
  const upcomingSemester = semesters.find((s) => s.startDate > today);
  if (upcomingSemester) return upcomingSemester;

  // If no upcoming, return the most recent one
  const recentSemester = semesters[semesters.length - 1];
  return recentSemester || null;
};

// Original 16-color palette with order-based assignment
// Ordered for maximum visual distinction - alternating warm/cool, no similar colors adjacent
const COURSE_COLORS = [
  'bg-purple-500/25 border-2 border-purple-600 text-purple-800 dark:text-purple-200', // Purple
  'bg-emerald-500/25 border-2 border-emerald-600 text-emerald-800 dark:text-emerald-200', // Emerald (green-blue)
  'bg-rose-500/25 border-2 border-rose-600 text-rose-800 dark:text-rose-200', // Rose (pink-red)
  'bg-cyan-500/25 border-2 border-cyan-600 text-cyan-800 dark:text-cyan-200', // Cyan (blue-green)
  'bg-amber-500/25 border-2 border-amber-600 text-amber-800 dark:text-amber-200', // Amber (yellow-orange)
  'bg-indigo-500/25 border-2 border-indigo-600 text-indigo-800 dark:text-indigo-200', // Indigo (blue-purple)
  'bg-orange-500/25 border-2 border-orange-600 text-orange-800 dark:text-orange-200', // Orange
  'bg-sky-500/25 border-2 border-sky-600 text-sky-800 dark:text-sky-200', // Sky Blue
  'bg-fuchsia-500/25 border-2 border-fuchsia-600 text-fuchsia-800 dark:text-fuchsia-200', // Fuchsia (magenta)
  'bg-lime-500/25 border-2 border-lime-600 text-lime-800 dark:text-lime-200', // Lime (yellow-green)
  'bg-red-500/25 border-2 border-red-600 text-red-800 dark:text-red-200', // Red
  'bg-blue-500/25 border-2 border-blue-600 text-blue-800 dark:text-blue-200', // Blue
  'bg-yellow-500/25 border-2 border-yellow-600 text-yellow-800 dark:text-yellow-200', // Yellow
  'bg-violet-500/25 border-2 border-violet-600 text-violet-800 dark:text-violet-200', // Violet
  'bg-green-500/25 border-2 border-green-600 text-green-800 dark:text-green-200', // Green
  'bg-pink-500/25 border-2 border-pink-600 text-pink-800 dark:text-pink-200', // Pink
];

// Map to track color assignments per course code
const dashboardColorMap = new Map<string, number>();
let dashboardNextColorIndex = 0;

// Color function for schedule items (matching Schedule.tsx)
const getClassColor = (courseCode: string, isCustomTask?: boolean) => {
  // Custom tasks get a distinctive teal/cyan color scheme
  if (isCustomTask) {
    return 'bg-teal-500/25 border-2 border-teal-600 text-teal-800 dark:text-teal-200';
  }

  // Check if this course already has a color assigned
  if (!dashboardColorMap.has(courseCode)) {
    // Assign the next color in sequence
    dashboardColorMap.set(courseCode, dashboardNextColorIndex);
    dashboardNextColorIndex = (dashboardNextColorIndex + 1) % COURSE_COLORS.length;
  }

  const colorIndex = dashboardColorMap.get(courseCode)!;
  return COURSE_COLORS[colorIndex];
};

interface WeatherData {
  temp: string;
  desc: string;
  icon: string;
}

interface DetailedWeatherData extends WeatherData {
  humidity: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  feelsLike: number;
  uvIndex: number;
  visibility: number;
  precipitation: number;
  cloudCover: number;
  dewPoint: number;
  isDay: number;
}

// Helper function to interpret WMO weather codes from Open-Meteo
const getWeatherInfoFromCode = (code: number, isDay: number): { desc: string; icon: string } => {
  const is_day = isDay === 1;
  switch (code) {
    case 0:
      return { desc: 'Clear sky', icon: is_day ? '☀️' : '🌙' };
    case 1:
      return { desc: 'Mainly clear', icon: is_day ? '🌤️' : '☁️' };
    case 2:
      return { desc: 'Partly cloudy', icon: is_day ? '⛅️' : '☁️' };
    case 3:
      return { desc: 'Overcast', icon: '☁️' };
    case 45:
    case 48:
      return { desc: 'Fog', icon: '🌫️' };
    case 51:
    case 53:
    case 55:
      return { desc: 'Drizzle', icon: '🌦️' };
    case 56:
    case 57:
      return { desc: 'Freezing Drizzle', icon: '🌨️' };
    case 61:
    case 63:
    case 65:
      return { desc: 'Rain', icon: '🌧️' };
    case 66:
    case 67:
      return { desc: 'Freezing Rain', icon: '🌨️' };
    case 71:
    case 73:
    case 75:
      return { desc: 'Snow fall', icon: '❄️' };
    case 77:
      return { desc: 'Snow grains', icon: '❄️' };
    case 80:
    case 81:
    case 82:
      return { desc: 'Rain showers', icon: '🌧️' };
    case 85:
    case 86:
      return { desc: 'Snow showers', icon: '🌨️' };
    case 95:
      return { desc: 'Thunderstorm', icon: '⛈️' };
    case 96:
    case 99:
      return { desc: 'Thunderstorm with hail', icon: '⛈️' };
    default:
      return { desc: 'Cloudy', icon: '☁️' };
  }
};

// Helper function to convert wind direction degrees to compass direction
const getWindDirection = (degrees: number): string => {
  const directions = [
    'N',
    'NNE',
    'NE',
    'ENE',
    'E',
    'ESE',
    'SE',
    'SSE',
    'S',
    'SSW',
    'SW',
    'WSW',
    'W',
    'WNW',
    'NW',
    'NNW',
  ];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index] ?? 'N';
};

// Default quick links (stored data without icons)
// Default quick links are now imported from collegeConfig

// Get icon component by name (for custom links)
const getIconByName = (iconName: string): React.ReactNode => {
  const iconComponents: Record<string, React.ReactNode> = {
    website: <WebsiteIcon />,
    cloud: <CloudIcon />,
    video: <VideoIcon />,
    code: <CodeIcon />,
    chat: <ChatIcon />,
    document: <DocumentIcon />,
    music: <MusicIcon />,
    shopping: <ShoppingIcon />,
    photo: <PhotoIcon />,
    calculator: <CalculatorIcon />,
    game: <GameIcon />,
    bookmark: <BookmarkIcon />,
    newspaper: <NewspaperIcon />,
  };
  return iconComponents[iconName] || <WebsiteIcon />;
};

// Get icon for a link based on its id or icon property
const getIconForLink = (link: QuickLink): React.ReactNode => {
  // For custom links, use the icon property
  if (link.isCustom && link.icon) {
    return getIconByName(link.icon);
  }

  // For default links, use the id
  const iconMap: Record<string, React.ReactNode> = {
    '1': <MisIcon />,
    '2': <AbhikalpIcon />,
    '3': <ArkIcon />,
    '4': <CdcIcon />,
    '5': <LibraryIcon />,
    '6': <FeeIcon />,
    '7': <ScholarshipIcon />,
    '8': <HealthIcon />,
    '9': <WebsiteIcon />,
    '10': <DirectoryIcon />,
  };
  return iconMap[link.id] || <WebsiteIcon />;
};

// Default city used as fallback when cities array is unexpectedly empty
const DEFAULT_CITY: City = cities[0] ?? {
  name: 'Dhanbad',
  state: 'Jharkhand',
  lat: 23.79,
  lon: 86.43,
};

const Dashboard: React.FC = () => {
  // Performance monitoring
  usePageLoadTrace('dashboard');

  const { config: appConfig } = useAppConfig();

  // Helper function to get default city from admin config
  const getDefaultCityFromConfig = (): City => {
    // Try to find city matching admin config location
    if (appConfig?.collegeInfo?.location?.city) {
      const adminCity = appConfig.collegeInfo.location.city.toLowerCase();
      const adminState = appConfig.collegeInfo.location.state?.toLowerCase();

      // Try to find exact match with city and state
      const exactMatch = cities.find(
        (c) =>
          c.name.toLowerCase() === adminCity &&
          (!adminState || c.state.toLowerCase() === adminState)
      );
      if (exactMatch) return exactMatch;

      // Try to find partial match with just city name
      const partialMatch = cities.find((c) => c.name.toLowerCase() === adminCity);
      if (partialMatch) return partialMatch;
    }

    // Fallback to default city
    return DEFAULT_CITY;
  };

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [detailedWeather, setDetailedWeather] = useState<DetailedWeatherData | null>(null);
  const [showWeatherModal, setShowWeatherModal] = useState(false);
  const [selectedCity, setSelectedCity] = useState<City>(() => {
    const savedCity = localStorage.getItem('selectedCity');
    if (savedCity) {
      try {
        return JSON.parse(savedCity);
      } catch {
        return DEFAULT_CITY; // Fallback to default if parsing fails
      }
    }
    // No saved preference - will be updated with admin config city in useEffect
    return DEFAULT_CITY;
  });
  const [citySearchOpen, setCitySearchOpen] = useState(false);
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const cityDropdownRef = React.useRef<HTMLDivElement>(null);
  const { user, loading: userLoading, updateUser } = useUser();
  const { gradesData, loading: gradesLoading } = useGrades();
  const { scheduleData, loading: scheduleLoading } = useSchedule();
  const {
    calendarData,
    loading: calendarLoading,
    reminderPreferences,
    getEventKey,
    toggleReminderPreference,
    updateUserEvent,
  } = useCalendar();

  // Get quotes from config
  const configQuotes = useMemo(() => {
    if (appConfig?.quotes && appConfig.quotes.length > 0) {
      return appConfig.quotes.map((q) => ({ text: q.text, author: q.author }));
    }
    return [
      { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
    ];
  }, [appConfig?.quotes]);

  // Update default city from admin config when config loads (only if user hasn't saved a preference)
  useEffect(() => {
    const savedCity = localStorage.getItem('selectedCity');
    if (!savedCity && appConfig?.collegeInfo?.location?.city) {
      const defaultCity = getDefaultCityFromConfig();
      if (
        defaultCity &&
        (defaultCity.name !== selectedCity.name || defaultCity.state !== selectedCity.state)
      ) {
        setSelectedCity(defaultCity);
      }
    }
  }, [appConfig?.collegeInfo?.location?.city, appConfig?.collegeInfo?.location?.state]);

  const upcomingEventsCount = useMemo(() => {
    if (!calendarData) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate one week from today
    const oneWeekFromToday = new Date(today);
    oneWeekFromToday.setDate(oneWeekFromToday.getDate() + 7);

    // Filter events that are ongoing (started in the past but not yet ended) OR will start within the next week
    const upcomingEvents = calendarData.events.filter((event) => {
      const eventStartDate = new Date(event.date);
      const eventEndDate = new Date(event.endDate || event.date);
      eventStartDate.setHours(0, 0, 0, 0);
      eventEndDate.setHours(0, 0, 0, 0);

      // Event is ongoing if it has already started but hasn't ended yet
      const isOngoing = eventStartDate < today && eventEndDate >= today;

      // Event is upcoming if it starts within the next week
      const isUpcomingThisWeek = eventStartDate >= today && eventStartDate <= oneWeekFromToday;

      return isOngoing || isUpcomingThisWeek;
    });

    return upcomingEvents.length;
  }, [calendarData]);

  // AI Weather Recommendation State
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);

  // Weather advice cache interface
  interface WeatherAdviceCache {
    advice: string;
    temp: number;
    weatherCode: number;
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    timestamp: number;
  }

  // Quick Links state management
  const [quickLinks, setQuickLinks] = useState<QuickLink[]>([]);
  const [isManagingLinks, setIsManagingLinks] = useState(false);
  const [editingLink, setEditingLink] = useState<QuickLink | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLink, setNewLink] = useState({
    name: '',
    href: '',
    color: 'text-blue-600 dark:text-blue-400',
    icon: 'website',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedLinkId, setDraggedLinkId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Date navigation handlers
  const handleResetToToday = useCallback(() => setSelectedDate(new Date()), []);
  const handlePreviousDay = useCallback(() => setSelectedDate((prev) => addDays(prev, -1)), []);
  const handleNextDay = useCallback(() => setSelectedDate((prev) => addDays(prev, 1)), []);
  const handlePreviousWeek = useCallback(() => setSelectedDate((prev) => addDays(prev, -7)), []);
  const handleNextWeek = useCallback(() => setSelectedDate((prev) => addDays(prev, 7)), []);

  // Check if the day has changed and automatically update to current day
  useEffect(() => {
    const checkDayChange = () => {
      if (!isSameDay(selectedDate, new Date())) {
        setSelectedDate(new Date());
      }
    };

    const intervalId = setInterval(checkDayChange, TIME_INTERVALS.DAY_CHECK);
    return () => clearInterval(intervalId);
  }, [selectedDate]);

  // Load quick links from admin config, with user's custom links merged on top
  useEffect(() => {
    // Start with admin-configured links (source of truth for default links)
    const adminLinks = appConfig?.quickLinks || [];

    // Get user's custom links only (links they personally added)
    const userCustomLinks = (user?.quickLinks || []).filter((link) => link.isCustom);

    // Merge: admin links first, then user's custom links
    const mergedLinks = [...adminLinks, ...userCustomLinks];
    setQuickLinks(mergedLinks);
  }, [appConfig?.quickLinks, user?.quickLinks]);

  // Save quick links to Firestore (only saves user's custom links)
  const saveQuickLinks = async (links: QuickLink[]) => {
    setQuickLinks(links);

    // Only save user's custom links to their profile
    // Default links come from admin config
    if (user?.id) {
      try {
        const customLinksOnly = links.filter((link) => link.isCustom);
        await updateUser({ quickLinks: customLinksOnly });
      } catch (error) {
        console.error('Failed to save quick links:', error);
      }
    }
  };

  // Add new quick link
  const handleAddLink = () => {
    if (newLink.name && newLink.href) {
      const link: QuickLink = {
        id: Date.now().toString(),
        name: newLink.name,
        href: newLink.href.startsWith('http') ? newLink.href : `https://${newLink.href}`,
        isExternal: true,
        color: newLink.color,
        isCustom: true,
        icon: newLink.icon,
      };
      const updatedLinks = [...quickLinks, link];
      saveQuickLinks(updatedLinks);
      setNewLink({
        name: '',
        href: '',
        color: 'text-blue-600 dark:text-blue-400',
        icon: 'website',
      });
      setShowAddModal(false);
    }
  };

  // Remove quick link
  const handleRemoveLink = (id: string) => {
    const updatedLinks = quickLinks.filter((link) => link.id !== id);
    saveQuickLinks(updatedLinks);
  };

  // Edit quick link
  const handleEditLink = (link: QuickLink) => {
    if (editingLink && editingLink.id === link.id) {
      const updatedLinks = quickLinks.map((l) =>
        l.id === editingLink.id
          ? {
              ...editingLink,
              href: editingLink.href.startsWith('http')
                ? editingLink.href
                : `https://${editingLink.href}`,
            }
          : l
      );
      saveQuickLinks(updatedLinks);
      setEditingLink(null);
    } else {
      setEditingLink({ ...link });
    }
  };

  // Reset to default links (removes user's custom links, keeps only admin-configured)
  const handleResetToDefault = () => {
    const adminLinks = appConfig?.quickLinks || [];
    setQuickLinks(adminLinks);
    // Clear user's custom links from their profile
    if (user?.id) {
      updateUser({ quickLinks: [] }).catch(console.error);
    }
    setIsManagingLinks(false);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, linkId: string) => {
    setDraggedLinkId(linkId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetLinkId: string) => {
    e.preventDefault();
    if (!draggedLinkId || draggedLinkId === targetLinkId) return;

    const draggedIndex = quickLinks.findIndex((link) => link.id === draggedLinkId);
    const targetIndex = quickLinks.findIndex((link) => link.id === targetLinkId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newLinks = [...quickLinks];
    const [removed] = newLinks.splice(draggedIndex, 1);
    if (removed) {
      newLinks.splice(targetIndex, 0, removed);
      saveQuickLinks(newLinks);
    }
    setDraggedLinkId(null);
  };

  const handleDragEnd = () => {
    setDraggedLinkId(null);
  };

  // Filter links based on search query
  const filteredLinks = useMemo(() => {
    if (!searchQuery.trim()) return quickLinks;
    return quickLinks.filter((link) => link.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [quickLinks, searchQuery]);

  const scheduleInfo = useMemo(() => {
    const defaultState = {
      title: "Today's Schedule",
      classes: [] as ClassSchedule[],
      isHoliday: false,
      isExam: false,
      holidayDescription: null as string | null,
      infoMessage: null as string | null,
    };

    if (!calendarData) {
      // scheduleData can be null if not yet uploaded
      return defaultState;
    }

    const dateToDisplay = selectedDate;
    const today = new Date();
    const isToday = toInputDateString(dateToDisplay) === toInputDateString(today);

    // Create a YYYY-MM-DD string for the selected date for reliable comparison
    const displayDateString = toInputDateString(dateToDisplay);
    const displayWeekday = dateToDisplay.toLocaleDateString('en-US', { weekday: 'long' });

    // Check for academic calendar events on the selected date
    const todayEvents = calendarData.events.filter((e) => {
      const startDate = e.date;
      const endDate = e.endDate || e.date; // Use start date if end date is missing
      const isOnDate = displayDateString >= startDate && displayDateString <= endDate;

      if (!isOnDate) return false;

      // Filter for BTech-relevant events only
      const description = e.description.toLowerCase();

      // Always include holidays, exams, and timetable changes
      if (
        e.type === 'Holiday' ||
        e.type === 'Mid-Semester Exams' ||
        e.type === 'End-Semester Exams' ||
        description.includes('timetable') ||
        description.includes('working as per') ||
        description.includes('working as') ||
        description.includes('afternoon working') ||
        description.includes('morning working')
      ) {
        return true;
      }

      // Include events that mention BTech students specifically
      if (
        description.includes('b. tech') ||
        description.includes('btech') ||
        description.includes('b tech') ||
        description.includes('ug students') ||
        description.includes('undergraduate') ||
        description.includes('final year ug') ||
        description.includes('1st year ug') ||
        description.includes('2nd year') ||
        description.includes('3rd year') ||
        description.includes('4th year') ||
        description.includes('int. m. tech') ||
        description.includes('dual degree') ||
        description.includes('bs-ms')
      ) {
        return true;
      }

      // Include general academic events that affect all students
      if (
        description.includes('all students') ||
        description.includes('semester classes') ||
        description.includes('semester start') ||
        description.includes('semester end') ||
        description.includes('convocation') ||
        description.includes('foundation day') ||
        description.includes('srijan') ||
        description.includes('concetto') ||
        description.includes('parakram') ||
        description.includes('basant') ||
        description.includes('sports meet') ||
        description.includes('orientation') ||
        description.includes('registration') ||
        description.includes('fee payment') ||
        description.includes('pre-registration')
      ) {
        return true;
      }

      // Exclude PG-only, PhD-only, Executive-only events
      if (
        description.includes('pg students') ||
        description.includes('ph. d') ||
        description.includes('phd') ||
        description.includes('m. tech') ||
        description.includes('m. sc') ||
        description.includes('mba') ||
        description.includes('executive') ||
        description.includes('part-time') ||
        description.includes('research proposal') ||
        description.includes('supervisor') ||
        description.includes('project guide') ||
        description.includes('thesis') ||
        description.includes('dissertation')
      ) {
        return false;
      }

      // Include other general events by default
      return true;
    });

    let titleText = isToday ? "Today's Schedule" : 'Schedule';

    // Check for special events FIRST (before checking holidays/exams)
    // This ensures special events are captured even on holidays/exam days
    const specialEvents = todayEvents.filter((e) => {
      const desc = e.description.toLowerCase();

      // Must be type 'Other' and not timetable/working-as (but CAN be on holiday/exam days)
      if (e.type !== 'Other') return false;
      if (desc.includes('timetable') || desc.includes('working as')) return false;

      // Explicitly exclude PG/PhD/Executive/Part-time ONLY events
      const isPGPhDOnly =
        (desc.includes('pg students') ||
          desc.includes('ph. d') ||
          desc.includes('phd') ||
          desc.includes('m. tech') ||
          desc.includes('m. sc') ||
          desc.includes('mba') ||
          desc.includes('executive') ||
          desc.includes('part-time') ||
          desc.includes('research') ||
          desc.includes('supervisor') ||
          desc.includes('thesis') ||
          desc.includes('dissertation')) &&
        // Not if it also mentions BTech/UG
        !(
          desc.includes('b. tech') ||
          desc.includes('btech') ||
          desc.includes('b tech') ||
          desc.includes('ug students') ||
          desc.includes('undergraduate') ||
          desc.includes('all students')
        );

      if (isPGPhDOnly) return false;

      // Include if it's BTech-specific OR a general college event
      const isBTechSpecific =
        desc.includes('b. tech') ||
        desc.includes('btech') ||
        desc.includes('b tech') ||
        desc.includes('ug students') ||
        desc.includes('undergraduate') ||
        desc.includes('1st year ug') ||
        desc.includes('2nd year') ||
        desc.includes('3rd year') ||
        desc.includes('4th year') ||
        desc.includes('final year ug') ||
        desc.includes('int. m. tech') ||
        desc.includes('dual degree') ||
        desc.includes('bs-ms');

      const isGeneralCollegeEvent =
        desc.includes('all students') ||
        desc.includes('convocation') ||
        desc.includes('foundation day') ||
        desc.includes('srijan') ||
        desc.includes('concetto') ||
        desc.includes('parakram') ||
        desc.includes('basant') ||
        desc.includes('sports meet') ||
        desc.includes('cultural') ||
        desc.includes('fest') ||
        desc.includes('techno-management') ||
        desc.includes('orientation') ||
        desc.includes('registration') ||
        desc.includes('fee payment') ||
        desc.includes('pre-registration') ||
        desc.includes('semester classes') ||
        desc.includes('semester feedback') ||
        desc.includes('feedback');

      return isBTechSpecific || isGeneralCollegeEvent;
    });

    let specialEventMessage: string | null = null;
    if (specialEvents.length > 0) {
      if (specialEvents.length === 1) {
        const firstEvent = specialEvents[0];
        specialEventMessage = firstEvent ? `🎉 Special Event: ${firstEvent.description}` : null;
      } else {
        const eventDescriptions = specialEvents.map((e) => `• ${e.description}`).join('\n');
        specialEventMessage = `🎉 Special Events:\n${eventDescriptions}`;
      }
    }

    // Check for exam periods FIRST (before holidays)
    const examEvent = todayEvents.find(
      (e) => e.type === 'Mid-Semester Exams' || e.type === 'End-Semester Exams'
    );

    if (examEvent) {
      // Extract personal tasks to show even during exam period
      const personalTasks = (scheduleData || [])
        .filter((c) => c.isCustomTask && c.day.toLowerCase() === displayWeekday.toLowerCase())
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

      return {
        ...defaultState,
        title: 'Exam Period 📝',
        classes: personalTasks,
        isHoliday: true,
        isExam: true,
        holidayDescription: examEvent.description,
        infoMessage: specialEventMessage,
      };
    }

    // Check for holidays and special events - suspend classes for ALL holidays, breaks, vacations
    const holidayEvent = todayEvents.find(
      (e) =>
        e.type === 'Holiday' ||
        e.description.toLowerCase().includes('semester break') ||
        e.description.toLowerCase().includes('mid semester break') ||
        e.description.toLowerCase().includes('winter break') ||
        e.description.toLowerCase().includes('summer break') ||
        e.description.toLowerCase().includes('no class')
    );

    if (holidayEvent) {
      // Extract personal tasks to show even during holidays
      const personalTasks = (scheduleData || [])
        .filter((c) => c.isCustomTask && c.day.toLowerCase() === displayWeekday.toLowerCase())
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

      return {
        ...defaultState,
        title: "It's a Holiday! 🎉",
        classes: personalTasks,
        isHoliday: true,
        holidayDescription: holidayEvent.description,
        infoMessage: specialEventMessage,
      };
    }

    // Check for semester start/end
    const semesterEvent = todayEvents.find(
      (e) =>
        e.type === 'Start of Semester' ||
        e.description.toLowerCase().includes('semester start') ||
        e.description.toLowerCase().includes('commencement of') ||
        e.description.toLowerCase().includes('semester end')
    );

    if (semesterEvent) {
      const desc = semesterEvent.description.toLowerCase();
      const isSemesterStart =
        semesterEvent.type === 'Start of Semester' ||
        desc.includes('semester start') ||
        desc.includes('commencement of');

      if (isSemesterStart) {
        // Semester start is NOT a day off - classes begin! Show regular schedule with info message
        const classesForDay = (scheduleData || [])
          .filter((c) => c.day.toLowerCase() === displayWeekday.toLowerCase())
          .sort((a, b) => a.startTime.localeCompare(b.startTime));

        return {
          ...defaultState,
          title: isToday ? "Today's Schedule" : 'Schedule',
          classes: classesForDay,
          isHoliday: false,
          infoMessage: specialEventMessage
            ? `${specialEventMessage}\n📚 ${semesterEvent.description}`
            : `📚 ${semesterEvent.description}`,
        };
      } else {
        // Semester end - show personal tasks only
        const personalTasks = (scheduleData || [])
          .filter((c) => c.isCustomTask && c.day.toLowerCase() === displayWeekday.toLowerCase())
          .sort((a, b) => a.startTime.localeCompare(b.startTime));

        return {
          ...defaultState,
          title: 'Semester Event 📚',
          classes: personalTasks,
          isHoliday: true,
          holidayDescription: `${semesterEvent.description} - Check with your department for schedule changes.`,
          infoMessage: specialEventMessage,
        };
      }
    }

    // Check for timetable changes or special scheduling
    const timetableEvent = todayEvents.find(
      (e) =>
        e.description.toLowerCase().includes('timetable') ||
        e.description.toLowerCase().includes('schedule change') ||
        e.description.toLowerCase().includes('class schedule') ||
        e.description.toLowerCase().includes('working as per') ||
        e.description.toLowerCase().includes('working as') ||
        e.description.toLowerCase().includes('afternoon working') ||
        e.description.toLowerCase().includes('morning working')
    );

    let effectiveDay = displayWeekday;
    let infoMessage: string | null = null;
    const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    if (timetableEvent) {
      const desc = timetableEvent.description.toLowerCase();

      // Check for specific day timetable changes
      for (const day of weekdays) {
        if (desc.includes(`${day} timetable`) || desc.includes(`${day} schedule`)) {
          effectiveDay = day.charAt(0).toUpperCase() + day.slice(1);
          infoMessage = `📅 This day follows ${effectiveDay}'s schedule as per the academic calendar.`;
          break;
        }
      }

      // Check for "working as per [day] timetable" patterns
      if (!infoMessage) {
        for (const day of weekdays) {
          if (desc.includes(`working as per ${day}`) || desc.includes(`as per ${day}`)) {
            effectiveDay = day.charAt(0).toUpperCase() + day.slice(1);
            infoMessage = `📅 This day follows ${effectiveDay}'s schedule as per the academic calendar.`;
            break;
          }
        }
      }

      // Check for afternoon/morning working patterns
      if (!infoMessage) {
        if (desc.includes('afternoon working')) {
          infoMessage = `📅 ${timetableEvent.description}`;
        } else if (desc.includes('morning working')) {
          infoMessage = `📅 ${timetableEvent.description}`;
        } else if (desc.includes('working as per')) {
          infoMessage = `📅 ${timetableEvent.description}`;
        }
      }

      // If no specific pattern matched, show general timetable change message
      if (!infoMessage) {
        infoMessage = `📅 ${timetableEvent.description}`;
      }
    }

    // Add special event message to infoMessage if we have any
    if (specialEventMessage) {
      infoMessage = infoMessage ? `${specialEventMessage}\n${infoMessage}` : specialEventMessage;
    }

    // Check for other academic events - BTech specific OR general college events
    const otherEvents = todayEvents.filter((e) => {
      const desc = e.description.toLowerCase();

      // Must be type 'Other' and not timetable/working-as and not already in specialEvents
      if (e.type !== 'Other') return false;
      if (desc.includes('timetable') || desc.includes('working as')) return false;
      if (specialEvents.includes(e)) return false;

      // Explicitly exclude PG/PhD/Executive/Part-time ONLY events
      const isPGPhDOnly =
        (desc.includes('pg students') ||
          desc.includes('ph. d') ||
          desc.includes('phd') ||
          desc.includes('m. tech') ||
          desc.includes('m. sc') ||
          desc.includes('mba') ||
          desc.includes('executive') ||
          desc.includes('part-time') ||
          desc.includes('research') ||
          desc.includes('supervisor') ||
          desc.includes('thesis') ||
          desc.includes('dissertation')) &&
        // Not if it also mentions BTech/UG
        !(
          desc.includes('b. tech') ||
          desc.includes('btech') ||
          desc.includes('b tech') ||
          desc.includes('ug students') ||
          desc.includes('undergraduate') ||
          desc.includes('all students')
        );

      if (isPGPhDOnly) return false;

      // Include if it's BTech-specific OR a general college event
      const isBTechSpecific =
        desc.includes('b. tech') ||
        desc.includes('btech') ||
        desc.includes('b tech') ||
        desc.includes('ug students') ||
        desc.includes('undergraduate') ||
        desc.includes('1st year ug') ||
        desc.includes('2nd year') ||
        desc.includes('3rd year') ||
        desc.includes('4th year') ||
        desc.includes('final year ug') ||
        desc.includes('int. m. tech') ||
        desc.includes('dual degree') ||
        desc.includes('bs-ms');

      const isGeneralCollegeEvent =
        desc.includes('all students') ||
        desc.includes('semester start') ||
        desc.includes('semester end');

      return isBTechSpecific || isGeneralCollegeEvent;
    });

    if (otherEvents.length > 0 && !infoMessage) {
      const eventDescriptions = otherEvents.map((e) => e.description).join(', ');
      infoMessage = `📋 Academic Event: ${eventDescriptions}`;
    }

    const classesForDay = (scheduleData || [])
      .filter((c) => c.day.toLowerCase() === effectiveDay.toLowerCase())
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    // Update title based on events and schedule changes
    if (infoMessage) {
      if (timetableEvent) {
        titleText = isToday ? "Today's Schedule" : 'Schedule';
      } else if (specialEvents.length > 0) {
        titleText = isToday ? 'Today - Special Day' : 'Special Day';
      } else if (otherEvents.length > 0) {
        titleText = isToday ? 'Today - Academic Day' : 'Academic Day';
      }
    }

    return {
      ...defaultState,
      classes: classesForDay,
      infoMessage,
      title: titleText,
    };
  }, [calendarData, scheduleData, selectedDate]);

  // Helper to determine time of day
  const getTimeOfDay = (): 'morning' | 'afternoon' | 'evening' | 'night' => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  };

  // Helper to check if cached advice is still valid
  const getCachedAdvice = (temp: number, weatherCode: number): string | null => {
    try {
      const cached = localStorage.getItem('weatherAdviceCache');
      if (!cached) return null;

      const cacheData: WeatherAdviceCache = JSON.parse(cached);
      const now = Date.now();
      const cacheAge = now - cacheData.timestamp;
      const threeHours = 1 * 60 * 60 * 1000; // 1 hours in milliseconds

      // Cache is invalid if older than 3 hours
      if (cacheAge > threeHours) {
        localStorage.removeItem('weatherAdviceCache');
        return null;
      }

      const currentTimeOfDay = getTimeOfDay();
      const tempDiff = Math.abs(temp - cacheData.temp);

      // Reuse cache if:
      // 1. Same time of day
      // 2. Temperature difference is less than 3°C
      // 3. Same weather condition (code)
      if (
        cacheData.timeOfDay === currentTimeOfDay &&
        tempDiff < 1 &&
        cacheData.weatherCode === weatherCode
      ) {
        return cacheData.advice;
      }

      return null;
    } catch (err) {
      console.error('Cache read error:', err);
      return null;
    }
  };

  // Save advice to cache
  const cacheAdvice = (advice: string, temp: number, weatherCode: number) => {
    try {
      const cacheData: WeatherAdviceCache = {
        advice,
        temp,
        weatherCode,
        timeOfDay: getTimeOfDay(),
        timestamp: Date.now(),
      };
      localStorage.setItem('weatherAdviceCache', JSON.stringify(cacheData));
    } catch (err) {
      console.error('Cache write error:', err);
    }
  };

  const fetchWeatherRecommendation = async (weatherData: WeatherData, weatherCode: number) => {
    setRecommendationLoading(true);
    setRecommendationError(null);
    setRecommendation(null);

    try {
      const temp = parseFloat(weatherData.temp);

      // Check cache first
      const cachedAdvice = getCachedAdvice(temp, weatherCode);
      if (cachedAdvice) {
        setRecommendation(cachedAdvice);
        setRecommendationLoading(false);
        return;
      }

      // Get advice from pre-stored data
      const advice = getWeatherAdvice(weatherCode, temp);
      setRecommendation(advice);

      // Cache the new advice
      cacheAdvice(advice, temp, weatherCode);
    } catch (err) {
      console.error('Weather advice error:', err);
      setRecommendationError("Couldn't get weather advices right now.");
    } finally {
      setRecommendationLoading(false);
    }
  };

  const fetchWeather = async (city: City = selectedCity) => {
    setWeatherError(null);
    setWeatherLoading(true);
    setRecommendation(null);
    setRecommendationLoading(true);
    setRecommendationError(null);

    try {
      const lat = city.lat;
      const lon = city.lon;
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day,relative_humidity_2m,wind_speed_10m,wind_direction_10m,surface_pressure,apparent_temperature,precipitation,uv_index,cloud_cover,dew_point_2m&timezone=Asia/Kolkata`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Weather API failed with status: ${response.status}`);
      }
      const data = await response.json();

      if (!data.current) {
        throw new Error('Invalid weather data received.');
      }

      const {
        temperature_2m,
        weather_code,
        is_day,
        relative_humidity_2m,
        wind_speed_10m,
        wind_direction_10m,
        surface_pressure,
        apparent_temperature,
        precipitation,
        uv_index,
        cloud_cover,
        dew_point_2m,
      } = data.current;
      const { desc, icon } = getWeatherInfoFromCode(weather_code, is_day);

      const weatherData: WeatherData = {
        temp: temperature_2m.toFixed(0),
        desc: desc,
        icon: icon,
      };
      setWeather(weatherData);

      // Store detailed weather data
      const detailedData: DetailedWeatherData = {
        ...weatherData,
        humidity: relative_humidity_2m || 0,
        windSpeed: wind_speed_10m || 0,
        windDirection: wind_direction_10m || 0,
        pressure: surface_pressure || 0,
        feelsLike: apparent_temperature || parseFloat(weatherData.temp),
        uvIndex: uv_index || 0,
        visibility: 10, // Open-Meteo doesn't provide visibility in free tier
        precipitation: precipitation || 0,
        cloudCover: cloud_cover || 0,
        dewPoint: dew_point_2m || 0,
        isDay: is_day || 0,
      };
      setDetailedWeather(detailedData);

      await fetchWeatherRecommendation(weatherData, weather_code);
    } catch (err) {
      setWeatherError('Could not load weather.');
      setRecommendationError(null);
      setRecommendationLoading(false);
      console.error('Weather fetch error:', err);
    } finally {
      setWeatherLoading(false);
    }
  };

  // Handle city selection change
  const handleCityChange = (city: City) => {
    setSelectedCity(city);
    localStorage.setItem('selectedCity', JSON.stringify(city));
    fetchWeather(city);
    setCitySearchOpen(false);
    setCitySearchQuery('');
  };

  // Filter cities based on search query
  const filteredCities = useMemo(() => {
    if (!citySearchQuery.trim()) return cities;
    const query = citySearchQuery.toLowerCase();
    return cities.filter(
      (city) => city.name.toLowerCase().includes(query) || city.state.toLowerCase().includes(query)
    );
  }, [citySearchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target as Node)) {
        setCitySearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Weather data fetch on mount and when city changes
  useEffect(() => {
    fetchWeather();

    // Auto-refresh weather every hour
    const weatherRefreshInterval = setInterval(
      () => {
        fetchWeather();
      },
      60 * 60 * 1000
    ); // 60 minutes (1 hour)

    return () => {
      clearInterval(weatherRefreshInterval);
    };
  }, [selectedCity]);

  // Start with a random quote, then change every 30 seconds
  const [motivationalQuote, setMotivationalQuote] = useState(() => getRandomItem(configQuotes));

  useEffect(() => {
    const quoteInterval = setInterval(() => {
      setMotivationalQuote(getRandomItem(configQuotes));
    }, 30000); // 30 seconds

    return () => clearInterval(quoteInterval);
  }, [configQuotes]);

  const overallLoading = userLoading || gradesLoading || scheduleLoading || calendarLoading;

  const displayCgpa = gradesData?.cgpa;

  const { currentTime, isSelectedDateToday } = useMemo(() => {
    const now = new Date();
    const currentTime = formatTime(now);
    const isSelectedDateToday = checkIsToday(selectedDate);
    return { currentTime, isSelectedDateToday };
  }, [selectedDate]);

  // Stable date reference for semester progress - only changes once per day
  const todayDateString = useMemo(() => {
    return new Date().toDateString();
  }, []);

  const stableNow = useMemo(() => {
    return new Date();
  }, [todayDateString]);

  // Only calculate upcoming class if viewing today's schedule
  const upcomingClassIndex = useMemo(() => {
    return isSelectedDateToday
      ? scheduleInfo.classes.findIndex((c: ClassSchedule) => c.endTime > currentTime)
      : -1;
  }, [isSelectedDateToday, scheduleInfo.classes, currentTime]);

  // Check if all classes are completed for today
  const allClassesCompleted = useMemo(() => {
    return isSelectedDateToday && scheduleInfo.classes.length > 0 && upcomingClassIndex === -1;
  }, [isSelectedDateToday, scheduleInfo.classes.length, upcomingClassIndex]);

  const { semesterProgress, currentWeek, semesterName, semesterStartDate, semesterEndDate } =
    useMemo(() => {
      const year = stableNow.getFullYear();
      const defaultStartDate = new Date(
        year,
        SEMESTER_DEFAULTS.START_MONTH,
        SEMESTER_DEFAULTS.START_DAY
      );
      const defaultEndDate = new Date(year, SEMESTER_DEFAULTS.END_MONTH, SEMESTER_DEFAULTS.END_DAY);

      // Try to intelligently detect semester from calendar events
      const detectedSemester = getSemesterInfo(calendarData?.events || [], stableNow);

      let startDate: Date;
      let endDate: Date;
      let name: string | null = null;

      if (detectedSemester) {
        // Use detected semester dates
        startDate = detectedSemester.startDate;
        endDate = detectedSemester.endDate;
        name = detectedSemester.name;
      } else if (calendarData?.semesterStartDate && calendarData?.semesterEndDate) {
        // Fall back to configured dates
        startDate = new Date(calendarData.semesterStartDate);
        endDate = new Date(calendarData.semesterEndDate);
      } else {
        // Fall back to defaults
        startDate = defaultStartDate;
        endDate = defaultEndDate;
      }

      // Prioritize admin-configured semester name over auto-detected name
      if (calendarData?.semesterName) {
        name = calendarData.semesterName;
      }

      if (startDate > endDate) {
        return {
          semesterProgress: 0,
          currentWeek: 1,
          semesterName: null,
          semesterStartDate: defaultStartDate,
          semesterEndDate: defaultEndDate,
        };
      }

      const progress = calculateDateProgress(startDate, endDate, stableNow);
      const week = getWeekNumber(startDate, stableNow);

      return {
        semesterProgress: progress,
        currentWeek: week,
        semesterName: name,
        semesterStartDate: startDate,
        semesterEndDate: endDate,
      };
    }, [
      stableNow,
      calendarData?.semesterStartDate,
      calendarData?.semesterEndDate,
      calendarData?.events,
      calendarData?.semesterName,
    ]);

  if (overallLoading || !user) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-transparent border-primary rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-500 dark:text-slate-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const greeting = getGreeting();
  const quote = motivationalQuote;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Hero Section - Greeting & Progress */}
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
        <div className="p-6 md:p-8">
          {/* Greeting Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="relative group">
                {/* Animated outer glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl blur-md opacity-40 group-hover:opacity-60 animate-pulse transition-opacity duration-500"></div>

                {/* Rotating gradient ring */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-2xl blur-sm opacity-20 group-hover:opacity-30 animate-spin-slow"></div>

                {/* Main emoji container */}
                <div
                  className="relative text-5xl md:text-6xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-4 rounded-2xl shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 animate-gradient-shift"
                  style={{ backgroundSize: '200% 200%' }}
                >
                  <span className="drop-shadow-lg filter brightness-110 group-hover:brightness-125 transition-all duration-300">
                    {greeting.emoji}
                  </span>
                </div>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-1 animate-gradient-shift">
                  {greeting.text},
                </h1>
                <p className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white">
                  {user.fullName?.split(' ')[0] || user.name.split(' ')[0]}
                </p>
              </div>
            </div>

            {/* Quick Stats Pills */}
            <div className="flex flex-wrap gap-3">
              <div className="group bg-gradient-to-br from-blue-50 to-blue-100 dark:from-slate-800 dark:to-slate-700 px-5 py-3 rounded-xl border border-blue-200 dark:border-slate-600 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105">
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-1">Today</p>
                <p className="text-sm font-bold text-slate-800 dark:text-white">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div className="group bg-gradient-to-br from-purple-50 to-purple-100 dark:from-slate-800 dark:to-slate-700 px-5 py-3 rounded-xl border border-purple-200 dark:border-slate-600 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105">
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-1">Week</p>
                <p className="text-sm font-bold text-slate-800 dark:text-white">#{currentWeek}</p>
              </div>
            </div>
          </div>

          {/* Motivational Quote */}
          <div className="group relative bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-800/50 dark:via-slate-700/50 dark:to-purple-900/30 border border-slate-200 dark:border-slate-600 rounded-xl p-5 mb-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 overflow-hidden">
            {/* Animated background shimmer */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

            <div className="relative flex items-start gap-3">
              <div className="relative">
                {/* Glow effect for icon */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg blur opacity-40 group-hover:opacity-60 transition-opacity duration-300"></div>
                <div
                  className="relative text-2xl bg-gradient-to-br from-amber-400 via-orange-400 to-orange-500 p-2 rounded-lg shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300"
                  style={{ backgroundSize: '200% 200%' }}
                >
                  <span className="drop-shadow-sm group-hover:drop-shadow-md transition-all duration-300">
                    💡
                  </span>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-slate-700 dark:text-slate-200 text-base font-medium italic leading-relaxed group-hover:text-slate-900 dark:group-hover:text-white transition-colors duration-300">
                  "{quote.text}"
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 font-medium group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors duration-300">
                  — {quote.author}
                </p>
              </div>
            </div>
          </div>

          {/* Semester Progress */}
          <div className="group relative bg-gradient-to-br from-slate-50 to-purple-50 dark:from-slate-800/50 dark:to-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl p-6 overflow-hidden hover:shadow-lg transition-all duration-300">
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-5 dark:opacity-10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-3xl transform translate-x-8 -translate-y-8"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500 rounded-full blur-3xl transform -translate-x-8 translate-y-8"></div>
            </div>

            <div className="relative">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2.5 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <div>
                    <h3 className="text-slate-800 dark:text-white font-bold text-lg">
                      {semesterName ? `${semesterName} Progress` : 'Semester Progress'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Week {currentWeek}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                    {Math.round(semesterProgress)}%
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                    Complete
                  </p>
                </div>
              </div>

              {/* Enhanced Progress Bar */}
              <div className="relative mb-4">
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4 overflow-hidden shadow-inner">
                  <div
                    className="bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                    style={{ width: `${semesterProgress}%` }}
                  >
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                    {/* Pulse overlay */}
                    <div className="absolute inset-0 bg-white/20 group-hover:bg-white/30 transition-all duration-300"></div>
                  </div>
                </div>

                {/* Milestone markers with enhanced visuals */}
                <div className="flex justify-between mt-4 px-1">
                  <div className="flex flex-col items-center gap-1 relative">
                    <div
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${semesterProgress >= 0 ? 'bg-blue-500 shadow-lg shadow-blue-500/50 scale-110' : 'bg-slate-300 dark:bg-slate-600'}`}
                    ></div>
                    <span
                      className={`text-xs font-semibold transition-all duration-300 ${semesterProgress >= 0 ? 'text-blue-600 dark:text-blue-400 scale-105' : 'text-slate-400 dark:text-slate-500'}`}
                    >
                      🚀 Start
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-1 relative">
                    <div
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${semesterProgress >= 50 ? 'bg-purple-500 shadow-lg shadow-purple-500/50 scale-110' : 'bg-slate-300 dark:bg-slate-600'}`}
                    ></div>
                    <span
                      className={`text-xs font-semibold transition-all duration-300 ${semesterProgress >= 50 ? 'text-purple-600 dark:text-purple-400 scale-105' : 'text-slate-400 dark:text-slate-500'}`}
                    >
                      ⚡ Midpoint
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-1 relative">
                    <div
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${semesterProgress >= 100 ? 'bg-blue-500 shadow-lg shadow-blue-500/50 scale-110' : 'bg-slate-300 dark:bg-slate-600'}`}
                    ></div>
                    <span
                      className={`text-xs font-semibold transition-all duration-300 ${semesterProgress >= 100 ? 'text-blue-600 dark:text-blue-400 scale-105' : 'text-slate-400 dark:text-slate-500'}`}
                    >
                      🎓 Finals
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-slate-200 dark:border-slate-600">
                <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 rounded-lg p-3 hover:scale-105 transition-transform duration-200">
                  <div className="text-xl">📅</div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Days Passed
                    </p>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">
                      {Math.max(
                        0,
                        Math.floor(
                          (stableNow.getTime() - semesterStartDate.getTime()) /
                            (1000 * 60 * 60 * 24)
                        )
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 rounded-lg p-3 hover:scale-105 transition-transform duration-200">
                  <div className="text-xl">⏳</div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Days Left
                    </p>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">
                      {Math.max(
                        0,
                        Math.ceil(
                          (semesterEndDate.getTime() - stableNow.getTime()) / (1000 * 60 * 60 * 24)
                        )
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Semester Dates */}
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                  <div className="text-lg">🚀</div>
                  <div>
                    <p className="text-xs text-green-600 dark:text-green-400 font-medium">Starts</p>
                    <p className="text-sm font-bold text-green-700 dark:text-green-300">
                      {semesterStartDate.toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                  <div className="text-lg">🎓</div>
                  <div>
                    <p className="text-xs text-red-600 dark:text-red-400 font-medium">Ends</p>
                    <p className="text-sm font-bold text-red-700 dark:text-red-300">
                      {semesterEndDate.toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {!semesterName && !calendarData ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 text-center">
                  Using default dates •{' '}
                  <Link
                    to="/academic-calendar"
                    className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    Upload your calendar
                  </Link>
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <Link
          to="/schedule"
          className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-105 active:scale-95 cursor-pointer"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-100 font-semibold mb-1">Today's Activities</p>
              <p className="text-5xl font-black text-white mt-2 group-hover:scale-110 transition-transform origin-left">
                {scheduleInfo.classes.length}
              </p>
            </div>
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
              <span className="text-4xl">📚</span>
            </div>
          </div>
        </Link>
        <Link
          to="/grades"
          className="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-105 active:scale-95 cursor-pointer"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-100 font-semibold mb-1">CGPA</p>
              <p className="text-5xl font-black text-white mt-2 group-hover:scale-110 transition-transform origin-left">
                {displayCgpa != null ? displayCgpa.toFixed(2) : 'N/A'}
              </p>
            </div>
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
              <span className="text-4xl">🎯</span>
            </div>
          </div>
        </Link>
        <Link
          to="/academic-calendar"
          className="group relative overflow-hidden bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:scale-105 active:scale-95 cursor-pointer"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-sm text-green-100 font-semibold mb-1">Upcoming Events</p>
              <p className="text-5xl font-black text-white mt-2 group-hover:scale-110 transition-transform origin-left">
                {upcomingEventsCount}
              </p>
            </div>
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
              <span className="text-4xl">📅</span>
            </div>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 md:gap-6">
        {/* Left Column - 2/3 width */}
        <div className="xl:col-span-2 space-y-5 md:space-y-6">
          {/* Today's Classes - Enhanced */}
          <div className="group bg-white dark:bg-dark-card p-4 sm:p-6 rounded-2xl shadow-lg hover:shadow-xl border-2 border-slate-200 dark:border-slate-700 hover:border-primary/30 transition-all duration-300">
            <div className="flex flex-col justify-between items-start mb-6 gap-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full gap-4">
                <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  {scheduleInfo.title}
                </h2>
                <Link
                  to="/schedule"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-dark bg-primary/10 hover:bg-primary/20 px-4 py-2 rounded-lg transition-all duration-200 whitespace-nowrap"
                >
                  <span>Full Schedule</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              </div>

              {/* Enhanced Date Navigation */}
              <div className="w-full space-y-3">
                {/* Day of week and date - Always visible */}
                <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex-1">
                    <div className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">
                      {selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
                    </div>
                    <div className="text-sm md:text-base text-slate-600 dark:text-slate-400 font-medium">
                      {selectedDate.toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                </div>

                {/* Main date navigation and quick actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handlePreviousDay}
                    className="p-2.5 md:p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm hover:shadow-md"
                    title="Previous day (←)"
                    aria-label="Previous day"
                  >
                    <svg
                      className="w-4 h-4 md:w-5 md:h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>

                  <div className="relative">
                    <button
                      onClick={() => setShowDatePicker(!showDatePicker)}
                      className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-medium transition-colors flex items-center gap-2 min-w-[9.375rem]"
                      title="Click to pick a date"
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
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      Jump to date
                    </button>

                    {showDatePicker && (
                      <div className="absolute top-full left-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-3 z-10 min-w-[15.625rem]">
                        <div className="flex items-center gap-2 mb-3">
                          <select
                            value={selectedDate.getMonth()}
                            onChange={(e) => {
                              const newDate = new Date(selectedDate);
                              newDate.setMonth(parseInt(e.target.value));
                              setSelectedDate(newDate);
                              localStorage.setItem('dashboardSelectedDate', newDate.toISOString());
                            }}
                            className="flex-1 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                          >
                            {[
                              'Jan',
                              'Feb',
                              'Mar',
                              'Apr',
                              'May',
                              'Jun',
                              'Jul',
                              'Aug',
                              'Sep',
                              'Oct',
                              'Nov',
                              'Dec',
                            ].map((month, idx) => (
                              <option key={idx} value={idx}>
                                {month}
                              </option>
                            ))}
                          </select>
                          <input
                            type="number"
                            min="2000"
                            max="2100"
                            value={selectedDate.getFullYear()}
                            onChange={(e) => {
                              const year = parseInt(e.target.value);
                              if (!isNaN(year) && year >= 2000 && year <= 2100) {
                                const newDate = new Date(selectedDate);
                                newDate.setFullYear(year);
                                setSelectedDate(newDate);
                                localStorage.setItem(
                                  'dashboardSelectedDate',
                                  newDate.toISOString()
                                );
                              }
                            }}
                            placeholder="YYYY"
                            className="w-20 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-primary focus:outline-none text-center"
                          />
                        </div>
                        <div className="grid grid-cols-7 gap-1 mb-2">
                          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                            <div
                              key={day}
                              className="text-center text-xs font-semibold text-slate-500 dark:text-slate-400 py-1"
                            >
                              {day}
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                          {(() => {
                            const year = selectedDate.getFullYear();
                            const month = selectedDate.getMonth();
                            const firstDay = new Date(year, month, 1).getDay();
                            const daysInMonth = new Date(year, month + 1, 0).getDate();
                            const days = [];

                            // Empty cells for days before month starts
                            for (let i = 0; i < firstDay; i++) {
                              days.push(<div key={`empty-${i}`} />);
                            }

                            // Days of the month
                            for (let day = 1; day <= daysInMonth; day++) {
                              const isSelected = day === selectedDate.getDate();
                              const isToday =
                                new Date().toDateString() ===
                                new Date(year, month, day).toDateString();
                              days.push(
                                <button
                                  key={day}
                                  onClick={() => {
                                    const newDate = new Date(year, month, day);
                                    setSelectedDate(newDate);
                                    localStorage.setItem(
                                      'dashboardSelectedDate',
                                      newDate.toISOString()
                                    );
                                    setShowDatePicker(false);
                                  }}
                                  className={`
                                                                        text-sm py-1.5 rounded transition-colors
                                                                        ${
                                                                          isSelected
                                                                            ? 'bg-primary text-white font-bold'
                                                                            : isToday
                                                                              ? 'bg-blue-100 dark:bg-blue-900/30 text-primary font-semibold'
                                                                              : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                                                                        }
                                                                    `}
                                >
                                  {day}
                                </button>
                              );
                            }

                            return days;
                          })()}
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                          <button
                            onClick={() => setShowDatePicker(false)}
                            className="px-3 py-1 text-xs bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleNextDay}
                    className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    title="Next day (→)"
                    aria-label="Next day"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>

                  <button
                    onClick={handleResetToToday}
                    className="px-3 py-2 text-xs bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors font-medium"
                    title="Jump to today (T)"
                  >
                    Today
                  </button>
                </div>

                {/* Week navigation */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Quick jump:
                  </span>
                  <button
                    onClick={handlePreviousWeek}
                    className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded transition-colors"
                    title="Previous week"
                  >
                    ← Week
                  </button>
                  <button
                    onClick={handleNextWeek}
                    className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded transition-colors"
                    title="Next week"
                  >
                    Week →
                  </button>
                </div>
              </div>
            </div>

            {scheduleInfo.isHoliday ? (
              <>
                {scheduleInfo.infoMessage && (
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-sm text-blue-700 dark:text-blue-300 whitespace-pre-line">
                      {scheduleInfo.infoMessage}
                    </p>
                  </div>
                )}

                {/* Show holiday message */}
                <div className="text-center py-8">
                  {scheduleInfo.isExam ? (
                    <>
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/20 mb-4">
                        <span className="text-4xl">📝</span>
                      </div>
                      <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                        {scheduleInfo.holidayDescription}
                      </h3>
                      <p className="mt-1 text-slate-600 dark:text-slate-400 font-medium">
                        Classes are suspended - Focus on exam preparation! 📚
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
                        <span className="text-4xl">🎉</span>
                      </div>
                      <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                        {scheduleInfo.holidayDescription}
                      </h3>
                      <p className="mt-1 text-slate-500 dark:text-slate-400">Enjoy your day off!</p>
                    </>
                  )}
                </div>

                {/* Show personal tasks if any exist */}
                {scheduleInfo.classes.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-purple-500"></span>
                      Your Personal Tasks
                    </h4>
                    <ul className="space-y-3">
                      {scheduleInfo.classes.map((c, index) => (
                        <li key={c.slotId} className="relative pl-8">
                          {/* Timeline segment for this task */}
                          {index < scheduleInfo.classes.length - 1 && (
                            <div
                              className="absolute left-2.5 w-0.5 bg-purple-300 dark:bg-purple-600"
                              style={{
                                top: '1.25rem',
                                height: 'calc(100% + 0.75rem)',
                              }}
                            />
                          )}

                          <div className="absolute left-0 top-2.5 h-5 w-5 rounded-full flex items-center justify-center bg-purple-500 ring-4 ring-purple-500/15">
                            <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
                          </div>

                          <div className="py-2">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                                    {c.startTime} - {c.endTime}
                                  </span>
                                </div>
                                <p className="font-semibold text-sm mb-2 text-slate-900 dark:text-white">
                                  {c.courseName}
                                </p>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                                  <span className="flex items-center gap-1">
                                    <span
                                      className={`inline-block px-2 py-0.5 rounded text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30`}
                                    >
                                      ✓ {c.courseCode}
                                    </span>
                                  </span>
                                  {c.location && (
                                    <span className="flex items-center gap-1">
                                      <LocationIcon className="w-3.5 h-3.5" />
                                      {c.location}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <>
                {scheduleInfo.infoMessage && (
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-sm text-blue-700 dark:text-blue-300 whitespace-pre-line">
                      {scheduleInfo.infoMessage}
                    </p>
                  </div>
                )}
                {scheduleInfo.classes.length > 0 ? (
                  <div className="relative">
                    <ul className="space-y-3">
                      {scheduleInfo.classes.map((c, index) => {
                        const isPast = upcomingClassIndex !== -1 && index < upcomingClassIndex;
                        const isCurrentOrNext = index === upcomingClassIndex;
                        const isCurrent = isCurrentOrNext && c.startTime <= currentTime;
                        const isNext = isCurrentOrNext && !isCurrent;

                        return (
                          <li
                            key={c.slotId}
                            className={`relative pl-8 transition-all duration-700 ease-out ${
                              allClassesCompleted ? 'opacity-50' : isPast ? 'opacity-35' : ''
                            }`}
                          >
                            {/* Timeline segment for this class */}
                            {index < scheduleInfo.classes.length - 1 && (
                              <div
                                className={`absolute left-2.5 w-0.5 transition-all duration-700 ease-out ${
                                  allClassesCompleted || isPast
                                    ? 'bg-emerald-500/80 dark:bg-emerald-400/80'
                                    : 'bg-slate-300 dark:bg-slate-600'
                                }`}
                                style={{
                                  top: '1.25rem',
                                  height: 'calc(100% + 0.75rem)', // Extends to next item (space-y-3 = 0.75rem)
                                }}
                              />
                            )}

                            <div
                              className={`absolute left-0 top-2.5 h-5 w-5 rounded-full flex items-center justify-center transition-all duration-500 ease-out ${
                                isCurrent
                                  ? 'bg-primary ring-4 ring-primary/20 scale-110 shadow-md'
                                  : isNext
                                    ? 'bg-amber-500 ring-4 ring-amber-500/20 scale-110 shadow-md'
                                    : isPast || allClassesCompleted
                                      ? 'bg-emerald-500/90 ring-4 ring-emerald-500/15 dark:bg-emerald-400/90 dark:ring-emerald-400/15'
                                      : 'bg-slate-300 dark:bg-slate-600 ring-4 ring-slate-200 dark:ring-slate-700'
                              }`}
                            >
                              {isPast || allClassesCompleted ? (
                                <svg
                                  className="w-3 h-3 text-white"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
                              )}
                            </div>

                            <div
                              className={`transition-all duration-500 ease-out ${
                                isCurrent
                                  ? 'bg-primary/5 border-l-2 border-primary pl-4 pr-3 py-3 rounded-r-lg'
                                  : isNext
                                    ? 'bg-amber-50 dark:bg-amber-900/10 border-l-2 border-amber-500 pl-4 pr-3 py-3 rounded-r-lg'
                                    : 'py-2'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span
                                      className={`text-xs font-semibold transition-colors duration-500 ${
                                        isCurrent
                                          ? 'text-primary'
                                          : isPast || allClassesCompleted
                                            ? 'text-emerald-600/80 dark:text-emerald-400/80'
                                            : 'text-slate-500 dark:text-slate-400'
                                      }`}
                                    >
                                      {c.startTime} - {c.endTime}
                                    </span>
                                    {isCurrent && (
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-bold bg-primary text-white animate-pulse">
                                        NOW
                                      </span>
                                    )}
                                    {isNext && (
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-bold bg-amber-500 text-white">
                                        NEXT
                                      </span>
                                    )}
                                  </div>
                                  <p
                                    className={`font-semibold text-sm mb-2 transition-all duration-500 ${
                                      isPast || allClassesCompleted
                                        ? 'text-slate-400 dark:text-slate-500'
                                        : 'text-slate-900 dark:text-white'
                                    }`}
                                  >
                                    {c.courseName}
                                  </p>
                                  <div
                                    className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-xs transition-colors duration-500 ${
                                      isPast || allClassesCompleted
                                        ? 'text-slate-400 dark:text-slate-600'
                                        : 'text-slate-500 dark:text-slate-400'
                                    }`}
                                  >
                                    <span className="flex items-center gap-1">
                                      <InstructorIcon className="w-3.5 h-3.5" />
                                      {c.instructor}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <LocationIcon className="w-3.5 h-3.5" />
                                      {c.location}
                                    </span>
                                    <span
                                      className={`px-2 py-0.5 rounded-md text-xs font-medium transition-colors duration-500 ${
                                        isPast || allClassesCompleted ? 'opacity-60' : ''
                                      } ${getClassColor(c.courseCode, c.isCustomTask)}`}
                                    >
                                      {c.isCustomTask ? '✓ ' : ''}
                                      {c.courseCode}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
                      <CalendarCheckIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                      No Classes Scheduled!
                    </h3>
                    <p className="mt-1 text-slate-500 dark:text-slate-400">
                      Enjoy your free day or catch up on assignments.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Upcoming Deadlines Widget - From Calendar Reminders */}
          <div className="bg-white dark:bg-dark-card p-6 rounded-xl shadow-md border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-semibold">Upcoming Reminders</h2>
                {calendarData &&
                  calendarData.events &&
                  (() => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const count = calendarData.events.filter((event) => {
                      const eventKey = getEventKey(event);
                      const isUserCreatedWithReminder = event.remindMe === true && !!event.userId;
                      const isPreloadedWithReminder =
                        !event.userId && reminderPreferences.includes(eventKey);

                      if (!isUserCreatedWithReminder && !isPreloadedWithReminder) return false;

                      // Include ongoing and future events
                      const eventStartDate = new Date(event.date);
                      const eventEndDate = new Date(event.endDate || event.date);
                      eventStartDate.setHours(0, 0, 0, 0);
                      eventEndDate.setHours(0, 0, 0, 0);

                      const isOngoing = eventStartDate < today && eventEndDate >= today;
                      const daysUntil = Math.ceil(
                        (eventStartDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                      );

                      return daysUntil >= 0 || isOngoing;
                    }).length;
                    return count > 0 ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {count} {count === 1 ? 'reminder' : 'reminders'} active
                      </p>
                    ) : null;
                  })()}
              </div>
              <Link
                to="/academic-calendar"
                className="text-sm text-primary hover:text-primary-dark"
              >
                View Calendar →
              </Link>
            </div>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
              {(() => {
                if (!calendarData || !calendarData.events) {
                  return (
                    <div className="text-center py-8">
                      <p className="text-slate-500 dark:text-slate-400 text-sm">
                        Loading reminders...
                      </p>
                    </div>
                  );
                }

                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const reminderEvents = calendarData.events
                  .filter((event: CalendarEvent) => {
                    const eventKey = getEventKey(event);

                    // Show if: user-created event with remindMe OR preloaded event in user's preferences
                    const isUserCreatedWithReminder = event.remindMe === true && !!event.userId;
                    const isPreloadedWithReminder =
                      !event.userId && reminderPreferences.includes(eventKey);

                    if (!isUserCreatedWithReminder && !isPreloadedWithReminder) return false;

                    // Check if event is passed
                    const eventStartDate = new Date(event.date);
                    const eventEndDate = new Date(event.endDate || event.date);
                    eventStartDate.setHours(0, 0, 0, 0);
                    eventEndDate.setHours(0, 0, 0, 0);

                    const isOngoing = eventStartDate < today && eventEndDate >= today;
                    const daysUntil = Math.ceil(
                      (eventStartDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                    );

                    // Only show if upcoming (daysUntil >= 0) OR ongoing
                    return daysUntil >= 0 || isOngoing;
                  })
                  .sort(
                    (a: CalendarEvent, b: CalendarEvent) =>
                      new Date(a.date).getTime() - new Date(b.date).getTime()
                  );

                if (reminderEvents.length === 0) {
                  return (
                    <div className="text-center py-8">
                      <p className="text-slate-500 dark:text-slate-400 text-sm">
                        No upcoming reminders
                      </p>
                      <p className="text-xs text-slate-400 mt-2">
                        Total events: {calendarData.events.length}
                      </p>
                      <Link
                        to="/academic-calendar"
                        className="text-sm text-primary hover:text-primary-dark mt-2 inline-block"
                      >
                        Add events with "Remind Me" →
                      </Link>
                    </div>
                  );
                }

                return reminderEvents.map((event, index) => {
                  const eventStartDate = new Date(event.date);
                  const eventEndDate = new Date(event.endDate || event.date);
                  const todayDate = new Date();
                  eventStartDate.setHours(0, 0, 0, 0);
                  eventEndDate.setHours(0, 0, 0, 0);
                  todayDate.setHours(0, 0, 0, 0);

                  const daysUntil = Math.ceil(
                    (eventStartDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24)
                  );
                  const isOngoing = eventStartDate < todayDate && eventEndDate >= todayDate;
                  const isUrgent = !isOngoing && daysUntil <= 2;
                  const isWarning = !isOngoing && daysUntil > 2 && daysUntil <= 7;
                  const isUserEvent = !!event.userId;

                  return (
                    <div
                      key={event.id || index}
                      className={`group flex items-center gap-3 p-3 rounded-lg border-l-4 ${
                        isOngoing
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
                          : isUrgent
                            ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
                            : isWarning
                              ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-500'
                              : 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                      }`}
                    >
                      {/* Dynamic Event Icon */}
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 shadow-sm">
                          <span className="text-2xl">{getEventEmoji(event)}</span>
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{event.description}</p>
                          {isUserEvent && (
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                              title="User-created event"
                            >
                              <svg
                                className="w-3 h-3 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                              </svg>
                              Personal
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{event.type}</p>
                      </div>
                      <div className="flex items-center flex-shrink-0 ml-4">
                        <div className="text-right">
                          <p
                            className={`text-sm font-semibold ${
                              isOngoing
                                ? 'text-green-600'
                                : isUrgent
                                  ? 'text-red-600'
                                  : isWarning
                                    ? 'text-amber-600'
                                    : 'text-blue-600'
                            }`}
                          >
                            {isOngoing
                              ? 'Ongoing'
                              : daysUntil === 0
                                ? 'Today'
                                : daysUntil === 1
                                  ? 'Tomorrow'
                                  : `In ${daysUntil} days`}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(event.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              // For user-defined events, turn off remindMe flag and toggle preference
                              if (event.userId && event.id) {
                                await updateUserEvent(event.id, {
                                  ...event,
                                  remindMe: false,
                                });
                                // Also toggle the reminder preference for consistency
                                const eventKey = getEventKey(event);
                                if (reminderPreferences.includes(eventKey)) {
                                  await toggleReminderPreference(eventKey);
                                }
                              } else {
                                // For preloaded events, just toggle the reminder preference
                                await toggleReminderPreference(getEventKey(event));
                              }
                            } catch (error) {
                              console.error('Error removing reminder:', error);
                              alert('Failed to remove reminder');
                            }
                          }}
                          className="ml-2 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove reminder"
                          aria-label="Remove reminder"
                        >
                          <svg
                            className="w-5 h-5 text-slate-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                            ></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          {/* Quick Links - Compact & Flexible */}
          <div className="bg-gradient-to-br from-white to-slate-50 dark:from-dark-card dark:to-slate-900/50 p-4 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg">
                  <svg
                    className="w-4 h-4 text-primary dark:text-secondary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                </div>
                <h3 className="text-base font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Quick Access
                </h3>
              </div>
              <button
                onClick={() => setIsManagingLinks(!isManagingLinks)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs text-white bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105"
              >
                {isManagingLinks ? (
                  <>
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Done
                  </>
                ) : (
                  <>
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                      />
                    </svg>
                    Manage
                  </>
                )}
              </button>
            </div>

            {/* Search Bar */}
            {quickLinks.length > 6 && (
              <div className="mb-3 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search links..."
                  className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-primary dark:focus:border-secondary transition-all duration-200 placeholder-slate-400 dark:placeholder-slate-500"
                />
                <svg
                  className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2"
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
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    <svg
                      className="w-3.5 h-3.5"
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
            )}

            {isManagingLinks && (
              <div className="mb-3 grid grid-cols-2 gap-2 animate-fadeIn">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="py-1.5 px-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg transition-all duration-300 text-xs font-medium shadow-md hover:shadow-lg hover:scale-105 flex items-center justify-center gap-1.5"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add Link
                </button>
                <button
                  onClick={handleResetToDefault}
                  className="py-1.5 px-3 bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white rounded-lg transition-all duration-300 text-xs font-medium shadow-md hover:shadow-lg hover:scale-105 flex items-center justify-center gap-1.5"
                >
                  <svg
                    className="w-3.5 h-3.5"
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
                  Reset
                </button>
              </div>
            )}

            {isManagingLinks && (
              <div className="mb-2 px-2.5 py-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start gap-2 text-xs text-blue-700 dark:text-blue-300">
                <svg
                  className="w-3.5 h-3.5 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Drag to reorder • Click to edit/delete</span>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2.5 auto-rows-fr">
              {filteredLinks.length > 0 ? (
                filteredLinks.map((link) => (
                  <div
                    key={link.id}
                    className={`relative group ${isManagingLinks ? 'cursor-move' : ''} ${draggedLinkId === link.id ? 'opacity-50 scale-95' : ''} transition-all duration-200 h-full`}
                    draggable={isManagingLinks && editingLink?.id !== link.id}
                    onDragStart={(e) => handleDragStart(e, link.id)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, link.id)}
                    onDragEnd={handleDragEnd}
                  >
                    {editingLink?.id === link.id ? (
                      <div className="h-full min-h-[6.875rem] p-2.5 rounded-lg border-2 border-primary bg-gradient-to-br from-primary/5 to-secondary/5 space-y-1.5 shadow-lg animate-fadeIn flex flex-col">
                        <input
                          type="text"
                          value={editingLink.name}
                          onChange={(e) => setEditingLink({ ...editingLink, name: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 focus:border-primary dark:focus:border-secondary focus:outline-none transition-colors"
                          placeholder="Name"
                        />
                        <input
                          type="text"
                          value={editingLink.href}
                          onChange={(e) => setEditingLink({ ...editingLink, href: e.target.value })}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-md dark:bg-slate-700 focus:border-primary dark:focus:border-secondary focus:outline-none transition-colors"
                          placeholder="URL"
                        />
                        <button
                          onClick={() => handleEditLink(link)}
                          className="w-full py-1.5 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white rounded-md text-xs font-medium transition-all duration-300 shadow-md hover:shadow-lg mt-auto"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => isManagingLinks && e.preventDefault()}
                        className="h-full min-h-[6.875rem] flex flex-col items-center justify-center p-3 rounded-lg bg-white dark:bg-slate-800/50 hover:bg-gradient-to-br hover:from-primary/5 hover:to-secondary/5 transition-all duration-300 hover:shadow-lg hover:scale-105 border border-transparent hover:border-primary/20 dark:hover:border-secondary/20 backdrop-blur-sm"
                      >
                        <div
                          className={`text-2xl mb-2 ${link.color} group-hover:scale-110 transition-all duration-300 transform group-hover:rotate-6 flex-shrink-0`}
                        >
                          {getIconForLink(link)}
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center w-full">
                          <span
                            className="text-[11px] text-center font-medium text-slate-600 dark:text-slate-300 group-hover:text-primary dark:group-hover:text-secondary transition-colors line-clamp-2 w-full px-1 break-words leading-tight"
                            title={link.name}
                          >
                            {link.name}
                          </span>
                          {link.isCustom && (
                            <span className="mt-1.5 px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-[9px] font-medium flex-shrink-0">
                              Custom
                            </span>
                          )}
                        </div>
                      </a>
                    )}

                    {isManagingLinks && editingLink?.id !== link.id && (
                      <div className="absolute -top-1.5 -right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10">
                        <button
                          onClick={() => handleEditLink(link)}
                          className="p-1 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200"
                          title="Edit"
                        >
                          <svg
                            className="w-2.5 h-2.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleRemoveLink(link.id)}
                          className="p-1 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-full hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200"
                          title="Delete"
                        >
                          <svg
                            className="w-2.5 h-2.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="col-span-full py-6 text-center">
                  <svg
                    className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <p className="text-xs text-slate-500 dark:text-slate-400">No links found</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Try a different search term
                  </p>
                </div>
              )}
            </div>

            {/* Link count indicator */}
            {quickLinks.length > 0 && (
              <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  {filteredLinks.length} of {quickLinks.length} links
                </span>
                {searchQuery && (
                  <span className="text-primary dark:text-secondary font-medium">Filtered</span>
                )}
              </div>
            )}
          </div>

          {/* Weather Widget - Enhanced & Interactive */}
          <div
            onClick={() => weather && setShowWeatherModal(true)}
            className="group bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 p-4 sm:p-6 rounded-2xl shadow-md border border-sky-200 dark:border-sky-700/50 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                  <span className="text-sky-500 text-xl sm:text-2xl animate-pulse">🌤️</span>
                  <span className="bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
                    Weather
                  </span>
                </h3>
                <p className="text-xs text-sky-600/60 dark:text-sky-400/60 mt-1 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                  Click for detailed weather info
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  fetchWeather();
                }}
                disabled={weatherLoading}
                className="p-2 rounded-lg hover:bg-sky-100 dark:hover:bg-sky-800/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group-hover:rotate-180"
                title="Refresh weather"
              >
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 text-sky-600 dark:text-sky-400"
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
              </button>
            </div>

            {/* City Selector Dropdown with Search */}
            <div
              className="mb-3 relative"
              ref={cityDropdownRef}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative group/dropdown">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10 transition-transform group-hover/dropdown:scale-110 duration-200">
                  <svg
                    className="w-4 h-4 text-sky-600 dark:text-sky-400 group-hover/dropdown:text-sky-700 dark:group-hover/dropdown:text-sky-300 transition-colors drop-shadow-sm"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>

                {/* Search Input */}
                <input
                  type="text"
                  value={citySearchOpen ? citySearchQuery : selectedCity.name}
                  onChange={(e) => {
                    setCitySearchQuery(e.target.value);
                    setCitySearchOpen(true);
                  }}
                  onFocus={() => setCitySearchOpen(true)}
                  placeholder="Search city..."
                  className={`w-full pl-9 pr-9 py-2.5 text-xs font-bold backdrop-blur-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md ${
                    citySearchOpen
                      ? 'bg-white dark:bg-slate-800 border-sky-300/40 dark:border-sky-600/40 text-sky-800 dark:text-sky-100 hover:border-sky-400/60 dark:hover:border-sky-500/60'
                      : 'bg-transparent border-sky-300/30 dark:border-sky-600/30 text-sky-700 dark:text-sky-200 hover:border-sky-400/50 dark:hover:border-sky-500/50'
                  }`}
                />

                {/* Dropdown Arrow */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg
                    className={`w-4 h-4 text-sky-600 dark:text-sky-400 transition-transform duration-200 ${citySearchOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 8l4 4 4-4"
                    />
                  </svg>
                </div>

                {/* Dropdown List */}
                {citySearchOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-sky-200 dark:border-sky-700 rounded-lg shadow-xl max-h-60 overflow-y-auto z-50">
                    {filteredCities.length > 0 ? (
                      filteredCities.map((city) => (
                        <button
                          key={`${city.name}-${city.state}`}
                          onClick={() => handleCityChange(city)}
                          className={`w-full text-left px-4 py-2.5 text-xs hover:bg-sky-50 dark:hover:bg-sky-900/30 transition-colors ${
                            selectedCity.name === city.name && selectedCity.state === city.state
                              ? 'bg-sky-100 dark:bg-sky-900/50 text-sky-800 dark:text-sky-200 font-bold'
                              : 'text-slate-700 dark:text-slate-300 font-medium'
                          }`}
                        >
                          <span className="block">{city.name}</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">
                            {city.state}
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                        No cities found
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            {weatherLoading ? (
              <div className="flex flex-col items-center justify-center h-32 space-y-3">
                <div className="w-12 h-12 border-4 border-t-transparent border-sky-500 rounded-full animate-spin"></div>
                <p className="text-xs text-sky-600 dark:text-sky-400 animate-pulse">
                  Fetching weather...
                </p>
              </div>
            ) : weatherError ? (
              <div className="text-center py-6">
                <p className="text-red-500 text-sm mb-3">⚠️ {weatherError}</p>
                <button
                  onClick={() => fetchWeather()}
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-sm transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : weather ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <p className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-br from-sky-600 to-blue-600 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300">
                        {weather.temp}°
                      </p>
                      <span className="text-2xl sm:text-3xl font-semibold text-sky-500/60">C</span>
                    </div>
                    <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-2 font-medium">
                      {weather.desc}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {selectedCity.name}, {selectedCity.state}
                    </p>
                  </div>
                  <div className="text-6xl sm:text-7xl md:text-8xl drop-shadow-2xl group-hover:scale-110 transition-transform duration-300">
                    {weather.icon}
                  </div>
                </div>

                {/* Quick Student-Relevant Weather Info */}
                {detailedWeather && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="bg-sky-100/50 dark:bg-sky-900/20 rounded-lg p-2 text-center">
                      <p className="text-[10px] text-sky-600 dark:text-sky-400 font-medium">
                        Feels Like
                      </p>
                      <p className="text-sm font-bold text-sky-800 dark:text-sky-200">
                        {detailedWeather.feelsLike.toFixed(0)}°C
                      </p>
                    </div>
                    <div className="bg-blue-100/50 dark:bg-blue-900/20 rounded-lg p-2 text-center">
                      <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                        Humidity
                      </p>
                      <p className="text-sm font-bold text-blue-800 dark:text-blue-200">
                        {detailedWeather.humidity}%
                      </p>
                    </div>
                    <div className="bg-indigo-100/50 dark:bg-indigo-900/20 rounded-lg p-2 text-center">
                      <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                        UV Index
                      </p>
                      <p className="text-sm font-bold text-indigo-800 dark:text-indigo-200">
                        {detailedWeather.uvIndex.toFixed(0)}
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-sky-300/50 dark:border-sky-700/50">
                  {recommendationLoading ? (
                    <div className="animate-pulse flex space-x-3">
                      <div className="text-base font-medium text-sky-700 dark:text-sky-300">✨</div>
                      <div className="flex-1 space-y-3 py-1">
                        <div className="h-3 bg-sky-200/50 dark:bg-sky-700/50 rounded"></div>
                        <div className="h-3 bg-sky-200/50 dark:bg-sky-700/50 rounded w-5/6"></div>
                        <div className="h-3 bg-sky-200/50 dark:bg-sky-700/50 rounded w-4/6"></div>
                      </div>
                    </div>
                  ) : recommendationError ? (
                    <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                      <span>⚠️</span> {recommendationError}
                    </p>
                  ) : (
                    recommendation && (
                      <div className="bg-sky-100/50 dark:bg-sky-900/30 rounded-xl p-3 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors">
                        <h4 className="text-xs sm:text-sm font-semibold text-sky-800 dark:text-sky-200 mb-2 flex items-center gap-2">
                          <span className="text-base">✨</span>
                          <span>Weather Advice</span>
                        </h4>
                        <p className="text-xs sm:text-sm text-sky-700 dark:text-sky-300 whitespace-pre-line leading-relaxed">
                          {recommendation}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Weather Details Modal */}
      {showWeatherModal && detailedWeather && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowWeatherModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/40 dark:to-blue-900/40 backdrop-blur-sm border-b border-sky-200 dark:border-sky-700 p-6 rounded-t-2xl">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="text-6xl drop-shadow-lg">{detailedWeather.icon}</div>
                  <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
                      {detailedWeather.temp}°C
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 font-medium">
                      {detailedWeather.desc}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-500 flex items-center gap-1 mt-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {selectedCity.name}, {selectedCity.state}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowWeatherModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Feels Like Temperature */}
              <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-4 rounded-xl border border-orange-200 dark:border-orange-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">🌡️</div>
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                        Feels Like
                      </p>
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {detailedWeather.feelsLike.toFixed(1)}°C
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Weather Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Humidity */}
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-700/50">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">💧</div>
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                        Humidity
                      </p>
                      <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        {detailedWeather.humidity}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Wind Speed */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-700/50">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">💨</div>
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                        Wind Speed
                      </p>
                      <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                        {detailedWeather.windSpeed.toFixed(1)} km/h
                      </p>
                      <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">
                        {getWindDirection(detailedWeather.windDirection)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pressure */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-xl border border-purple-200 dark:border-purple-700/50">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">🎚️</div>
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                        Pressure
                      </p>
                      <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                        {detailedWeather.pressure.toFixed(0)} hPa
                      </p>
                    </div>
                  </div>
                </div>

                {/* UV Index */}
                <div className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 p-4 rounded-xl border border-yellow-200 dark:border-yellow-700/50">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">☀️</div>
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                        UV Index
                      </p>
                      <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                        {detailedWeather.uvIndex.toFixed(1)}
                      </p>
                      <p className="text-xs text-yellow-600/70 dark:text-yellow-400/70">
                        {detailedWeather.uvIndex < 3
                          ? 'Low'
                          : detailedWeather.uvIndex < 6
                            ? 'Moderate'
                            : detailedWeather.uvIndex < 8
                              ? 'High'
                              : 'Very High'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Precipitation */}
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 p-4 rounded-xl border border-indigo-200 dark:border-indigo-700/50">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">🌧️</div>
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                        Precipitation
                      </p>
                      <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                        {detailedWeather.precipitation.toFixed(1)} mm
                      </p>
                    </div>
                  </div>
                </div>

                {/* Visibility */}
                <div className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/20 dark:to-gray-900/20 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">👁️</div>
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                        Visibility
                      </p>
                      <p className="text-xl font-bold text-slate-600 dark:text-slate-400">
                        {detailedWeather.visibility} km
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Recommendation in Modal */}
              {recommendation && (
                <div className="bg-sky-100/50 dark:bg-sky-900/30 rounded-xl p-4 border border-sky-200 dark:border-sky-700/50">
                  <h4 className="text-sm font-semibold text-sky-800 dark:text-sky-200 mb-3 flex items-center gap-2">
                    <span className="text-xl">✨</span>
                    <span>Weather Advice</span>
                  </h4>
                  <p className="text-sm text-sky-700 dark:text-sky-300 whitespace-pre-line leading-relaxed">
                    {recommendation}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 p-4 rounded-b-2xl flex justify-end gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  fetchWeather();
                }}
                disabled={weatherLoading}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg
                  className={`w-4 h-4 ${weatherLoading ? 'animate-spin' : ''}`}
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
                Refresh
              </button>
              <button
                onClick={() => setShowWeatherModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Link Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Add Quick Link</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewLink({
                    name: '',
                    href: '',
                    color: 'text-blue-600 dark:text-blue-400',
                    icon: 'website',
                  });
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Link Name</label>
                <input
                  type="text"
                  value={newLink.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewLink({ ...newLink, name: e.target.value })
                  }
                  placeholder="e.g., Google Drive"
                  className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">URL</label>
                <input
                  type="text"
                  value={newLink.href}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewLink({ ...newLink, href: e.target.value })
                  }
                  placeholder="e.g., drive.google.com"
                  className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-slate-500 mt-1">
                  https:// will be added automatically if not provided
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Icon</label>
                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-2">
                  {[
                    { name: 'Website', icon: 'website', component: <WebsiteIcon /> },
                    { name: 'Cloud', icon: 'cloud', component: <CloudIcon /> },
                    { name: 'Video', icon: 'video', component: <VideoIcon /> },
                    { name: 'Code', icon: 'code', component: <CodeIcon /> },
                    { name: 'Chat', icon: 'chat', component: <ChatIcon /> },
                    { name: 'Document', icon: 'document', component: <DocumentIcon /> },
                    { name: 'Music', icon: 'music', component: <MusicIcon /> },
                    { name: 'Shopping', icon: 'shopping', component: <ShoppingIcon /> },
                    { name: 'Photo', icon: 'photo', component: <PhotoIcon /> },
                    { name: 'Calculator', icon: 'calculator', component: <CalculatorIcon /> },
                    { name: 'Game', icon: 'game', component: <GameIcon /> },
                    { name: 'Bookmark', icon: 'bookmark', component: <BookmarkIcon /> },
                    { name: 'Newspaper', icon: 'newspaper', component: <NewspaperIcon /> },
                  ].map((iconOption) => (
                    <button
                      key={iconOption.icon}
                      onClick={() => setNewLink({ ...newLink, icon: iconOption.icon })}
                      className={`p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                        newLink.icon === iconOption.icon
                          ? 'border-primary bg-primary/10 shadow-md'
                          : 'border-slate-200 dark:border-slate-600 hover:border-primary/50'
                      }`}
                      title={iconOption.name}
                    >
                      <div className={`${newLink.color} text-2xl`}>{iconOption.component}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Color</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { name: 'Blue', value: 'text-blue-600 dark:text-blue-400' },
                    { name: 'Red', value: 'text-red-600 dark:text-red-400' },
                    { name: 'Green', value: 'text-green-600 dark:text-green-400' },
                    { name: 'Purple', value: 'text-purple-600 dark:text-purple-400' },
                    { name: 'Orange', value: 'text-orange-600 dark:text-orange-400' },
                    { name: 'Teal', value: 'text-teal-600 dark:text-teal-400' },
                    { name: 'Pink', value: 'text-pink-600 dark:text-pink-400' },
                    { name: 'Indigo', value: 'text-indigo-600 dark:text-indigo-400' },
                  ].map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setNewLink({ ...newLink, color: color.value })}
                      className={`p-2 rounded-lg border-2 transition-all ${
                        newLink.color === color.value
                          ? 'border-primary bg-primary/10'
                          : 'border-slate-200 dark:border-slate-600 hover:border-primary/50'
                      }`}
                    >
                      <div className={`${color.value} text-xl`}>{getIconByName(newLink.icon)}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewLink({
                      name: '',
                      href: '',
                      color: 'text-blue-600 dark:text-blue-400',
                      icon: 'website',
                    });
                  }}
                  className="flex-1 py-2 px-4 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddLink}
                  disabled={!newLink.name || !newLink.href}
                  className="flex-1 py-2 px-4 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(Dashboard);
