import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
  useCallback,
} from 'react';

import 'firebase/firestore';
import { useAuth } from '@features/auth/hooks/useAuth';
import { db } from '@lib/firebase';
import { logActivity } from '@services/activityService';

import { useAppConfig } from './AppConfigContext';

import { CampusLocation, QuickRoute } from '@/types';

interface CampusMapContextType {
  locations: CampusLocation[];
  quickRoutes: QuickRoute[];
  loading: boolean;
  error: string | null;
  savedPlaces: string[];
  toggleSavePlace: (locationId: string) => Promise<void>;
  getDirections: (from: string, to: string) => string;
  shareLocation: (locationId: string) => Promise<void>;
}

const CampusMapContext = createContext<CampusMapContextType | undefined>(undefined);

// Authentic IIT (ISM) Dhanbad campus locations data
// Campus Center: 23.8080°N, 86.4385°E (verified from official sources)
// Locations moved to config/campusMap.ts

// QuickRoutes moved to config/campusMap.ts

export const CampusMapProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const { config, loading: configLoading } = useAppConfig();

  // Use locations from config, fall back to empty array if not loaded yet
  const locations = useMemo(() => config.campusMap || [], [config.campusMap]);
  const quickRoutes = useMemo(() => config.quickRoutes || [], [config.quickRoutes]);

  const [savedPlaces, setSavedPlaces] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Update loading state based on config loading
  useEffect(() => {
    if (!currentUser) {
      setLoading(configLoading);
      return;
    }
    // ... rest of checking saved places
  }, [currentUser, configLoading]);

  // Load user's saved places from Firestore
  useEffect(() => {
    if (!currentUser) {
      // If not logged in, we are just waiting for config?
      // Actually if not logged in, standard loading rules apply.
      // But let's keep existing logic structure but respect configLoading.
      return;
    }

    setLoading(true);
    let unsubscribe: (() => void) | null = null;

    // Load user's saved places
    unsubscribe = db
      .collection('users')
      .doc(currentUser.uid)
      .onSnapshot(
        (docSnap) => {
          if (docSnap.exists) {
            const data = docSnap.data();
            if (data && data.savedCampusPlaces) {
              setSavedPlaces(data.savedCampusPlaces as string[]);
            } else {
              setSavedPlaces([]);
            }
          } else {
            setSavedPlaces([]);
          }
          setLoading(false);
        },
        (err) => {
          console.error('Error loading saved places:', err);
          setError('Failed to load saved places.');
          setLoading(false);
        }
      );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser]);

  // Toggle saved place (sync with Firebase)
  const toggleSavePlace = useCallback(
    async (locationId: string) => {
      if (!currentUser) {
        console.error('User must be logged in to save places');
        return;
      }

      const isSaving = !savedPlaces.includes(locationId);
      const newSaved = isSaving
        ? [...savedPlaces, locationId]
        : savedPlaces.filter((id: string) => id !== locationId);

      setSavedPlaces(newSaved);

      try {
        const userDocRef = db.collection('users').doc(currentUser.uid);
        await userDocRef.update({
          savedCampusPlaces: newSaved,
        });

        const location = locations.find((loc) => loc.id === locationId);
        if (location) {
          await logActivity(currentUser.uid, {
            type: 'map',
            title: isSaving ? 'Place Saved' : 'Place Unsaved',
            description: isSaving
              ? `Saved "${location.name}" to your places.`
              : `Removed "${location.name}" from your places.`,
            icon: isSaving ? '⭐' : '🗑️',
            link: '/campus-map',
          });
        }
      } catch (err) {
        console.error('Error saving place:', err);
        // Revert on error
        setSavedPlaces(savedPlaces);
      }
    },
    [currentUser, savedPlaces, locations]
  );

  // Get directions URL for Google Maps
  const getDirections = useCallback(
    (from: string, to: string): string => {
      const fromLoc = locations.find((loc: CampusLocation) => loc.name === from);
      const toLoc = locations.find((loc: CampusLocation) => loc.name === to);

      if (fromLoc && toLoc) {
        const origin = `${fromLoc.coordinates.lat},${fromLoc.coordinates.lng}`;
        const destination = `${toLoc.coordinates.lat},${toLoc.coordinates.lng}`;
        return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=walking`;
      }

      return `https://www.google.com/maps/search/?api=1&query=IIT+ISM+Dhanbad`;
    },
    [locations]
  );

  // Share location
  const shareLocation = useCallback(
    async (locationId: string) => {
      const location = locations.find((loc: CampusLocation) => loc.id === locationId);
      if (!location) return;

      const shareData = {
        title: location.name,
        text: `${location.name} - ${location.description}\n\nIIT (ISM) Dhanbad Campus`,
        url: `https://www.google.com/maps/search/?api=1&query=${location.coordinates.lat},${location.coordinates.lng}`,
      };

      try {
        if (navigator.share) {
          await navigator.share(shareData);
        } else {
          // Fallback: copy to clipboard
          await navigator.clipboard.writeText(
            `${shareData.title}\n${shareData.text}\n${shareData.url}`
          );
          alert('Location details copied to clipboard!');
        }
      } catch (err) {
        console.error('Error sharing:', err);
      }
    },
    [locations]
  );

  const contextValue = useMemo(
    () => ({
      locations,
      quickRoutes,
      loading,
      error,
      savedPlaces,
      toggleSavePlace,
      getDirections,
      shareLocation,
    }),
    [
      locations,
      quickRoutes,
      loading,
      error,
      savedPlaces,
      toggleSavePlace,
      getDirections,
      shareLocation,
    ]
  );

  return <CampusMapContext.Provider value={contextValue}>{children}</CampusMapContext.Provider>;
};

export const useCampusMap = () => {
  const context = useContext(CampusMapContext);
  if (context === undefined) {
    throw new Error('useCampusMap must be used within a CampusMapProvider');
  }
  return context;
};
