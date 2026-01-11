// components/AdminProtectedRoute.tsx
// Route guard for admin-only pages

import { useAuth } from '@features/auth/hooks/useAuth';
import { useRole } from '@features/auth/hooks/useRole';
import React, { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface AdminProtectedRouteProps {
  children: ReactNode;
}

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useRole();
  const navigate = useNavigate();

  const isLoading = authLoading || roleLoading;

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        // Not authenticated, redirect to login
        navigate('/login', { replace: true });
      } else if (!isAdmin) {
        // Authenticated but not admin, redirect to user dashboard
        navigate('/', { replace: true });
      }
    }
  }, [isLoading, isAuthenticated, isAdmin, navigate]);

  // Show loading spinner while checking auth and role
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-light-bg dark:bg-dark-bg">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-transparent border-primary rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-slate-500 dark:text-slate-400">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Only render children if authenticated AND admin
  return isAuthenticated && isAdmin ? <>{children}</> : null;
};

export default AdminProtectedRoute;
