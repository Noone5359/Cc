import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  truncateText,
  formatFileSize,
  capitalizeFirst,
  isEmpty,
  safeJsonParse,
  generateId,
  isImageFile,
  isFileSizeValid,
  getRandomItem,
  debounce,
} from '@lib/utils/helpers';

describe('helpers', () => {
  describe('truncateText', () => {
    it('returns original text if shorter than maxLength', () => {
      expect(truncateText('Hello', 10)).toBe('Hello');
    });

    it('returns original text if equal to maxLength', () => {
      expect(truncateText('Hello', 5)).toBe('Hello');
    });

    it('truncates text and adds ellipsis if longer than maxLength', () => {
      expect(truncateText('Hello World', 5)).toBe('Hello...');
    });

    it('handles empty string', () => {
      expect(truncateText('', 5)).toBe('');
    });
  });

  describe('formatFileSize', () => {
    it('returns "0 Bytes" for 0 bytes', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
    });

    it('formats bytes correctly', () => {
      expect(formatFileSize(500)).toBe('500 Bytes');
    });

    it('formats kilobytes correctly', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
    });

    it('formats megabytes correctly', () => {
      expect(formatFileSize(1048576)).toBe('1 MB');
    });

    it('formats gigabytes correctly', () => {
      expect(formatFileSize(1073741824)).toBe('1 GB');
    });

    it('handles decimal values', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });
  });

  describe('capitalizeFirst', () => {
    it('capitalizes first letter of lowercase string', () => {
      expect(capitalizeFirst('hello')).toBe('Hello');
    });

    it('keeps first letter capitalized if already uppercase', () => {
      expect(capitalizeFirst('Hello')).toBe('Hello');
    });

    it('handles single character', () => {
      expect(capitalizeFirst('h')).toBe('H');
    });

    it('handles empty string', () => {
      expect(capitalizeFirst('')).toBe('');
    });
  });

  describe('isEmpty', () => {
    it('returns true for null', () => {
      expect(isEmpty(null)).toBe(true);
    });

    it('returns true for undefined', () => {
      expect(isEmpty(undefined)).toBe(true);
    });

    it('returns true for empty string', () => {
      expect(isEmpty('')).toBe(true);
    });

    it('returns true for whitespace-only string', () => {
      expect(isEmpty('   ')).toBe(true);
    });

    it('returns false for non-empty string', () => {
      expect(isEmpty('hello')).toBe(false);
    });

    it('returns true for empty array', () => {
      expect(isEmpty([])).toBe(true);
    });

    it('returns false for non-empty array', () => {
      expect(isEmpty([1, 2, 3])).toBe(false);
    });

    it('returns true for empty object', () => {
      expect(isEmpty({})).toBe(true);
    });

    it('returns false for non-empty object', () => {
      expect(isEmpty({ key: 'value' })).toBe(false);
    });

    it('returns false for numbers', () => {
      expect(isEmpty(0)).toBe(false);
      expect(isEmpty(42)).toBe(false);
    });
  });

  describe('safeJsonParse', () => {
    it('parses valid JSON', () => {
      expect(safeJsonParse('{"name":"John"}', {})).toEqual({ name: 'John' });
    });

    it('returns fallback for invalid JSON', () => {
      expect(safeJsonParse('invalid json', { default: true })).toEqual({ default: true });
    });

    it('returns fallback for empty string', () => {
      expect(safeJsonParse('', [])).toEqual([]);
    });

    it('parses arrays correctly', () => {
      expect(safeJsonParse('[1,2,3]', [])).toEqual([1, 2, 3]);
    });
  });

  describe('generateId', () => {
    it('generates a unique string', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });

    it('returns a string', () => {
      expect(typeof generateId()).toBe('string');
    });

    it('contains a hyphen separator', () => {
      expect(generateId()).toContain('-');
    });
  });
});

// Additional tests for functions that need File mocking
describe('helpers - file utilities', () => {
  describe('isImageFile', () => {
    it('returns true for image/png', () => {
      const file = new File([''], 'test.png', { type: 'image/png' });
      expect(isImageFile(file)).toBe(true);
    });

    it('returns true for image/jpeg', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      expect(isImageFile(file)).toBe(true);
    });

    it('returns true for image/gif', () => {
      const file = new File([''], 'test.gif', { type: 'image/gif' });
      expect(isImageFile(file)).toBe(true);
    });

    it('returns false for application/pdf', () => {
      const file = new File([''], 'test.pdf', { type: 'application/pdf' });
      expect(isImageFile(file)).toBe(false);
    });

    it('returns false for text/plain', () => {
      const file = new File([''], 'test.txt', { type: 'text/plain' });
      expect(isImageFile(file)).toBe(false);
    });
  });

  describe('isFileSizeValid', () => {
    it('returns true when file size is less than max', () => {
      const file = new File(['hello'], 'test.txt', { type: 'text/plain' });
      expect(isFileSizeValid(file, 1000)).toBe(true);
    });

    it('returns true when file size equals max', () => {
      const content = 'a'.repeat(100);
      const file = new File([content], 'test.txt', { type: 'text/plain' });
      expect(isFileSizeValid(file, file.size)).toBe(true);
    });

    it('returns false when file size exceeds max', () => {
      const content = 'a'.repeat(1000);
      const file = new File([content], 'test.txt', { type: 'text/plain' });
      expect(isFileSizeValid(file, 100)).toBe(false);
    });
  });
});

describe('helpers - getRandomItem', () => {
  it('returns an item from the array', () => {
    const items = ['a', 'b', 'c'];
    const result = getRandomItem(items);
    expect(items).toContain(result);
  });

  it('returns the only item from single-element array', () => {
    const items = ['only'];
    expect(getRandomItem(items)).toBe('only');
  });

  it('works with number arrays', () => {
    const items = [1, 2, 3, 4, 5];
    const result = getRandomItem(items);
    expect(items).toContain(result);
  });
});

describe('helpers - debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('delays function execution', () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn();
    expect(mockFn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('only calls function once for multiple rapid calls', () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn();
    debouncedFn();
    debouncedFn();

    vi.advanceTimersByTime(100);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('passes arguments to the debounced function', () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn('arg1', 'arg2');
    vi.advanceTimersByTime(100);

    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
  });

  it('uses the last call arguments when called multiple times', () => {
    const mockFn = vi.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn('first');
    debouncedFn('second');
    debouncedFn('third');

    vi.advanceTimersByTime(100);
    expect(mockFn).toHaveBeenCalledWith('third');
  });
});
