/**
 * Calculate credits from LTP (Lecture-Tutorial-Practical) format
 * @param ltp - String in format "L-T-P" (e.g., "3-1-0")
 * @param courseOption - Either 'CBCS' or 'NEP'
 * @returns Calculated credits
 */
export const calculateCreditsFromLTP = (
  ltp: string,
  courseOption: 'CBCS' | 'NEP' = 'CBCS'
): number => {
  if (!ltp || typeof ltp !== 'string') {
    return 0;
  }

  const parts = ltp.split('-').map((p) => parseInt(p.trim()) || 0);

  if (parts.length !== 3) {
    return 0;
  }

  const [L = 0, T = 0, P = 0] = parts;

  if (courseOption === 'NEP') {
    // NEP: Credits = L + T + P
    return L + T + 0.5 * P;
  } else {
    // CBCS: Credits = 3*L + 2*T + 1*P
    return 3 * L + 2 * T + P;
  }
};

/**
 * Get the credit calculation formula description
 * @param courseOption - Either 'CBCS' or 'NEP'
 * @returns Formula description string
 */
export const getCreditFormula = (courseOption: 'CBCS' | 'NEP' = 'CBCS'): string => {
  return courseOption === 'NEP' ? 'L + T + 0.5*P' : '3L + 2T + P';
};
