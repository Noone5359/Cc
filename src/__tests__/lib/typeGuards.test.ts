import { describe, it, expect } from 'vitest';
import {
  isDefined,
  getSafeValue,
  isNonEmptyString,
  isNonEmptyArray,
  isValidUser,
} from '@lib/utils/typeGuards';

describe('typeGuards', () => {
  describe('isDefined', () => {
    it('returns true for defined values', () => {
      expect(isDefined('hello')).toBe(true);
      expect(isDefined(0)).toBe(true);
      expect(isDefined(false)).toBe(true);
      expect(isDefined([])).toBe(true);
      expect(isDefined({})).toBe(true);
    });

    it('returns false for null', () => {
      expect(isDefined(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isDefined(undefined)).toBe(false);
    });
  });

  describe('getSafeValue', () => {
    it('returns value when defined', () => {
      expect(getSafeValue('hello', 'default')).toBe('hello');
      expect(getSafeValue(42, 0)).toBe(42);
    });

    it('returns default when null', () => {
      expect(getSafeValue(null, 'default')).toBe('default');
    });

    it('returns default when undefined', () => {
      expect(getSafeValue(undefined, 'default')).toBe('default');
    });

    it('returns value even if falsy (but defined)', () => {
      expect(getSafeValue(0, 100)).toBe(0);
      expect(getSafeValue('', 'default')).toBe('');
      expect(getSafeValue(false, true)).toBe(false);
    });
  });

  describe('isNonEmptyString', () => {
    it('returns true for non-empty string', () => {
      expect(isNonEmptyString('hello')).toBe(true);
    });

    it('returns false for empty string', () => {
      expect(isNonEmptyString('')).toBe(false);
    });

    it('returns false for whitespace-only string', () => {
      expect(isNonEmptyString('   ')).toBe(false);
    });

    it('returns false for null', () => {
      expect(isNonEmptyString(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isNonEmptyString(undefined)).toBe(false);
    });
  });

  describe('isNonEmptyArray', () => {
    it('returns true for non-empty array', () => {
      expect(isNonEmptyArray([1, 2, 3])).toBe(true);
    });

    it('returns true for array with single element', () => {
      expect(isNonEmptyArray(['item'])).toBe(true);
    });

    it('returns false for empty array', () => {
      expect(isNonEmptyArray([])).toBe(false);
    });

    it('returns false for null', () => {
      expect(isNonEmptyArray(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isNonEmptyArray(undefined)).toBe(false);
    });
  });

  describe('isValidUser', () => {
    it('returns true for valid user with all required fields', () => {
      const user = {
        id: 'user123',
        name: 'John Doe',
        admissionNumber: '24JE1234',
        email: 'john@example.com',
      };
      expect(isValidUser(user)).toBe(true);
    });

    it('returns false for null', () => {
      expect(isValidUser(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isValidUser(undefined)).toBe(false);
    });

    it('returns false when id is missing', () => {
      const user = {
        name: 'John Doe',
        admissionNumber: '24JE1234',
        email: 'john@example.com',
      };
      expect(isValidUser(user)).toBe(false);
    });

    it('returns false when name is missing', () => {
      const user = {
        id: 'user123',
        admissionNumber: '24JE1234',
        email: 'john@example.com',
      };
      expect(isValidUser(user)).toBe(false);
    });

    it('returns false when admissionNumber is missing', () => {
      const user = {
        id: 'user123',
        name: 'John Doe',
        email: 'john@example.com',
      };
      expect(isValidUser(user)).toBe(false);
    });

    it('returns false when email is missing', () => {
      const user = {
        id: 'user123',
        name: 'John Doe',
        admissionNumber: '24JE1234',
      };
      expect(isValidUser(user)).toBe(false);
    });

    it('returns false for empty object', () => {
      expect(isValidUser({})).toBe(false);
    });
  });
});
