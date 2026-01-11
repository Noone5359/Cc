/**
 * AI-powered Calendar Event Extractor
 * Uses the extraction workflow for robust calendar data extraction
 */

import { extractWithWorkflow, ExtractionProgress } from './aiExtractionWorkflow';
import { calendarExtractionConfig, CalendarEventData } from './extractionSchemas';

// Re-export types for backward compatibility
export type ExtractedEvent = CalendarEventData;

export interface AIExtractionResult {
  success: boolean;
  events: ExtractedEvent[];
  error?: string;
  stats?: {
    totalChunks: number;
    successfulChunks: number;
    duplicatesRemoved: number;
    totalItems: number;
  };
}

/**
 * Extract calendar events from text using the AI workflow
 * @param pdfText The text extracted from the PDF
 * @param onProgress Optional callback for progress updates
 */
export async function extractCalendarEventsWithAI(
  pdfText: string,
  onProgress?: (progress: ExtractionProgress) => void
): Promise<AIExtractionResult> {
  try {
    const result = await extractWithWorkflow(pdfText, calendarExtractionConfig, onProgress);

    if (!result.success && result.data.length === 0) {
      return {
        success: false,
        events: [],
        error: result.errors.length > 0 ? result.errors.join('; ') : 'Failed to extract events',
      };
    }

    // Sort events by date
    const sortedEvents = result.data.sort((a, b) => a.date.localeCompare(b.date));

    return {
      success: result.success,
      events: sortedEvents,
      stats: {
        totalChunks: result.stats.totalChunks,
        successfulChunks: result.stats.successfulChunks,
        duplicatesRemoved: result.stats.duplicatesRemoved,
        totalItems: result.stats.finalItemCount,
      },
      error: result.errors.length > 0 ? result.errors.join('; ') : undefined,
    };
  } catch (error) {
    console.error('AI extraction error:', error);
    return {
      success: false,
      events: [],
      error: error instanceof Error ? error.message : 'Failed to extract events with AI',
    };
  }
}

// Re-export the progress type for consumers
export type { ExtractionProgress } from './aiExtractionWorkflow';
