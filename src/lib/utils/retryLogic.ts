import { DEFAULT_MAX_RETRIES, DEFAULT_RETRY_DELAY_MS } from './constants';

/**
 * Retry a function with exponential backoff
 * @param fn - The function to retry
 * @param maxRetries - Maximum number of retries (default: 3)
 * @param delay - Initial delay in milliseconds (default: 1000)
 * @returns Promise with the result of the function
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = DEFAULT_MAX_RETRIES,
  delay: number = DEFAULT_RETRY_DELAY_MS
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        throw lastError;
      }

      // Exponential backoff: delay * 2^attempt
      const backoffDelay = delay * Math.pow(2, attempt);

      console.warn(
        `Attempt ${attempt + 1}/${maxRetries + 1} failed. Retrying in ${backoffDelay}ms...`,
        lastError.message
      );

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, backoffDelay));
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError!;
}

/**
 * Check if an error is retryable (network or temporary errors)
 * @param error - The error to check
 * @returns true if the error should be retried
 */
export function isRetryableError(error: any): boolean {
  // Firebase errors that are retryable
  const retryableFirebaseCodes = [
    'unavailable',
    'deadline-exceeded',
    'resource-exhausted',
    'aborted',
    'internal',
  ];

  // Network errors
  if (error.message?.includes('network') || error.message?.includes('fetch')) {
    return true;
  }

  // Firebase Firestore errors
  if (error.code && retryableFirebaseCodes.includes(error.code)) {
    return true;
  }

  // HTTP status codes that are retryable
  const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
  if (error.status && retryableStatusCodes.includes(error.status)) {
    return true;
  }

  return false;
}

/**
 * Retry a function only if the error is retryable
 * @param fn - The function to retry
 * @param maxRetries - Maximum number of retries (default: 3)
 * @param delay - Initial delay in milliseconds (default: 1000)
 * @returns Promise with the result of the function
 */
export async function retryOnlyIfRetryable<T>(
  fn: () => Promise<T>,
  maxRetries: number = DEFAULT_MAX_RETRIES,
  delay: number = DEFAULT_RETRY_DELAY_MS
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if error is retryable
      if (!isRetryableError(error)) {
        throw lastError;
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        throw lastError;
      }

      // Exponential backoff
      const backoffDelay = delay * Math.pow(2, attempt);

      console.warn(
        `Retryable error on attempt ${attempt + 1}/${maxRetries + 1}. Retrying in ${backoffDelay}ms...`,
        lastError.message
      );

      await new Promise((resolve) => setTimeout(resolve, backoffDelay));
    }
  }

  throw lastError!;
}
