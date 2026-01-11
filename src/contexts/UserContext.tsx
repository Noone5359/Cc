// src/contexts/UserContext.tsx

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import firebase from 'firebase/compat/app';

import 'firebase/compat/auth';
import { STUDENT_DIRECTORY } from '@config/studentDirectory';
import { auth, db, storage } from '@lib/firebase';
import {
  MAX_FILE_SIZE_BYTES,
  ALLOWED_IMAGE_TYPES,
  PROFILE_PICTURES_PATH,
} from '@lib/utils/constants';
import { getCourseOptionFromAdmissionNumber } from '@lib/utils/courseUtils';
import { getImageCompression } from '@lib/utils/lazyImports';
import { logActivity, cleanupOldActivities } from '@services/activityService';

import { User } from '@/types';

interface UserContextType {
  user: User | null;
  updateUser: (newDetails: Partial<User>) => Promise<void>;
  uploadProfilePicture: (file: File) => Promise<void>;

  loading: boolean;
  error: Error | null; // ENHANCEMENT: Expose error state to the UI.
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null); // ENHANCEMENT: State for errors.

  useEffect(() => {
    let unsubscribeFromFirestore: (() => void) | null = null;

    const initializeUser = async (authUser: firebase.User) => {
      const userDocRef = db.collection('users').doc(authUser.uid);

      try {
        const created = await db.runTransaction(async (transaction) => {
          const doc = await transaction.get(userDocRef);
          if (!doc.exists) {
            const admissionNumber = authUser.email?.split('@')[0]?.toUpperCase() ?? 'Unknown';
            const directoryEntry = STUDENT_DIRECTORY.find(
              (student) => student.admNo === admissionNumber
            );

            const newUserProfile: Partial<User> = {
              id: authUser.uid,
              name: directoryEntry?.name ?? authUser.displayName ?? 'New Student',
              role: 'user', // Default role, may be upgraded to 'admin' by useRole hook
              admissionNumber: directoryEntry?.admNo ?? admissionNumber,
              branch: directoryEntry?.branch ?? '',
              hostel: '',
              email: authUser.email ?? '',
              phone: authUser.phoneNumber ?? '',
              ...(authUser.photoURL && { profilePicture: authUser.photoURL }),
              // Automatically set NEP for 24JE onwards, CBCS for earlier batches (23JE and below)
              courseOption: getCourseOptionFromAdmissionNumber(
                directoryEntry?.admNo ?? admissionNumber
              ),
              createdAt: firebase.firestore.FieldValue.serverTimestamp() as any,
            };

            // Use merge: true to prevent overwriting if document somehow exists on server but not in transaction cache
            transaction.set(userDocRef, newUserProfile, { merge: true });
            return true;
          }
          return false;
        });

        if (created) {
          await logActivity(authUser.uid, {
            type: 'login',
            title: 'Account Created',
            description: 'Welcome! Your account has been created.',
            icon: '🎉',
          });
        }
      } catch (e) {
        console.error('Error initializing user:', e);
        // Don't set error state here, as this might just be a network glitch and onSnapshot might still work from cache
      }
    };

    const unsubscribeFromAuth = auth.onAuthStateChanged(async (authUser) => {
      if (unsubscribeFromFirestore) {
        unsubscribeFromFirestore();
      }
      setError(null); // Reset error on auth state change.

      if (authUser) {
        setLoading(true);

        // Await initialization to prevent race condition where snapshot listener starts before user document is created
        await initializeUser(authUser);

        const userDocRef = db.collection('users').doc(authUser.uid); // Use compat API

        unsubscribeFromFirestore = userDocRef.onSnapshot(
          // Use compat API
          async (snapshot) => {
            try {
              if (snapshot.exists) {
                // Correctly set user object, including the ID from the snapshot
                setUser({ id: snapshot.id, ...snapshot.data() } as User);

                // Clean up old activities on login (keep only latest 30)
                cleanupOldActivities(authUser.uid).catch((err) => {
                  console.error('Failed to cleanup old activities:', err);
                });
              } else {
                // Document doesn't exist (yet).
                // It might be being created by initializeUser, or we are offline and it's not in cache.
                // We set user to null, waiting for the creation or sync.
                setUser(null);
              }
            } catch (e) {
              console.error('Error processing user profile:', e);
              setError(e instanceof Error ? e : new Error('An unknown error occurred.'));
              setUser(null);
            } finally {
              setLoading(false);
            }
          },
          (err) => {
            // This block catches listener-specific errors
            console.error('Error with user profile snapshot:', err);
            setError(err);
            setUser(null);
            setLoading(false);
          }
        );
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeFromAuth();
      if (unsubscribeFromFirestore) {
        unsubscribeFromFirestore();
      }
    };
  }, []);

  const updateUser = useCallback(async (newDetails: Partial<User>) => {
    const currentUserId = auth.currentUser?.uid;
    if (currentUserId) {
      try {
        const userDocRef = db.collection('users').doc(currentUserId); // Use compat API
        await userDocRef.update(newDetails); // Use compat API

        if (!newDetails.profilePicture) {
          await logActivity(currentUserId, {
            type: 'update',
            title: 'Profile Updated',
            description: 'Your profile information was successfully updated.',
            icon: '✏️',
            link: '/profile',
          });
        }
      } catch (e) {
        console.error('Failed to update user:', e);
        setError(e instanceof Error ? e : new Error('Failed to update profile.'));
        throw e;
      }
    }
  }, []);

  const uploadProfilePicture = useCallback(
    async (file: File) => {
      const currentUser = auth.currentUser;
      if (!currentUser || !user) throw new Error('Not authenticated or user data not loaded');

      const oldPhotoPath = user.profilePicturePath;

      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        throw new Error('Please upload a valid image file (JPEG, PNG, GIF, or WebP).');
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        throw new Error(`File size should not exceed ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.`);
      }

      // Compress image before upload
      let fileToUpload = file;
      try {
        // Only compress if file is larger than 1MB
        if (file.size > 1024 * 1024) {
          // Lazy load image compression library
          const imageCompression = await getImageCompression();

          const options = {
            maxSizeMB: 1, // Maximum file size in MB
            maxWidthOrHeight: 1024, // Max dimension
            useWebWorker: true,
            fileType: file.type,
          };

          fileToUpload = await imageCompression(file, options);
        }
      } catch (compressionError) {
        console.warn('Image compression failed, uploading original:', compressionError);
        // Continue with original file if compression fails
      }

      const filePath = `${PROFILE_PICTURES_PATH}/${currentUser.uid}/${Date.now()}_${file.name}`;
      const storageRef = storage.ref(filePath);
      const uploadTask = storageRef.put(fileToUpload);

      return new Promise<void>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          null, // No progress updates needed for now
          (error) => {
            console.error('Upload failed: ', error);
            reject(error);
          },
          async () => {
            try {
              const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();

              await currentUser.updateProfile({ photoURL: downloadURL });
              await updateUser({
                profilePicture: downloadURL,
                profilePicturePath: filePath,
              });

              await logActivity(currentUser.uid, {
                type: 'update',
                title: 'Profile Picture Updated',
                description: 'Your profile picture was successfully changed.',
                icon: '🖼️',
                link: '/profile',
              });

              // After successful update, delete the old picture using its stored path
              if (oldPhotoPath) {
                try {
                  const oldImageRef = storage.ref(oldPhotoPath);
                  await oldImageRef.delete();
                } catch (deleteError: unknown) {
                  // Non-blocking error: It's okay if the old file doesn't exist.
                  const isFirebaseError = (err: unknown): err is { code: string } => {
                    return typeof err === 'object' && err !== null && 'code' in err;
                  };
                  if (
                    isFirebaseError(deleteError) &&
                    deleteError.code !== 'storage/object-not-found'
                  ) {
                    console.warn('Failed to delete old profile picture:', deleteError);
                  }
                }
              }

              resolve();
            } catch (err) {
              // If any update fails, try to delete the newly uploaded image to clean up storage.
              try {
                await storageRef.delete();
              } catch (cleanupError) {
                console.error(
                  'Failed to clean up newly uploaded image after an error:',
                  cleanupError
                );
              }
              reject(err);
            }
          }
        );
      });
    },
    [user, updateUser]
  );

  const contextValue = useMemo(
    () => ({ user, updateUser, uploadProfilePicture, loading, error }),
    [user, updateUser, uploadProfilePicture, loading, error]
  );

  return <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
