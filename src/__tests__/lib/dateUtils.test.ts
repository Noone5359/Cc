import { describe, it, expect } from 'vitest';
import {
  toInputDateString,
  formatTime,
  isToday,
  isSameDay,
  addDays,
  getDayName,
  parseDateString,
  calculateDateProgress,
  formatDateRange,
} from '@lib/utils/dateUtils';

describe('dateUtils', () => {
  describe('toInputDateString', () => {
    it('formats date correctly with single digit month and day', () => {
      const date = new Date(2025, 0, 5); // January 5, 2025
      expect(toInputDateString(date)).toBe('2025-01-05');
    });

    it('formats date correctly with double digit month and day', () => {
      const date = new Date(2025, 11, 25); // December 25, 2025
      expect(toInputDateString(date)).toBe('2025-12-25');
    });
  });

  describe('formatTime', () => {
    it('formats time with leading zeros', () => {
      const date = new Date(2025, 0, 1, 9, 5); // 9:05 AM
      expect(formatTime(date)).toBe('09:05');
    });

    it('formats afternoon time correctly', () => {
      const date = new Date(2025, 0, 1, 14, 30); // 2:30 PM
      expect(formatTime(date)).toBe('14:30');
    });
  });

  describe('isToday', () => {
    it('returns true for today', () => {
      expect(isToday(new Date())).toBe(true);
    });

    it('returns false for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isToday(yesterday)).toBe(false);
    });

    it('returns false for tomorrow', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(isToday(tomorrow)).toBe(false);
    });
  });

  describe('isSameDay', () => {
    it('returns true for same day different times', () => {
      const date1 = new Date(2025, 0, 15, 10, 0);
      const date2 = new Date(2025, 0, 15, 22, 30);
      expect(isSameDay(date1, date2)).toBe(true);
    });

    it('returns false for different days', () => {
      const date1 = new Date(2025, 0, 15);
      const date2 = new Date(2025, 0, 16);
      expect(isSameDay(date1, date2)).toBe(false);
    });
  });

  describe('addDays', () => {
    it('adds positive days correctly', () => {
      const date = new Date(2025, 0, 15);
      const result = addDays(date, 5);
      expect(result.getDate()).toBe(20);
    });

    it('subtracts days with negative value', () => {
      const date = new Date(2025, 0, 15);
      const result = addDays(date, -5);
      expect(result.getDate()).toBe(10);
    });

    it('handles month boundaries', () => {
      const date = new Date(2025, 0, 30); // January 30
      const result = addDays(date, 5);
      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(4);
    });
  });

  describe('getDayName', () => {
    it('returns correct day name', () => {
      // January 1, 2025 is a Wednesday
      const date = new Date(2025, 0, 1);
      expect(getDayName(date)).toBe('Wednesday');
    });
  });

  describe('parseDateString', () => {
    it('parses YYYY-MM-DD format correctly', () => {
      const result = parseDateString('2025-06-15');
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(5); // June (0-indexed)
      expect(result.getDate()).toBe(15);
    });
  });

  describe('calculateDateProgress', () => {
    it('returns 0 for dates before start', () => {
      const start = new Date(2025, 0, 10);
      const end = new Date(2025, 0, 20);
      const current = new Date(2025, 0, 5);
      expect(calculateDateProgress(start, end, current)).toBe(0);
    });

    it('returns 100 for dates after end', () => {
      const start = new Date(2025, 0, 10);
      const end = new Date(2025, 0, 20);
      const current = new Date(2025, 0, 25);
      expect(calculateDateProgress(start, end, current)).toBe(100);
    });

    it('returns ~50 for midpoint', () => {
      const start = new Date(2025, 0, 10);
      const end = new Date(2025, 0, 20);
      const current = new Date(2025, 0, 15);
      expect(calculateDateProgress(start, end, current)).toBeCloseTo(50, 0);
    });
  });

  describe('formatDateRange', () => {
    it('formats single date when no end date', () => {
      const result = formatDateRange('2025-01-15');
      expect(result).toContain('Jan');
      expect(result).toContain('15');
      expect(result).toContain('2025');
    });

    it('formats same month range correctly', () => {
      const result = formatDateRange('2025-01-15', '2025-01-20');
      expect(result).toBe('Jan 15 - 20, 2025');
    });

    it('formats different month same year correctly', () => {
      const result = formatDateRange('2025-01-15', '2025-02-20');
      expect(result).toBe('Jan 15 - Feb 20, 2025');
    });
  });
});
