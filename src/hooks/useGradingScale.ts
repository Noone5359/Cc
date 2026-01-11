import { useAppConfig } from '@contexts/AppConfigContext';
import { AdminGradeDefinition } from '@features/admin/types';
import { useMemo } from 'react';

// Default grading scale as fallback
const DEFAULT_GRADING_SCALE: AdminGradeDefinition[] = [
  {
    id: 'grade-1',
    grade: 'A+',
    points: 10,
    color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400',
  },
  {
    id: 'grade-2',
    grade: 'A',
    points: 9,
    color: 'text-emerald-800 bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200',
  },
  {
    id: 'grade-3',
    grade: 'B+',
    points: 8,
    color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400',
  },
  {
    id: 'grade-4',
    grade: 'B',
    points: 7,
    color: 'text-sky-700 bg-sky-200 dark:bg-sky-900/40 dark:text-sky-300',
  },
  {
    id: 'grade-5',
    grade: 'C+',
    points: 6,
    color: 'text-amber-700 bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300',
  },
  {
    id: 'grade-6',
    grade: 'C',
    points: 5,
    color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  {
    id: 'grade-7',
    grade: 'D',
    points: 4,
    color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400',
  },
  {
    id: 'grade-8',
    grade: 'F',
    points: 0,
    color: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400',
  },
];

export interface GradingScaleHelpers {
  gradingScale: AdminGradeDefinition[];
  gradeOptions: string[];
  gradePoints: { [key: string]: number };
  getGradeColor: (grade: string) => string;
}

/**
 * Hook to access the configurable grading scale from app config.
 * Returns gradeOptions (array of grade letters), gradePoints (map of grade -> points),
 * and getGradeColor (function to get color for a grade).
 */
export const useGradingScale = (): GradingScaleHelpers => {
  const { config } = useAppConfig();

  return useMemo(() => {
    const gradingScale = config?.gradingScale?.length ? config.gradingScale : DEFAULT_GRADING_SCALE;

    // Array of grade letters in order
    const gradeOptions = gradingScale.map((g) => g.grade);

    // Map of grade letter to points
    const gradePoints: { [key: string]: number } = {};
    gradingScale.forEach((g) => {
      gradePoints[g.grade] = g.points;
    });

    // Function to get color for a grade
    const getGradeColor = (grade: string): string => {
      const gradeConfig = gradingScale.find((g) => g.grade === grade);
      return (
        gradeConfig?.color || 'text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400'
      );
    };

    return {
      gradingScale,
      gradeOptions,
      gradePoints,
      getGradeColor,
    };
  }, [config?.gradingScale]);
};

export default useGradingScale;
