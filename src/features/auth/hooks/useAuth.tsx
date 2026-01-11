// src/contexts/AuthContext.tsx

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
// FIX: Use Firebase v9 compat API to match rest of codebase
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { auth } from '@lib/firebase';
import { ALLOWED_EMAIL_DOMAIN, HOSTED_DOMAIN } from '@lib/utils/constants';
import { logActivity } from '@services/activityService';

type User = firebase.User;

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged is the recommended way to listen for auth changes.
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    // Clean up the listener when the component unmounts.
    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // Use compat API
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      if (!userCredential.user) {
        throw new Error('Authentication failed: No user returned');
      }
      await logActivity(userCredential.user.uid, {
        type: 'login',
        title: 'Signed In',
        description: 'Successfully signed into your account.',
        icon: '🔑',
      });
    } catch (error) {
      // Re-throw the error so the UI can catch it and display a message
      throw error;
    }
  };

  const register = async (email: string, password: string) => {
    try {
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      if (!userCredential.user) {
        throw new Error('Registration failed: No user returned');
      }
      await logActivity(userCredential.user.uid, {
        type: 'login',
        title: 'Account Created',
        description: 'Welcome! Your account has been created.',
        icon: '🎉',
      });
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      // Restrict to iitism.ac.in domain
      provider.setCustomParameters({
        prompt: 'select_account',
        hd: HOSTED_DOMAIN, // Hosted domain parameter for Google Workspace
      });
      const userCredential = await auth.signInWithPopup(provider);

      // Verify the email domain after authentication
      const email = userCredential.user?.email;
      if (!ALLOWED_EMAIL_DOMAIN) {
        await auth.signOut();
        throw new Error('CONFIGURATION_ERROR: Email domain restriction not configured.');
      }
      if (!email || !email.endsWith(ALLOWED_EMAIL_DOMAIN)) {
        // Sign out the user immediately
        await auth.signOut();
        throw new Error(
          `INVALID_DOMAIN: Only ${ALLOWED_EMAIL_DOMAIN} email addresses are allowed.`
        );
      }

      if (!userCredential.user) {
        throw new Error('Google sign-in failed: No user returned');
      }

      await logActivity(userCredential.user.uid, {
        type: 'login',
        title: 'Signed In with Google',
        description: 'Successfully signed into your account using Google.',
        icon: '🔑',
      });
    } catch (error) {
      console.error('Google login failed:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await auth.sendPasswordResetEmail(email);
    } catch (error) {
      console.error('Password reset failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // ✅ 1. Check if there's a user to log out.
      if (currentUser) {
        // ✅ 2. Log the sign-out activity WHILE the user is still authenticated.
        await logActivity(currentUser.uid, {
          type: 'logout',
          title: 'Signed Out',
          description: 'Successfully signed out of your account.',
          icon: '👋',
        });
      }
      // ✅ 3. Now, perform the sign-out.
      await auth.signOut();
    } catch (error) {
      console.error('Logout process failed:', error);
      // Fallback: If any part of the process fails (like the database write),
      // ensure the user is still signed out as a final action.
      if (auth.currentUser) {
        await auth.signOut();
      }
      // Re-throw the error so the UI can be notified if needed.
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        login,
        register,
        loginWithGoogle,
        resetPassword,
        logout,
        loading,
      }}
    >
      {/* Always render children to let the UI handle the loading state */}
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
