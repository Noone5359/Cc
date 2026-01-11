import { createTrace } from '@lib/utils/performance';
import { useEffect, useRef } from 'react';

/**
 * Custom hook to measure component render performance
 * @param componentName - Name of the component to trace
 * @param enabled - Whether tracing is enabled (default: true)
 */
export function usePerformanceTrace(componentName: string, enabled: boolean = true) {
  const traceRef = useRef<any>(null);

  useEffect(() => {
    if (!enabled) return;

    let isMounted = true;

    const initTrace = async () => {
      try {
        const trace = await createTrace(`component_${componentName}`);
        if (!trace || !isMounted) return;

        traceRef.current = trace;

        // Check if trace has start method
        if (typeof trace.start === 'function') {
          trace.start();
        }
      } catch (error) {
        console.warn('Failed to initialize performance trace:', error);
      }
    };

    initTrace();

    return () => {
      isMounted = false;
      const trace = traceRef.current;
      if (trace && typeof trace.stop === 'function') {
        try {
          trace.stop();
        } catch (e) {
          // Trace might already be stopped
        }
      }
    };
  }, [componentName, enabled]);

  return traceRef.current;
}

/**
 * Custom hook to measure page load performance
 * @param pageName - Name of the page to trace
 */
export function usePageLoadTrace(pageName: string) {
  useEffect(() => {
    let trace: any = null;
    let isMounted = true;
    let removeLoadListener: (() => void) | null = null;

    const initTrace = async () => {
      try {
        trace = await createTrace(`page_${pageName}`);
        if (!trace || !isMounted) return;

        // Check if trace has start method
        if (typeof trace.start === 'function') {
          trace.start();
        }

        const handleLoad = () => {
          if (trace && typeof trace.stop === 'function') {
            try {
              trace.stop();
            } catch (e) {
              // Trace might already be stopped
            }
          }
        };

        if (document.readyState === 'complete') {
          handleLoad();
        } else {
          window.addEventListener('load', handleLoad);
          removeLoadListener = () => window.removeEventListener('load', handleLoad);
        }
      } catch (error) {
        console.warn('Failed to initialize page load trace:', error);
      }
    };

    initTrace();

    return () => {
      isMounted = false;
      if (removeLoadListener) {
        removeLoadListener();
        removeLoadListener = null;
      }
      if (trace && typeof trace.stop === 'function') {
        try {
          trace.stop();
        } catch (e) {
          // Trace might already be stopped
        }
      }
    };
  }, [pageName]);
}
