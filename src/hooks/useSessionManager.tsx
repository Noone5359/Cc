/**
 * Session Management Hook
 *
 * Provides bank-grade session security with:
 * - Idle timeout (30 minutes default)
 * - Maximum session duration (8 hours default)
 * - Activity tracking (mouse, keyboard, touch, scroll)
 * - Warning before auto-logout
 * - Automatic logout with redirect
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '@lib/firebase';

// Configuration (can be overridden via environment variables)
const IDLE_TIMEOUT_MINUTES = 30;
const MAX_SESSION_HOURS = 8;
const WARNING_BEFORE_LOGOUT_SECONDS = 60; // Show warning 1 minute before logout

// Convert to milliseconds
const IDLE_TIMEOUT_MS = IDLE_TIMEOUT_MINUTES * 60 * 1000;
const MAX_SESSION_MS = MAX_SESSION_HOURS * 60 * 60 * 1000;
const WARNING_MS = WARNING_BEFORE_LOGOUT_SECONDS * 1000;

// Session storage keys
const SESSION_START_KEY = 'session_start_time';
const LAST_ACTIVITY_KEY = 'last_activity_time';

interface SessionState {
  isSessionValid: boolean;
  showWarning: boolean;
  remainingSeconds: number;
  sessionStartTime: number | null;
}

export function useSessionManager() {
  const navigate = useNavigate();
  const [sessionState, setSessionState] = useState<SessionState>({
    isSessionValid: true,
    showWarning: false,
    remainingSeconds: 0,
    sessionStartTime: null,
  });

  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const logoutTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize or get session start time
  const getSessionStartTime = useCallback((): number => {
    const stored = sessionStorage.getItem(SESSION_START_KEY);
    if (stored) {
      return parseInt(stored, 10);
    }
    const now = Date.now();
    sessionStorage.setItem(SESSION_START_KEY, now.toString());
    return now;
  }, []);

  // Update last activity timestamp
  const updateActivity = useCallback(() => {
    const now = Date.now();
    sessionStorage.setItem(LAST_ACTIVITY_KEY, now.toString());

    // Reset warning state if user becomes active
    setSessionState((prev) => ({
      ...prev,
      showWarning: false,
    }));
  }, []);

  // Get last activity time
  const getLastActivityTime = useCallback((): number => {
    const stored = sessionStorage.getItem(LAST_ACTIVITY_KEY);
    return stored ? parseInt(stored, 10) : Date.now();
  }, []);

  // Logout user
  const logout = useCallback(
    async (reason: 'idle' | 'max_session' | 'manual') => {
      // Clear session data
      sessionStorage.removeItem(SESSION_START_KEY);
      sessionStorage.removeItem(LAST_ACTIVITY_KEY);

      // Clear timeouts
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      if (logoutTimeoutRef.current) clearTimeout(logoutTimeoutRef.current);
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);

      try {
        await auth.signOut();
      } catch (error) {
        console.error('Error signing out:', error);
      }

      // Store logout reason for display on login page
      sessionStorage.setItem('logout_reason', reason);

      // Redirect to login
      navigate('/login', { replace: true });
    },
    [navigate]
  );

  // Extend session (user clicked "Stay logged in")
  const extendSession = useCallback(() => {
    updateActivity();
    setSessionState((prev) => ({
      ...prev,
      showWarning: false,
    }));
  }, [updateActivity]);

  // Check session validity
  const checkSession = useCallback(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return; // Not logged in, no session to manage
    }

    const now = Date.now();
    const sessionStart = getSessionStartTime();
    const lastActivity = getLastActivityTime();

    // Check maximum session duration
    if (now - sessionStart > MAX_SESSION_MS) {
      logout('max_session');
      return;
    }

    // Check idle timeout
    const idleTime = now - lastActivity;
    const timeUntilLogout = IDLE_TIMEOUT_MS - idleTime;

    if (timeUntilLogout <= 0) {
      logout('idle');
      return;
    }

    // Show warning if less than WARNING_MS remaining
    if (timeUntilLogout <= WARNING_MS) {
      setSessionState((prev) => ({
        ...prev,
        showWarning: true,
        remainingSeconds: Math.ceil(timeUntilLogout / 1000),
      }));
    }
  }, [getSessionStartTime, getLastActivityTime, logout]);

  // Set up activity listeners
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return; // Not logged in
    }

    // Activity events to track
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

    // Throttle activity updates (max once per 30 seconds)
    let lastUpdate = 0;
    const throttledUpdate = () => {
      const now = Date.now();
      if (now - lastUpdate > 30000) {
        lastUpdate = now;
        updateActivity();
      }
    };

    // Add event listeners
    activityEvents.forEach((event) => {
      document.addEventListener(event, throttledUpdate, { passive: true });
    });

    // Initialize session
    getSessionStartTime();
    updateActivity();

    // Check session every 10 seconds
    checkIntervalRef.current = setInterval(checkSession, 10000);

    // Cleanup
    return () => {
      activityEvents.forEach((event) => {
        document.removeEventListener(event, throttledUpdate);
      });
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [updateActivity, checkSession, getSessionStartTime]);

  return {
    ...sessionState,
    extendSession,
    logout: () => logout('manual'),
  };
}

/**
 * Session Warning Modal Component
 *
 * Display this when sessionState.showWarning is true
 */
export function SessionWarningModal({
  remainingSeconds,
  onExtend,
  onLogout,
}: {
  remainingSeconds: number;
  onExtend: () => void;
  onLogout: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="session-warning-title"
    >
      <div className="bg-white dark:bg-dark-card rounded-xl shadow-2xl p-6 max-w-sm mx-4 animate-fadeIn">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
            <span className="text-xl">⚠️</span>
          </div>
          <h2
            id="session-warning-title"
            className="text-lg font-semibold text-slate-800 dark:text-white"
          >
            Session Expiring
          </h2>
        </div>

        <p className="text-slate-600 dark:text-slate-300 mb-4">
          Your session will expire in <strong>{remainingSeconds}</strong> seconds due to inactivity.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onExtend}
            className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
          >
            Stay Logged In
          </button>
          <button
            onClick={onLogout}
            className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors font-medium"
          >
            Logout Now
          </button>
        </div>
      </div>
    </div>
  );
}
