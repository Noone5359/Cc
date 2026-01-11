/**
 * Error tracking utilities using Firebase Analytics
 */
import { getAnalytics } from '@lib/firebase';

export interface ErrorInfo {
  error_message: string;
  error_code?: string;
  error_stack?: string;
  component?: string;
  user_action?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Log an error to Firebase Analytics
 * @param error - Error object or message
 * @param context - Additional context about the error
 */
export async function logError(error: Error | string, context?: Partial<ErrorInfo>): Promise<void> {
  try {
    const analytics = await getAnalytics();
    if (!analytics) {
      console.warn('Analytics not available, error not tracked');
      return;
    }

    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = typeof error === 'object' ? error.stack : undefined;
    const errorCode = (error as any)?.code;

    const errorInfo: ErrorInfo = {
      error_message: errorMessage,
      error_code: errorCode,
      error_stack: errorStack?.substring(0, 100), // Limit stack trace length
      severity: 'medium',
      ...context,
    };

    // Log to Analytics
    analytics.logEvent('error', errorInfo);

    // Also log to console in development
    if (import.meta.env.DEV) {
      console.error('[Error Tracked]', errorInfo);
    }
  } catch (trackingError) {
    // Don't throw if tracking fails
    console.warn('Failed to track error:', trackingError);
  }
}

/**
 * Log a handled exception (non-fatal)
 * @param error - Error object or message
 * @param context - Additional context
 */
export async function logHandledException(
  error: Error | string,
  context?: Partial<ErrorInfo>
): Promise<void> {
  return logError(error, { ...context, severity: 'low' });
}

/**
 * Log a critical error
 * @param error - Error object or message
 * @param context - Additional context
 */
export async function logCriticalError(
  error: Error | string,
  context?: Partial<ErrorInfo>
): Promise<void> {
  return logError(error, { ...context, severity: 'critical' });
}

/**
 * Create a global error handler that tracks uncaught errors
 */
export function setupGlobalErrorTracking(): void {
  // Track uncaught errors
  window.addEventListener('error', (event) => {
    logCriticalError(event.error || event.message, {
      component: 'global',
      user_action: 'runtime_error',
    });
  });

  // Track unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logCriticalError(event.reason || 'Unhandled promise rejection', {
      component: 'global',
      user_action: 'promise_rejection',
    });
  });
}
