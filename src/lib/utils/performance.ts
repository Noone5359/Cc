import { getPerformance } from '@lib/firebase';

/**
 * Custom trace for monitoring specific operations
 * @param traceName - Name of the trace
 * @param callback - Function to execute and measure
 * @returns Promise with the callback result
 */
export async function tracePerformance<T>(
  traceName: string,
  callback: () => Promise<T> | T
): Promise<T> {
  try {
    const perf = await getPerformance();
    if (!perf) {
      // If performance monitoring is not enabled, just run the callback
      return await callback();
    }

    const trace = perf.trace(traceName);
    if (!trace || typeof trace.start !== 'function') {
      return await callback();
    }

    trace.start();

    try {
      const result = await callback();
      if (typeof trace.stop === 'function') {
        trace.stop();
      }
      return result;
    } catch (error) {
      if (typeof trace.stop === 'function') {
        trace.stop();
      }
      throw error;
    }
  } catch (perfError) {
    // If any performance monitoring error, just run the callback
    console.warn('Performance monitoring error:', perfError);
    return await callback();
  }
}

/**
 * Create a custom trace for manual control
 * @param traceName - Name of the trace
 * @returns Trace object with start/stop methods, or null if not available
 */
export async function createTrace(traceName: string) {
  const perf = await getPerformance();
  if (!perf) {
    return null;
  }
  return perf.trace(traceName);
}

/**
 * Log custom metric to performance monitoring
 * @param metricName - Name of the metric
 * @param value - Value of the metric
 */
export async function logMetric(traceName: string, metricName: string, value: number) {
  try {
    const perf = await getPerformance();
    if (!perf) {
      return;
    }

    const trace = perf.trace(traceName);
    if (!trace || typeof trace.start !== 'function') {
      return;
    }

    trace.start();
    if (typeof trace.putMetric === 'function') {
      trace.putMetric(metricName, value);
    }
    if (typeof trace.stop === 'function') {
      trace.stop();
    }
  } catch (error) {
    console.warn('Performance metric logging error:', error);
  }
}

/**
 * Measure page load performance
 */
export async function measurePageLoad(pageName: string) {
  try {
    const perf = await getPerformance();
    if (!perf) {
      return;
    }

    const trace = perf.trace(`page_load_${pageName}`);
    if (!trace || typeof trace.start !== 'function') {
      return;
    }

    trace.start();

    // Stop the trace when the page is fully loaded
    if (document.readyState === 'complete') {
      if (typeof trace.stop === 'function') {
        trace.stop();
      }
    } else {
      window.addEventListener('load', () => {
        if (typeof trace.stop === 'function') {
          trace.stop();
        }
      });
    }
  } catch (error) {
    console.warn('Page load performance measurement error:', error);
  }
}

/**
 * Measure component render time
 * @param componentName - Name of the component
 * @returns Object with start and stop functions
 */
export async function measureComponentRender(componentName: string) {
  const perf = await getPerformance();
  if (!perf) {
    return {
      start: () => {},
      stop: () => {},
    };
  }

  const trace = perf.trace(`component_render_${componentName}`);

  return {
    start: () => trace.start(),
    stop: () => trace.stop(),
  };
}

/**
 * Measure network request performance
 * @param requestName - Name of the request
 * @param httpMethod - HTTP method (GET, POST, etc.)
 * @param url - Request URL
 */
export async function measureNetworkRequest<T>(
  requestName: string,
  httpMethod: string,
  url: string,
  callback: () => Promise<T>
): Promise<T> {
  try {
    const perf = await getPerformance();
    if (!perf) {
      return await callback();
    }

    const trace = perf.trace(`network_${requestName}`);
    if (!trace || typeof trace.start !== 'function') {
      return await callback();
    }

    if (typeof trace.putAttribute === 'function') {
      trace.putAttribute('http_method', httpMethod);
      trace.putAttribute('url', url);
    }
    trace.start();

    try {
      const result = await callback();
      if (typeof trace.putMetric === 'function') {
        trace.putMetric('success', 1);
      }
      if (typeof trace.stop === 'function') {
        trace.stop();
      }
      return result;
    } catch (error) {
      if (typeof trace.putMetric === 'function') {
        trace.putMetric('success', 0);
      }
      if (typeof trace.stop === 'function') {
        trace.stop();
      }
      throw error;
    }
  } catch (perfError) {
    console.warn('Network request performance measurement error:', perfError);
    return await callback();
  }
}
