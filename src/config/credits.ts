export const calculateCredits = (ltp: string): number => {
  if (!ltp || typeof ltp !== 'string' || ltp.split('-').length !== 3) {
    return 0;
  }
  const parts = ltp.split('-').map(Number);
  if (parts.some(isNaN)) {
    return 0;
  }
  const [l = 0, t = 0, p = 0] = parts;
  return 3 * l + 2 * t + 1 * p;
};

export const COURSE_OPTIONS: Array<{ value: 'CBCS' | 'NEP'; label: string; description: string }> =
  [
    {
      value: 'CBCS',
      label: 'CBCS (Choice Based Credit System)',
      description: 'Credits = 3×L + 2×T + 1×P',
    },
    {
      value: 'NEP',
      label: 'NEP (National Education Policy)',
      description: 'Credits = L + T + 0.5×P',
    },
  ];
