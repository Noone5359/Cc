// FIX: Update Firebase imports to v8 compat syntax.
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { db } from '@lib/firebase';

import { ActivityType, ActivityItem } from '@/types';

import { retryOnlyIfRetryable } from '@lib/utils/retryLogic';
import {
  ACTIVITY_LOG_MAX_RETRIES,
  ACTIVITY_LOG_RETRY_DELAY_MS,
  ACTIVITY_LOG_PAGE_SIZE,
  MAX_ACTIVITIES_STORED,
} from '@lib/utils/constants';

export interface ActivityLog {
  type: ActivityType;
  title: string;
  description: string;
  icon: string;
  link?: string;
}

export interface ActivityLogPage {
  activities: ActivityItem[];
  lastDoc: firebase.firestore.QueryDocumentSnapshot | null;
  hasMore: boolean;
}

export const logActivity = async (userId: string, activity: ActivityLog) => {
  if (!userId) {
    console.warn('Attempted to log activity without a userId.');
    return;
  }
  try {
    // Use retry logic for network resilience
    await retryOnlyIfRetryable(
      async () => {
        const activityCollectionRef = db.collection('users').doc(userId).collection('activity');

        // Add new activity
        await activityCollectionRef.add({
          ...activity,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        });

        // Note: Cleanup is now handled separately via cleanupOldActivities()
        // which is called on login/logout to avoid expensive reads on every activity log
      },
      ACTIVITY_LOG_MAX_RETRIES,
      ACTIVITY_LOG_RETRY_DELAY_MS
    );
  } catch (error: unknown) {
    console.error('Error logging activity: ', error);
    const isFirebaseError = (err: unknown): err is { code: string } => {
      return typeof err === 'object' && err !== null && 'code' in err;
    };
    if (isFirebaseError(error) && error.code === 'permission-denied') {
      console.error(
        'Firestore Security Rules Error: The current user does not have permission to write to their own activity log. ' +
          "Please ensure your Firestore rules allow writes on the 'users/{userId}/activity/{activityId}' path for authenticated users."
      );
    }
    // Don't throw - activity logging is non-critical
  }
};

/**
 * Fetch activity logs with pagination
 * @param userId - User ID to fetch activities for
 * @param lastDoc - Last document from previous page (for pagination)
 * @param pageSize - Number of activities per page
 * @returns ActivityLogPage with activities and pagination info
 */
export const fetchActivityLogs = async (
  userId: string,
  lastDoc: firebase.firestore.QueryDocumentSnapshot | null = null,
  pageSize: number = ACTIVITY_LOG_PAGE_SIZE
): Promise<ActivityLogPage> => {
  if (!userId) {
    throw new Error('userId is required to fetch activity logs');
  }

  try {
    const activityCollectionRef = db
      .collection('users')
      .doc(userId)
      .collection('activity')
      .orderBy('timestamp', 'desc')
      .limit(pageSize + 1); // Fetch one extra to check if there are more

    // If we have a lastDoc, start after it
    const query = lastDoc ? activityCollectionRef.startAfter(lastDoc) : activityCollectionRef;

    const snapshot = await query.get();
    const docs = snapshot.docs;

    // Check if there are more items
    const hasMore = docs.length > pageSize;
    const activities = docs.slice(0, pageSize).map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ActivityItem[];

    // Get the last doc for next page
    const newLastDoc = hasMore ? docs[pageSize - 1] || null : null;

    return {
      activities,
      lastDoc: newLastDoc,
      hasMore,
    };
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    throw error;
  }
};

/**
 * Clean up old activities for a user - keep only latest 30
 * This can be called manually or on app initialization
 * @param userId - User ID to clean up activities for
 */
export const cleanupOldActivities = async (userId: string): Promise<void> => {
  if (!userId) {
    console.warn('Attempted to cleanup activities without a userId.');
    return;
  }

  try {
    const activityCollectionRef = db.collection('users').doc(userId).collection('activity');

    const allActivities = await activityCollectionRef.orderBy('timestamp', 'desc').get();

    // If we have more than MAX_ACTIVITIES_STORED, delete the oldest ones
    if (allActivities.size > MAX_ACTIVITIES_STORED) {
      const batch = db.batch();
      const activitiesToDelete = allActivities.docs.slice(MAX_ACTIVITIES_STORED);

      activitiesToDelete.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
    }
  } catch (error) {
    console.error('Error cleaning up old activities:', error);
    // Don't throw - cleanup is non-critical
  }
};
