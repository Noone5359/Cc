import { allForms } from '@config/forms';
import { useAuth } from '@features/auth/hooks/useAuth';
import { db } from '@lib/firebase';
import { MAX_RECENT_DOWNLOADS } from '@lib/utils/constants';
import { logActivity } from '@services/activityService';
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useMemo,
  useCallback,
} from 'react';

import { Form, UserFormsData } from '@/types';

interface FormsContextType {
  userFormsData: UserFormsData | null;
  loading: boolean;
  error: Error | null;
  toggleFavorite: (formNumber: string) => Promise<void>;
  addRecentDownload: (form: Form) => Promise<void>;
}

const FormsContext = createContext<FormsContextType | undefined>(undefined);

export const FormsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [userFormsData, setUserFormsData] = useState<UserFormsData | null>({
    favorites: [],
    recentDownloads: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!currentUser) {
      setUserFormsData({ favorites: [], recentDownloads: [] });
      setError(null);
      setLoading(false);
      return;
    }

    const userDocRef = db.collection('userForms').doc(currentUser.uid);
    const unsubscribe = userDocRef.onSnapshot(
      (docSnap) => {
        if (docSnap.exists) {
          setUserFormsData(docSnap.data() as UserFormsData);
        } else {
          // Initialize if doesn't exist
          const initialData: UserFormsData = { favorites: [], recentDownloads: [] };
          userDocRef.set(initialData);
          setUserFormsData(initialData);
        }
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching user forms data:', err);
        setError(err instanceof Error ? err : new Error('Failed to load forms data'));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const toggleFavorite = useCallback(
    async (formNumber: string) => {
      if (!currentUser || !userFormsData) return;

      const isFavoriting = !userFormsData.favorites.includes(formNumber);
      const newFavorites = isFavoriting
        ? [...userFormsData.favorites, formNumber]
        : userFormsData.favorites.filter((f) => f !== formNumber);

      const form = allForms.find((f) => f.formNumber === formNumber);
      if (form) {
        await logActivity(currentUser.uid, {
          type: 'form',
          title: isFavoriting ? 'Form Favorited' : 'Form Unfavorited',
          description: `Form "${form.title}" was ${isFavoriting ? 'added to' : 'removed from'} favorites.`,
          icon: isFavoriting ? '⭐' : '🗑️',
          link: '/college-forms',
        });
      }

      const userDocRef = db.collection('userForms').doc(currentUser.uid);
      await userDocRef.update({ favorites: newFavorites });
    },
    [currentUser, userFormsData]
  );

  const addRecentDownload = useCallback(
    async (form: Form) => {
      if (!currentUser || !userFormsData) return;

      await logActivity(currentUser.uid, {
        type: 'form',
        title: 'Form Downloaded',
        description: `Downloaded: ${form.title}`,
        icon: '📄',
        link: '/college-forms',
      });

      const newDownload = {
        formNumber: form.formNumber,
        title: form.title,
        timestamp: Date.now(),
      };

      const updatedDownloads = [
        newDownload,
        ...userFormsData.recentDownloads
          .filter((d) => d.formNumber !== form.formNumber)
          .slice(0, MAX_RECENT_DOWNLOADS - 1),
      ];

      const userDocRef = db.collection('userForms').doc(currentUser.uid);
      await userDocRef.update({ recentDownloads: updatedDownloads });
    },
    [currentUser, userFormsData]
  );

  const contextValue = useMemo(
    () => ({ userFormsData, loading, error, toggleFavorite, addRecentDownload }),
    [userFormsData, loading, error, toggleFavorite, addRecentDownload]
  );

  return <FormsContext.Provider value={contextValue}>{children}</FormsContext.Provider>;
};

export const useForms = () => {
  const context = useContext(FormsContext);
  if (context === undefined) {
    throw new Error('useForms must be used within a FormsProvider');
  }
  return context;
};
