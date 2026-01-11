// hooks/useRole.tsx
// Role management hook for determining user access level

import { useAppConfig } from '@contexts/AppConfigContext';
import { useUser } from '@contexts/UserContext';
import { db } from '@lib/firebase';
import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';

import { useAuth } from './useAuth';

interface RoleContextType {
  role: 'user' | 'admin';
  isAdmin: boolean;
  isLoading: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser, loading: authLoading } = useAuth();
  const { user, loading: userLoading } = useUser();
  const { config: appConfig, loading: configLoading } = useAppConfig();
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const determineRole = async () => {
      // Wait for all dependencies to load
      if (authLoading || userLoading || configLoading) {
        setIsLoading(true);
        return;
      }

      // No authenticated user
      if (!currentUser) {
        setRole('user');
        setIsLoading(false);
        return;
      }

      const userEmail = currentUser.email?.toLowerCase();

      // Check if user's email is in the adminEmails list
      const adminEmails = appConfig?.adminEmails || [];
      const isEmailAdmin = adminEmails.some((email: string) => email.toLowerCase() === userEmail);

      if (isEmailAdmin) {
        // User is an admin based on email list
        setRole('admin');

        // Update user's role in Firestore if not already admin
        if (user && user.role !== 'admin') {
          try {
            await db.collection('users').doc(currentUser.uid).update({ role: 'admin' });
          } catch (error) {
            console.error('Failed to update user role to admin:', error);
          }
        }
      } else {
        // Regular user
        setRole('user');

        // Ensure role is 'user' in Firestore if it was previously admin but email was removed
        if (user && user.role === 'admin') {
          try {
            await db.collection('users').doc(currentUser.uid).update({ role: 'user' });
          } catch (error) {
            console.error('Failed to update user role to user:', error);
          }
        }
      }

      setIsLoading(false);
    };

    determineRole();
  }, [currentUser, user, appConfig, authLoading, userLoading, configLoading]);

  const contextValue = useMemo(
    () => ({
      role,
      isAdmin: role === 'admin',
      isLoading,
    }),
    [role, isLoading]
  );

  return <RoleContext.Provider value={contextValue}>{children}</RoleContext.Provider>;
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};
