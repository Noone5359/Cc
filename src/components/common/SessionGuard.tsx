/**
 * Session Guard Component
 *
 * Wraps protected content to enforce session management.
 * Displays warning modal when session is about to expire.
 */

import { useSessionManager, SessionWarningModal } from '@hooks/useSessionManager';
import React from 'react';

interface SessionGuardProps {
  children: React.ReactNode;
}

export const SessionGuard: React.FC<SessionGuardProps> = ({ children }) => {
  const { showWarning, remainingSeconds, extendSession, logout } = useSessionManager();

  return (
    <>
      {children}
      {showWarning && (
        <SessionWarningModal
          remainingSeconds={remainingSeconds}
          onExtend={extendSession}
          onLogout={logout}
        />
      )}
    </>
  );
};

export default SessionGuard;
