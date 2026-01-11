import { ComponentType, lazy } from 'react';

/**
 * Check if an error is a chunk loading failure
 * This catches various chunk loading errors across different browsers
 */
function isChunkLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const errorMessage = error.message.toLowerCase();
  const chunkLoadErrorPatterns = [
    'failed to fetch dynamically imported module',
    'loading chunk',
    'loading css chunk',
    'dynamically imported module',
    'unable to preload css',
    'failed to fetch',
    'network error',
    'load failed',
    'unexpected token',
  ];

  return chunkLoadErrorPatterns.some((pattern) => errorMessage.includes(pattern));
}

/**
 * Lazy load a component with automatic retry on chunk loading failure
 * This helps handle cases where chunks fail to load due to:
 * - Stale cache after deployment
 * - Network issues
 * - CDN problems
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  retries = 3
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    const refreshKey = 'page-has-been-force-refreshed';
    const refreshTimestampKey = 'force-refresh-timestamp';

    const pageHasAlreadyBeenForceRefreshed = JSON.parse(
      window.sessionStorage.getItem(refreshKey) || 'false'
    );

    // Reset the force refresh flag if it's been more than 30 seconds
    // This prevents the flag from getting stuck
    const lastRefreshTimestamp = parseInt(
      window.sessionStorage.getItem(refreshTimestampKey) || '0'
    );
    const thirtySecondsAgo = Date.now() - 30000;

    if (pageHasAlreadyBeenForceRefreshed && lastRefreshTimestamp < thirtySecondsAgo) {
      window.sessionStorage.setItem(refreshKey, 'false');
    }

    try {
      const component = await componentImport();
      // Success - reset the force refresh flag
      window.sessionStorage.setItem(refreshKey, 'false');
      return component;
    } catch (error) {
      console.error('Chunk loading error:', error);

      // Only handle chunk loading errors with special retry logic
      if (isChunkLoadError(error)) {
        // If we haven't already force refreshed recently
        if (!pageHasAlreadyBeenForceRefreshed || lastRefreshTimestamp < thirtySecondsAgo) {
          // Mark that we're force refreshing
          window.sessionStorage.setItem(refreshKey, 'true');
          window.sessionStorage.setItem(refreshTimestampKey, Date.now().toString());

          // Clear any cached modules if possible (service worker caches)
          if ('caches' in window) {
            try {
              const cacheNames = await caches.keys();
              await Promise.all(cacheNames.map((name) => caches.delete(name)));
            } catch (e) {
              console.warn('Failed to clear caches:', e);
            }
          }

          // Reload the page to get fresh chunks
          window.location.reload();
          // Return a dummy component (we won't get here due to reload)
          return { default: (() => null) as unknown as T };
        }

        // If we've already tried force refresh, attempt retries with delay
        let lastError = error;
        for (let i = 0; i < retries; i++) {
          try {
            // Wait before retrying (exponential backoff: 1s, 2s, 4s)
            await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, i)));
            const component = await componentImport();
            // Reset flag on success
            window.sessionStorage.setItem(refreshKey, 'false');
            return component;
          } catch (retryError) {
            lastError = retryError;
            console.error(`Retry ${i + 1}/${retries} failed:`, retryError);
          }
        }

        // All retries failed - show user-friendly message and throw
        console.error('All chunk loading retries failed:', lastError);

        // Provide helpful guidance for the user
        if (typeof window !== 'undefined') {
          const shouldReload = window.confirm(
            'The page could not be loaded because a new version is available. ' +
              'Would you like to refresh the page?'
          );
          if (shouldReload) {
            window.sessionStorage.setItem(refreshKey, 'false');
            window.location.reload();
            return { default: (() => null) as unknown as T };
          }
        }

        throw lastError;
      }

      // Non-chunk loading errors - just throw
      throw error;
    }
  });
}
