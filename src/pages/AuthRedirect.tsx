// pages/AuthRedirect.tsx
// Post-login redirect page that routes users based on their role

import { useAuth } from '@features/auth/hooks/useAuth';
import { useRole } from '@features/auth/hooks/useRole';
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthRedirect: React.FC = () => {
  const { isAdmin, isLoading: roleLoading } = useRole();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If not authenticated, redirect to login
    if (!authLoading && !isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }

    // Wait for role to be determined
    if (!roleLoading && isAuthenticated) {
      if (isAdmin) {
        navigate('/admin', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [isAdmin, roleLoading, isAuthenticated, authLoading, navigate]);

  return (
    <div className="flex items-center justify-center h-screen bg-light-bg dark:bg-dark-bg">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-t-transparent border-primary rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-slate-500 dark:text-slate-400">Setting up your dashboard...</p>
      </div>
    </div>
  );
};

export default AuthRedirect;
