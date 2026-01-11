// Time intervals (in milliseconds)
export const TIME_INTERVALS = {
  DAY_CHECK: 60000, // 1 minute
  MINUTE: 60000,
  HOUR: 3600000,
  DAY: 86400000,
  WEEK: 604800000,
} as const;

// File upload limits
export const FILE_LIMITS = {
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
} as const;

// Greeting time thresholds (hours)
export const GREETING_TIMES = {
  MORNING_END: 12,
  AFTERNOON_END: 17,
} as const;

// Semester defaults
export const SEMESTER_DEFAULTS = {
  START_MONTH: 0, // January
  START_DAY: 15,
  END_MONTH: 4, // May
  END_DAY: 15,
} as const;

// UI Constants
export const UI = {
  MAX_LOADING_HEIGHT: 'calc(100vh-10rem)',
  LOADER_SIZE: {
    SMALL: 'w-8 h-8',
    MEDIUM: 'w-12 h-12',
    LARGE: 'w-16 h-16',
  },
} as const;

// Weather API
export const WEATHER = {
  DHANBAD_LAT: 23.7879,
  DHANBAD_LON: 86.4304,
} as const;
