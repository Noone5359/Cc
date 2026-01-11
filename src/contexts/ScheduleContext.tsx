import { useAuth } from '@features/auth/hooks/useAuth';
import { db } from '@lib/firebase';
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useMemo,
  useCallback,
} from 'react';

import { ClassSchedule } from '@/types';

interface ScheduleContextType {
  scheduleData: ClassSchedule[] | null;
  setScheduleData: (data: ClassSchedule[] | null) => Promise<void>;
  loading: boolean;
  error: Error | null;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export const ScheduleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [scheduleData, setScheduleDataState] = useState<ClassSchedule[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    if (currentUser) {
      setLoading(true);
      setError(null);
      const userDocRef = db.collection('users').doc(currentUser.uid);
      unsubscribe = userDocRef.onSnapshot(
        (docSnap) => {
          if (docSnap.exists) {
            const data = docSnap.data();
            if (data && data.scheduleData) {
              setScheduleDataState(data.scheduleData as ClassSchedule[]);
            } else {
              setScheduleDataState(null);
            }
          } else {
            setScheduleDataState(null);
          }
          setError(null);
          setLoading(false);
        },
        (err) => {
          console.error('Error loading schedule data:', err);
          setError(err instanceof Error ? err : new Error('Failed to load schedule data'));
          setScheduleDataState(null);
          setLoading(false);
        }
      );
    } else {
      setScheduleDataState(null);
      setError(null);
      setLoading(false);
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser]);

  const setScheduleData = useCallback(
    async (data: ClassSchedule[] | null) => {
      if (currentUser) {
        try {
          const userDocRef = db.collection('users').doc(currentUser.uid);
          await userDocRef.update({ scheduleData: data });
          setError(null);
        } catch (err) {
          console.error('Error updating schedule data:', err);
          const error = err instanceof Error ? err : new Error('Failed to update schedule data');
          setError(error);
          throw error;
        }
      }
    },
    [currentUser]
  );

  const contextValue = useMemo(
    () => ({ scheduleData, setScheduleData, loading, error }),
    [scheduleData, setScheduleData, loading, error]
  );

  return <ScheduleContext.Provider value={contextValue}>{children}</ScheduleContext.Provider>;
};

export const useSchedule = () => {
  const context = useContext(ScheduleContext);
  if (context === undefined) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  return context;
};
