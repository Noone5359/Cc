/**
 * AI Extraction Workflow System
 * A robust multi-step workflow for extracting data from large files with maximum accuracy.
 */

import { getGoogleGenAI } from '@lib/utils/lazyImports';

// ============================================================================
// Types
// ============================================================================

export interface ExtractionSchema {
  name: string;
  description: string;
  fields: {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'date';
    description: string;
    required: boolean;
  }[];
  examples: string;
  classificationRules?: string;
}

export interface ExtractionConfig<T> {
  schema: ExtractionSchema;
  validate: (item: unknown) => item is T;
  normalize: (item: T) => T;
  getDedupeKey: (item: T) => string;
  maxChunkSize: number;
  chunkOverlap: number;
  maxRetries: number;
}

export interface ExtractionProgress {
  phase: 'preparing' | 'extracting' | 'merging' | 'validating' | 'complete';
  totalChunks: number;
  completedChunks: number;
  currentChunk: number;
  message: string;
}

export interface ExtractionStats {
  totalChunks: number;
  successfulChunks: number;
  failedChunks: number;
  rawItemCount: number;
  duplicatesRemoved: number;
  invalidItemsRemoved: number;
  finalItemCount: number;
}

export interface ExtractionResult<T> {
  success: boolean;
  data: T[];
  stats: ExtractionStats;
  errors: string[];
}

// ============================================================================
// Smart Text Chunking
// ============================================================================

/**
 * Split text into chunks with overlap, trying to break at natural boundaries
 */
function smartChunk(text: string, maxSize: number, overlap: number): string[] {
  const chunks: string[] = [];

  if (!text || text.length === 0) {
    return [];
  }

  if (text.length <= maxSize) {
    return [text];
  }

  let start = 0;
  const minAdvance = Math.max(100, maxSize - overlap); // Minimum characters to advance each iteration

  while (start < text.length) {
    let end = Math.min(start + maxSize, text.length);

    // If not at the end, try to find a natural break point
    if (end < text.length) {
      // Look for paragraph breaks, then sentences, then spaces
      const breakPoints = ['\n\n', '\n', '. ', ', ', ' '];
      const searchStart = start + minAdvance; // Don't go too far back

      for (const breakPoint of breakPoints) {
        const lastBreak = text.lastIndexOf(breakPoint, end);

        if (lastBreak > searchStart) {
          end = lastBreak + breakPoint.length;
          break;
        }
      }
    }

    const chunkText = text.slice(start, end).trim();
    if (chunkText.length > 0) {
      chunks.push(chunkText);
    }

    // Always advance by at least minAdvance to prevent infinite loop
    const nextStart = end - overlap;
    start = Math.max(nextStart, start + minAdvance);

    // If we're near the end, just finish
    if (text.length - start < minAdvance) {
      const remainingText = text.slice(start).trim();
      if (remainingText.length > 0) {
        chunks.push(remainingText);
      }
      break;
    }
  }

  return chunks;
}

// ============================================================================
// AI Extraction
// ============================================================================

/**
 * Extract data from a single chunk using AI
 */
async function extractFromChunk(
  chunk: string,
  chunkIndex: number,
  totalChunks: number,
  schema: ExtractionSchema,
  apiKey: string
): Promise<{ items: unknown[]; error?: string }> {
  const { GoogleGenAI } = await getGoogleGenAI();
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are a precise data extractor. Extract ${schema.name} from the text below.

CRITICAL - CONSECUTIVE EVENTS:
- If you see MULTIPLE DATE RANGES in the text (e.g., "1-10 July", "11-15 July", "16-20 July"), each is a SEPARATE event
- Create a SEPARATE JSON object for EACH event with its own unique date
- NEVER combine multiple events into one
- Each row/line/bullet in a table or list is typically a separate event

DATE ACCURACY RULES:
- Each event MUST have the EXACT date shown next to it in the source text
- Do NOT mix up dates between different events
- Pre-registration, Registration, Fee Payment - each has its OWN specific date range
- Match each event description with ITS OWN date

EXTRACTION RULES:
- Extract EVERY unique item from this text chunk
- This is chunk ${chunkIndex + 1} of ${totalChunks}, so there may be more items in other chunks
- Return ONLY items that appear in THIS chunk
- Do NOT duplicate items
- Count the number of date ranges in the text - you should have that many events

For each item, extract these fields:
${schema.fields.map((f) => `- ${f.name} (${f.type}${f.required ? ', required' : ''}): ${f.description}`).join('\n')}

${schema.classificationRules ? `CLASSIFICATION RULES:\n${schema.classificationRules}\n` : ''}

Return ONLY a valid JSON array. No markdown, no explanations.

Example format:
${schema.examples}

TEXT TO EXTRACT FROM:
${chunk}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    let responseText = response.text?.trim() || '';

    // Remove markdown code blocks if present
    if (responseText.startsWith('```json')) {
      responseText = responseText.slice(7);
    } else if (responseText.startsWith('```')) {
      responseText = responseText.slice(3);
    }
    if (responseText.endsWith('```')) {
      responseText = responseText.slice(0, -3);
    }
    responseText = responseText.trim();

    // Try to repair truncated JSON
    responseText = repairTruncatedJSON(responseText);

    const items = JSON.parse(responseText);

    if (!Array.isArray(items)) {
      return { items: [], error: 'Response is not an array' };
    }

    return { items };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return { items: [], error: errorMsg };
  }
}

