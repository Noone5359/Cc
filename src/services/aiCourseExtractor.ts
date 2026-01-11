/**
 * AI-powered Course Extractor
 * Uses the extraction workflow for robust course data extraction from PDFs
 */

import { extractWithWorkflow, ExtractionProgress } from './aiExtractionWorkflow';
import { courseExtractionConfig, CourseData } from './extractionSchemas';

// Re-export types for consumers
export type ExtractedCourse = CourseData;

export interface CourseExtractionResult {
  success: boolean;
  courses: ExtractedCourse[];
  error?: string;
  stats?: {
    totalChunks: number;
    successfulChunks: number;
    duplicatesRemoved: number;
    totalItems: number;
  };
}

/**
 * Extract courses from text using the AI workflow
 * @param pdfText The text extracted from the PDF
 * @param onProgress Optional callback for progress updates
 */
export async function extractCoursesWithAI(
  pdfText: string,
  onProgress?: (progress: ExtractionProgress) => void
): Promise<CourseExtractionResult> {
  try {
    const result = await extractWithWorkflow(pdfText, courseExtractionConfig, onProgress);

    if (!result.success && result.data.length === 0) {
      return {
        success: false,
        courses: [],
        error: result.errors.length > 0 ? result.errors.join('; ') : 'Failed to extract courses',
      };
    }

    // Sort courses by code
    const sortedCourses = result.data.sort((a, b) => a.code.localeCompare(b.code));

    return {
      success: result.success,
      courses: sortedCourses,
      stats: {
        totalChunks: result.stats.totalChunks,
        successfulChunks: result.stats.successfulChunks,
        duplicatesRemoved: result.stats.duplicatesRemoved,
        totalItems: result.stats.finalItemCount,
      },
      error: result.errors.length > 0 ? result.errors.join('; ') : undefined,
    };
  } catch (error) {
    console.error('AI course extraction error:', error);
    return {
      success: false,
      courses: [],
      error: error instanceof Error ? error.message : 'Failed to extract courses with AI',
    };
  }
}

// Re-export the progress type for consumers
export type { ExtractionProgress } from './aiExtractionWorkflow';
