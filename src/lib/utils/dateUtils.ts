/**
 * Date utility functions for consistent date/time operations across the app
 */

/**
 * Format a date as YYYY-MM-DD string for input fields
 */
export const toInputDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Format time as HH:MM string
 */
export const formatTime = (date: Date): string => {
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

/**
 * Check if a date is today
 */
export const isToday = (date: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate.getTime() === today.getTime();
};

/**
 * Check if two dates are the same day
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
  const d1 = new Date(date1);
  d1.setHours(0, 0, 0, 0);
  const d2 = new Date(date2);
  d2.setHours(0, 0, 0, 0);
  return d1.getTime() === d2.getTime();
};

/**
 * Get date with time set to midnight
 */
export const getDateAtMidnight = (date: Date): Date => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

/**
 * Add days to a date
 */
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Get the day name from a date
 */
export const getDayName = (date: Date): string => {
  return date.toLocaleDateString('en-US', { weekday: 'long' });
};

/**
 * Format date for display (e.g., "Monday, Jan 15")
 */
export const formatDateShort = (date: Date): string => {
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
};

/**
 * Format date for display (e.g., "January 15, 2025")
 */
export const formatDateLong = (date: Date): string => {
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

/**
 * Parse date string (YYYY-MM-DD) to Date object
 */
export const parseDateString = (dateString: string): Date => {
  const parts = dateString.split('-').map(Number);
  if (parts.length !== 3) {
    console.error(`Invalid date string format: ${dateString}`);
    return new Date(); // Return current date as fallback
  }
  const [year, month, day] = parts as [number, number, number];
  return new Date(year, month - 1, day);
};

/**
 * Calculate progress percentage between two dates
 */
export const calculateDateProgress = (
  startDate: Date,
  endDate: Date,
  currentDate: Date = new Date()
): number => {
  if (startDate > endDate) return 0;

  const totalMs = endDate.getTime() - startDate.getTime();
  const elapsedMs = currentDate.getTime() - startDate.getTime();
  return Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));
};

/**
 * Calculate week number from a date relative to a start date
 */
export const getWeekNumber = (startDate: Date, currentDate: Date = new Date()): number => {
  const elapsedMs = currentDate.getTime() - startDate.getTime();
  return Math.max(1, Math.ceil(elapsedMs / (1000 * 60 * 60 * 24 * 7)));
};

/**
 * Format date with month name (e.g., "Jan 15, 2025")
 */
export const formatDateWithMonthName = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

/**
 * Format date range (e.g., "Jan 15 - Feb 20, 2025" or "Jan 15, 2025")
 */
export const formatDateRange = (startDateString: string, endDateString?: string | null): string => {
  const startDate = new Date(startDateString);

  if (!endDateString) {
    return formatDateWithMonthName(startDateString);
  }

  const endDate = new Date(endDateString);
  const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
  const startDay = startDate.getDate();
  const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
  const endDay = endDate.getDate();
  const year = endDate.getFullYear();

  // Same month and year
  if (
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getFullYear() === endDate.getFullYear()
  ) {
    return `${startMonth} ${startDay} - ${endDay}, ${year}`;
  }

  // Same year
  if (startDate.getFullYear() === endDate.getFullYear()) {
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
  }

  // Different years
  return `${startMonth} ${startDay}, ${startDate.getFullYear()} - ${endMonth} ${endDay}, ${year}`;
};