/**
 * Repair truncated JSON by finding the last complete object
 */
function repairTruncatedJSON(jsonStr: string): string {
  try {
    JSON.parse(jsonStr);
    return jsonStr;
  } catch {
    // Need to repair
  }

  if (!jsonStr.startsWith('[')) {
    return '[]';
  }

  const lastCompleteObject = jsonStr.lastIndexOf('}');
  if (lastCompleteObject === -1) {
    return '[]';
  }

  let repaired = jsonStr.substring(0, lastCompleteObject + 1).trimEnd();
  if (repaired.endsWith(',')) {
    repaired = repaired.slice(0, -1);
  }
  repaired += ']';

  try {
    JSON.parse(repaired);
    return repaired;
  } catch {
    return '[]';
  }
}

// ============================================================================
// Main Workflow
// ============================================================================

/**
 * Extract data from text using a multi-step workflow
 */
export async function extractWithWorkflow<T>(
  text: string,
  config: ExtractionConfig<T>,
  onProgress?: (progress: ExtractionProgress) => void
): Promise<ExtractionResult<T>> {
  const errors: string[] = [];
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      data: [],
      stats: createEmptyStats(),
      errors: ['Gemini API key not configured'],
    };
  }

  // Phase 1: Prepare chunks
  onProgress?.({
    phase: 'preparing',
    totalChunks: 0,
    completedChunks: 0,
    currentChunk: 0,
    message: 'Preparing text chunks...',
  });

  const chunks = smartChunk(text, config.maxChunkSize, config.chunkOverlap);
  const totalChunks = chunks.length;

  console.log(`[Extraction] Split text into ${totalChunks} chunks`);

  // Phase 2: Extract from each chunk
  const allItems: unknown[] = [];
  let successfulChunks = 0;
  let failedChunks = 0;

  for (let i = 0; i < chunks.length; i++) {
    onProgress?.({
      phase: 'extracting',
      totalChunks,
      completedChunks: i,
      currentChunk: i + 1,
      message: `Extracting from chunk ${i + 1} of ${totalChunks}...`,
    });

    let lastError: string | undefined;
    let success = false;

    // Retry logic
    for (let attempt = 0; attempt < config.maxRetries; attempt++) {
      const chunkText = chunks[i];
      if (!chunkText) continue;

      const result = await extractFromChunk(chunkText, i, totalChunks, config.schema, apiKey);

      if (!result.error && result.items.length >= 0) {
        allItems.push(...result.items);
        success = true;
        console.log(`[Extraction] Chunk ${i + 1}: extracted ${result.items.length} items`);
        break;
      }

      lastError = result.error;
      console.warn(`[Extraction] Chunk ${i + 1} attempt ${attempt + 1} failed: ${lastError}`);

      // Wait before retry
      if (attempt < config.maxRetries - 1) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }

    if (success) {
      successfulChunks++;
    } else {
      failedChunks++;
      errors.push(`Chunk ${i + 1} failed: ${lastError ?? 'Unknown error'}`);
    }
  }

  // Phase 3: Merge and validate
  onProgress?.({
    phase: 'validating',
    totalChunks,
    completedChunks: totalChunks,
    currentChunk: totalChunks,
    message: 'Validating and deduplicating results...',
  });

  const rawItemCount = allItems.length;
  let invalidItemsRemoved = 0;

  // Validate items
  const validItems: T[] = [];
  for (const item of allItems) {
    if (config.validate(item)) {
      validItems.push(config.normalize(item));
    } else {
      invalidItemsRemoved++;
    }
  }

  // Deduplicate
  const seenKeys = new Set<string>();
  const uniqueItems: T[] = [];

  for (const item of validItems) {
    const key = config.getDedupeKey(item);
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      uniqueItems.push(item);
    }
  }

  const duplicatesRemoved = validItems.length - uniqueItems.length;

  // Phase 4: Complete
  onProgress?.({
    phase: 'complete',
    totalChunks,
    completedChunks: totalChunks,
    currentChunk: totalChunks,
    message: `Extracted ${uniqueItems.length} unique items`,
  });

  const stats: ExtractionStats = {
    totalChunks,
    successfulChunks,
    failedChunks,
    rawItemCount,
    duplicatesRemoved,
    invalidItemsRemoved,
    finalItemCount: uniqueItems.length,
  };

  console.log('[Extraction] Stats:', stats);

  return {
    success: failedChunks === 0,
    data: uniqueItems,
    stats,
    errors,
  };
}

function createEmptyStats(): ExtractionStats {
  return {
    totalChunks: 0,
    successfulChunks: 0,
    failedChunks: 0,
    rawItemCount: 0,
    duplicatesRemoved: 0,
    invalidItemsRemoved: 0,
    finalItemCount: 0,
  };
}
