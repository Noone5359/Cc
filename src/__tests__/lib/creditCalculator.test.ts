import { describe, it, expect } from 'vitest';
import { calculateCreditsFromLTP, getCreditFormula } from '@lib/utils/creditCalculator';

describe('creditCalculator', () => {
  describe('calculateCreditsFromLTP (CBCS)', () => {
    it('calculates credits correctly for 3-1-0', () => {
      // CBCS: 3*L + 2*T + P = 3*3 + 2*1 + 0 = 11
      expect(calculateCreditsFromLTP('3-1-0', 'CBCS')).toBe(11);
    });

    it('calculates credits correctly for 3-0-0', () => {
      // CBCS: 3*3 + 2*0 + 0 = 9
      expect(calculateCreditsFromLTP('3-0-0', 'CBCS')).toBe(9);
    });

    it('calculates credits correctly for 0-0-3', () => {
      // CBCS: 3*0 + 2*0 + 3 = 3
      expect(calculateCreditsFromLTP('0-0-3', 'CBCS')).toBe(3);
    });

    it('calculates credits correctly for 2-1-2', () => {
      // CBCS: 3*2 + 2*1 + 2 = 6 + 2 + 2 = 10
      expect(calculateCreditsFromLTP('2-1-2', 'CBCS')).toBe(10);
    });

    it('defaults to CBCS when no option provided', () => {
      expect(calculateCreditsFromLTP('3-1-0')).toBe(11);
    });
  });

  describe('calculateCreditsFromLTP (NEP)', () => {
    it('calculates credits correctly for 3-1-0', () => {
      // NEP: L + T + 0.5*P = 3 + 1 + 0 = 4
      expect(calculateCreditsFromLTP('3-1-0', 'NEP')).toBe(4);
    });

    it('calculates credits correctly for 3-0-0', () => {
      // NEP: 3 + 0 + 0 = 3
      expect(calculateCreditsFromLTP('3-0-0', 'NEP')).toBe(3);
    });

    it('calculates credits correctly for 0-0-4', () => {
      // NEP: 0 + 0 + 0.5*4 = 2
      expect(calculateCreditsFromLTP('0-0-4', 'NEP')).toBe(2);
    });

    it('calculates credits correctly for 2-1-2', () => {
      // NEP: 2 + 1 + 0.5*2 = 4
      expect(calculateCreditsFromLTP('2-1-2', 'NEP')).toBe(4);
    });
  });

  describe('calculateCreditsFromLTP (edge cases)', () => {
    it('returns 0 for empty string', () => {
      expect(calculateCreditsFromLTP('')).toBe(0);
    });

    it('returns 0 for invalid format', () => {
      expect(calculateCreditsFromLTP('3-1')).toBe(0);
    });

    it('returns 0 for null-like input', () => {
      expect(calculateCreditsFromLTP(null as unknown as string)).toBe(0);
    });

    it('handles whitespace in input', () => {
      expect(calculateCreditsFromLTP('3 - 1 - 0', 'CBCS')).toBe(11);
    });

    it('handles non-numeric parts', () => {
      expect(calculateCreditsFromLTP('a-b-c')).toBe(0);
    });
  });

  describe('getCreditFormula', () => {
    it('returns CBCS formula for CBCS option', () => {
      expect(getCreditFormula('CBCS')).toBe('3L + 2T + P');
    });

    it('returns NEP formula for NEP option', () => {
      expect(getCreditFormula('NEP')).toBe('L + T + 0.5*P');
    });

    it('defaults to CBCS formula', () => {
      expect(getCreditFormula()).toBe('3L + 2T + P');
    });
  });
});
