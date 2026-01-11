// Firestore service for app configuration management
// Each config section is stored in a separate document within the appConfig collection
import { AdminConfig } from '@features/admin/types';
import { db } from '@lib/firebase';

const CONFIG_COLLECTION = 'appConfig';

// Document IDs for each config section
const CONFIG_DOCS = {
  collegeInfo: 'collegeInfo',
  adminEmails: 'adminEmails',
  appConstants: 'appConstants',
  branches: 'branches',
  hostels: 'hostels',
  quotes: 'quotes',
  quickLinks: 'quickLinks',
  forms: 'forms',
  calendar: 'calendar',
  directory: 'directory',
  courses: 'courses',
  students: 'students',
  campusMap: 'campusMap',
  quickRoutes: 'quickRoutes',
  gradingScale: 'gradingScale',
} as const;

// Config sections that are arrays and need to be wrapped in { items: [...] }
const ARRAY_CONFIG_KEYS = [
  'adminEmails',
  'branches',
  'hostels',
  'quotes',
  'quickLinks',
  'forms',
  'directory',
  'courses',
  'students',
  'campusMap',
  'quickRoutes',
  'gradingScale',
] as const;

/**
 * Recursively remove undefined values from an object (Firestore doesn't accept undefined)
 */
const sanitizeForFirestore = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return null;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeForFirestore(item));
  }
  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        sanitized[key] = sanitizeForFirestore(value);
      }
    }
    return sanitized;
  }
  return obj;
};

/**
 * Get the entire app configuration from Firestore
 * Fetches all config documents and combines them
 */
export const getConfig = async (): Promise<AdminConfig | null> => {
  try {
    const collectionRef = db.collection(CONFIG_COLLECTION);
    const snapshot = await collectionRef.get();

    if (snapshot.empty) {
      return null;
    }

    const config: Partial<AdminConfig> = {};
    const validDocIds = Object.values(CONFIG_DOCS);

    snapshot.forEach((doc) => {
      const docId = doc.id;

      // Skip invalid document IDs
      if (!validDocIds.includes(docId as any)) {
        return;
      }

      const data = doc.data();

      // For array-based configs, extract from { items: [...] }
      if (ARRAY_CONFIG_KEYS.includes(docId as any)) {
        (config as any)[docId] = data.items || [];
      } else {
        (config as any)[docId] = data;
      }
    });

    return config as AdminConfig;
  } catch (error) {
    console.error('Error fetching config from Firestore:', error);
    return null;
  }
};

/**
 * Update the entire app configuration in Firestore
 * Writes each section to its own document
 */
export const updateConfig = async (config: AdminConfig): Promise<boolean> => {
  try {
    const batch = db.batch();
    const collectionRef = db.collection(CONFIG_COLLECTION);

    // Write each section to its own document
    Object.entries(CONFIG_DOCS).forEach(([key, docId]) => {
      const docRef = collectionRef.doc(docId);
      const data = config[key as keyof AdminConfig];
      const sanitizedData = sanitizeForFirestore(data);

      // For array-based configs, wrap in { items: [...] }
      if (ARRAY_CONFIG_KEYS.includes(key as any)) {
        batch.set(docRef, { items: sanitizedData }, { merge: true });
      } else {
        // For object configs (like collegeInfo), replace entirely to ensure nested values sync
        batch.set(docRef, sanitizedData);
      }
    });

    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error updating config in Firestore:', error);
    return false;
  }
};

/**
 * Update a specific section of the app configuration
 */
export const updateConfigSection = async <K extends keyof AdminConfig>(
  section: K,
  data: AdminConfig[K]
): Promise<boolean> => {
  try {
    const docId = CONFIG_DOCS[section];
    const docRef = db.collection(CONFIG_COLLECTION).doc(docId);
    const sanitizedData = sanitizeForFirestore(data);

    // For array-based configs, wrap in { items: [...] }
    if (ARRAY_CONFIG_KEYS.includes(section as any)) {
      await docRef.set({ items: sanitizedData }, { merge: true });
    } else {
      // For object configs, replace entirely to ensure nested values sync
      await docRef.set(sanitizedData as any);
    }

    return true;
  } catch (error) {
    console.error(`Error updating config section ${section}:`, error);
    return false;
  }
};

/**
 * Subscribe to real-time config updates
 * Listens to all documents in the collection and combines them
 * @returns Unsubscribe function
 */
export const subscribeToConfig = (callback: (config: AdminConfig | null) => void): (() => void) => {
  const collectionRef = db.collection(CONFIG_COLLECTION);

  const unsubscribe = collectionRef.onSnapshot(
    (snapshot) => {
      if (snapshot.empty) {
        callback(null);
        return;
      }

      const config: Partial<AdminConfig> = {};
      const validDocIds = Object.values(CONFIG_DOCS);

      snapshot.forEach((doc) => {
        const docId = doc.id;

        // Skip invalid document IDs
        if (!validDocIds.includes(docId as any)) {
          return;
        }

        const data = doc.data();

        // For array-based configs, extract from { items: [...] }
        if (ARRAY_CONFIG_KEYS.includes(docId as any)) {
          (config as any)[docId] = data.items || [];
        } else {
          (config as any)[docId] = data;
        }
      });

      // Only call callback if we have config data
      if (Object.keys(config).length > 0) {
        callback(config as AdminConfig);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('Error in config subscription:', error);
      callback(null);
    }
  );

  return unsubscribe;
};

/**
 * Initialize config in Firestore if it doesn't exist
 * Creates separate documents for each config section
 * Also adds any missing sections if some exist but others don't
 */
export const initializeConfig = async (defaultConfig: AdminConfig): Promise<boolean> => {
  try {
    const collectionRef = db.collection(CONFIG_COLLECTION);
    const snapshot = await collectionRef.get();

    // Get existing document IDs
    const existingDocIds = new Set(snapshot.docs.map((doc) => doc.id));

    // Find missing sections
    const missingEntries = Object.entries(CONFIG_DOCS).filter(
      ([, docId]) => !existingDocIds.has(docId)
    );

    if (missingEntries.length === 0) {
      return true;
    }

    const batch = db.batch();

    missingEntries.forEach(([key, docId]) => {
      const docRef = collectionRef.doc(docId);
      const data = defaultConfig[key as keyof AdminConfig];

      // For array-based configs, wrap in { items: [...] }
      if (ARRAY_CONFIG_KEYS.includes(key as any)) {
        batch.set(docRef, { items: data });
      } else {
        batch.set(docRef, data);
      }
    });

    await batch.commit();

    return true;
  } catch (error) {
    console.error('Error initializing config in Firestore:', error);
    return false;
  }
};
