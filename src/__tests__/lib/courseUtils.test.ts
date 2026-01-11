import { describe, it, expect } from 'vitest';
import {
  getCourseOptionFromAdmissionNumber,
  isValidCourseOptionForAdmission,
  getCourseOptionExplanation,
} from '@lib/utils/courseUtils';

describe('courseUtils', () => {
  describe('getCourseOptionFromAdmissionNumber', () => {
    it('returns NEP for 24JE batch', () => {
      expect(getCourseOptionFromAdmissionNumber('24JE1234')).toBe('NEP');
    });

    it('returns NEP for 25JE batch', () => {
      expect(getCourseOptionFromAdmissionNumber('25JE5678')).toBe('NEP');
    });

    it('returns NEP for 26JE batch', () => {
      expect(getCourseOptionFromAdmissionNumber('26JE0001')).toBe('NEP');
    });

    it('returns CBCS for 23JE batch', () => {
      expect(getCourseOptionFromAdmissionNumber('23JE1234')).toBe('CBCS');
    });

    it('returns CBCS for 22JE batch', () => {
      expect(getCourseOptionFromAdmissionNumber('22JE5678')).toBe('CBCS');
    });

    it('returns CBCS for 21JE batch', () => {
      expect(getCourseOptionFromAdmissionNumber('21JE0001')).toBe('CBCS');
    });

    it('returns CBCS for 20JE batch', () => {
      expect(getCourseOptionFromAdmissionNumber('20JE9999')).toBe('CBCS');
    });

    it('returns CBCS for invalid format', () => {
      expect(getCourseOptionFromAdmissionNumber('INVALID')).toBe('CBCS');
    });

    it('returns CBCS for empty string', () => {
      expect(getCourseOptionFromAdmissionNumber('')).toBe('CBCS');
    });
  });

  describe('isValidCourseOptionForAdmission', () => {
    it('returns true for NEP with 24JE batch', () => {
      expect(isValidCourseOptionForAdmission('24JE1234', 'NEP')).toBe(true);
    });

    it('returns false for CBCS with 24JE batch', () => {
      expect(isValidCourseOptionForAdmission('24JE1234', 'CBCS')).toBe(false);
    });

    it('returns true for CBCS with 23JE batch', () => {
      expect(isValidCourseOptionForAdmission('23JE1234', 'CBCS')).toBe(true);
    });

    it('returns false for NEP with 23JE batch', () => {
      expect(isValidCourseOptionForAdmission('23JE1234', 'NEP')).toBe(false);
    });
  });

  describe('getCourseOptionExplanation', () => {
    it('returns NEP explanation for 24JE batch', () => {
      const explanation = getCourseOptionExplanation('24JE1234');
      expect(explanation).toContain('NEP');
      expect(explanation).toContain('2024');
    });

    it('returns CBCS explanation for 23JE batch', () => {
      const explanation = getCourseOptionExplanation('23JE1234');
      expect(explanation).toContain('CBCS');
      expect(explanation).toContain('before 2024');
    });

    it('returns generic explanation for invalid format', () => {
      const explanation = getCourseOptionExplanation('INVALID');
      expect(explanation).toContain('admission batch');
    });
  });
});
