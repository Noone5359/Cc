import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useMemo,
  useCallback,
} from 'react';

import { AcademicCalendarData, CalendarEvent } from '@/types';

import { PRELOADED_CALENDAR_DATA } from '@config/academicCalendar';
import { useAuth } from '@features/auth/hooks/useAuth';

import { useAppConfig } from './AppConfigContext';

import { db } from '@lib/firebase';
// FIX: Updated Firebase imports for v9 compatibility.
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { logActivity } from '@services/activityService';

interface CalendarContextType {
  calendarData: AcademicCalendarData | null;
  setCalendarData: React.Dispatch<React.SetStateAction<AcademicCalendarData | null>>;
  loading: boolean;
  addUserEvent: (event: CalendarEvent) => Promise<void>;
  updateUserEvent: (eventId: string, event: CalendarEvent) => Promise<void>;
  deleteUserEvent: (eventId: string) => Promise<void>;
  reminderPreferences: string[];
  toggleReminderPreference: (eventKey: string) => Promise<void>;
  getEventKey: (event: CalendarEvent) => string;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

// Helper function to adjust the years of academic calendar events to the current year
const adjustCalendarDatesToCurrentYear = (data: AcademicCalendarData): AcademicCalendarData => {
  const currentYear = new Date().getFullYear();
  const originalStartYear = new Date(data.semesterStartDate).getFullYear();

  const adjustedEvents = data.events.map((event) => {
    const originalEventDate = new Date(`${event.date}T12:00:00Z`); // Use midday UTC to avoid timezone shifts
    const originalEventYear = originalEventDate.getUTCFullYear();
    const yearOffset = originalEventYear - originalStartYear;
    const newYear = currentYear + yearOffset;

    // Adjust start date
    const adjustedStartDate = new Date(originalEventDate);
    adjustedStartDate.setUTCFullYear(newYear);
    const newStartDateString = adjustedStartDate.toISOString().slice(0, 10);

    // Adjust end date if it exists
    let newEndDateString: string | undefined = undefined;
    if (event.endDate) {
      const originalEndDate = new Date(`${event.endDate}T12:00:00Z`);
      const originalEndYear = originalEndDate.getUTCFullYear();
      const endYearOffset = originalEndYear - originalStartYear;
      const adjustedEndDate = new Date(originalEndDate);
      adjustedEndDate.setUTCFullYear(currentYear + endYearOffset);
      newEndDateString = adjustedEndDate.toISOString().slice(0, 10);
    }

    const adjustedEvent: CalendarEvent = {
      ...event,
      date: newStartDateString,
    };

    // Only include endDate if it exists to avoid assigning undefined
    if (newEndDateString) {
      adjustedEvent.endDate = newEndDateString;
    }

    return adjustedEvent;
  });

  const adjustedStartDate = new Date(`${data.semesterStartDate}T12:00:00Z`);
  adjustedStartDate.setUTCFullYear(currentYear);

  const adjustedEndDate = new Date(`${data.semesterEndDate}T12:00:00Z`);
  const originalEndYear = adjustedEndDate.getUTCFullYear();
  const endYearOffset = originalEndYear - originalStartYear;
  adjustedEndDate.setUTCFullYear(currentYear + endYearOffset);

  return {
    ...data,
    semesterStartDate: adjustedStartDate.toISOString().slice(0, 10),
    semesterEndDate: adjustedEndDate.toISOString().slice(0, 10),
    events: adjustedEvents,
  };
};

export const CalendarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const { config } = useAppConfig();
  const [calendarData, setCalendarData] = useState<AcademicCalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userEvents, setUserEvents] = useState<CalendarEvent[]>([]);
  const [reminderPreferences, setReminderPreferences] = useState<string[]>([]);

  // Generate unique key for an event
  const getEventKey = useCallback((event: CalendarEvent): string => {
    return `${event.date}-${event.description}`;
  }, []);

  // Load user's custom events from Firebase
  useEffect(() => {
    if (!currentUser) {
      setUserEvents([]);
      return;
    }

    const q = db.collection('userEvents').where('userId', '==', currentUser.uid);

    const unsubscribe = q.onSnapshot((snapshot: firebase.firestore.QuerySnapshot) => {
      const events = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
        } as CalendarEvent;
      });
      setUserEvents(events);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Load user's reminder preferences
  useEffect(() => {
    if (!currentUser) {
      setReminderPreferences([]);
      return;
    }

    const loadPreferences = async () => {
      try {
        const prefDocRef = db.collection('userReminderPreferences').doc(currentUser.uid);
        const prefDoc = await prefDocRef.get();

        if (prefDoc.exists) {
          const data = prefDoc.data();
          if (data && data.reminderEventKeys) {
            setReminderPreferences(data.reminderEventKeys || []);
          }
        } else {
          setReminderPreferences([]);
        }
      } catch (error) {
        console.error('Error loading reminder preferences:', error);
      }
    };

    loadPreferences();
  }, [currentUser]);

  // Toggle reminder preference for an event
  const toggleReminderPreference = useCallback(
    async (eventKey: string) => {
      if (!currentUser) throw new Error('User must be logged in');

      // Store previous state before updating
      const previousPreferences = [...reminderPreferences];
      const newPreferences = reminderPreferences.includes(eventKey)
        ? reminderPreferences.filter((key) => key !== eventKey)
        : [...reminderPreferences, eventKey];

      const isAdding = newPreferences.length > reminderPreferences.length;
      const eventDescription = eventKey.split('-').slice(1).join('-');

      // Optimistically update UI
      setReminderPreferences(newPreferences);

      try {
        const prefDocRef = db.collection('userReminderPreferences').doc(currentUser.uid);
        await prefDocRef.set({
          userId: currentUser.uid,
          reminderEventKeys: newPreferences,
        });
        await logActivity(currentUser.uid, {
          type: 'reminder',
          title: isAdding ? 'Reminder Set' : 'Reminder Removed',
          description: `For event: "${eventDescription}"`,
          icon: isAdding ? '🔔' : '🔕',
          link: '/academic-calendar',
        });
      } catch (error) {
        console.error('Error updating reminder preferences:', error);
        // Revert to previous state on error
        setReminderPreferences(previousPreferences);
      }
    },
    [currentUser, reminderPreferences]
  );

  // Merge config calendar data (from database) with user events and adjust dates
  useEffect(() => {
    setLoading(true);

    // Check if we have admin-configured calendar data in the database
    const hasAdminConfiguredData = config?.calendar && config.calendar.events?.length > 0;

    // Use calendar data from database config if available, otherwise fallback to preloaded
    const baseCalendarData = hasAdminConfiguredData
      ? {
          semesterStartDate: config.calendar.semesterStartDate,
          semesterEndDate: config.calendar.semesterEndDate,
          events: config.calendar.events.map((e) => ({
            ...e,
            type: e.type as CalendarEvent['type'],
          })),
        }
      : PRELOADED_CALENDAR_DATA;

    // Only adjust dates for preloaded/fallback data, NOT for admin-configured data
    // Admin-configured data should be used as-is to match the admin panel
    const adjustedPreloadedData = hasAdminConfiguredData
      ? baseCalendarData
      : adjustCalendarDatesToCurrentYear(baseCalendarData);

    // Combine adjusted preloaded events with user events (user events are assumed to be for current year)
    const mergedEvents = [...adjustedPreloadedData.events, ...userEvents].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Determine the current semester based on today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Define semester boundaries based on events
    // We look for "Start of Semester" and "End-Semester Exams"
    const semesterStarts = mergedEvents
      .filter((e) => e.type === 'Start of Semester')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const semesterEnds = mergedEvents
      .filter((e) => e.type === 'End-Semester Exams')
      .sort(
        (a, b) => new Date(a.endDate || a.date).getTime() - new Date(b.endDate || b.date).getTime()
      );

    let currentSemesterStart = adjustedPreloadedData.semesterStartDate;
    let currentSemesterEnd = adjustedPreloadedData.semesterEndDate;

    // Logic to find the active or next semester
    // 1. Try to find a semester we are currently in
    let foundActiveSemester = false;

    for (let i = 0; i < semesterStarts.length; i++) {
      const startEvent = semesterStarts[i];
      if (!startEvent) continue;

      // Find the corresponding end event (the next one after this start)
      const endEvent = semesterEnds.find(
        (e) => new Date(e.endDate || e.date) > new Date(startEvent.date)
      );

      if (endEvent) {
        const startDate = new Date(startEvent.date);
        const endDate = new Date(endEvent.endDate || endEvent.date);

        // If today is within this range, pick it
        if (today >= startDate && today <= endDate) {
          currentSemesterStart = startEvent.date;
          currentSemesterEnd = endEvent.endDate || endEvent.date;
          foundActiveSemester = true;
          break;
        }
      }
    }

    // 2. If not in an active semester, find the NEXT semester
    if (!foundActiveSemester) {
      for (let i = 0; i < semesterStarts.length; i++) {
        const startEvent = semesterStarts[i];
        if (!startEvent) continue;

        const startDate = new Date(startEvent.date);

        if (today < startDate) {
          // This is the next upcoming semester
          // Check if we are within 7 days of the start date
          const diffTime = startDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays <= 7) {
            const endEvent = semesterEnds.find(
              (e) => new Date(e.endDate || e.date) > new Date(startEvent.date)
            );
            if (endEvent) {
              currentSemesterStart = startEvent.date;
              currentSemesterEnd = endEvent.endDate || endEvent.date;
              foundActiveSemester = true;
              break;
            }
          }
        }
      }
    }

    const lastSemesterEnd = semesterEnds.length > 0 ? semesterEnds[semesterEnds.length - 1] : null;
    const firstSemesterStart = semesterStarts.length > 0 ? semesterStarts[0] : null;

    setCalendarData({
      ...adjustedPreloadedData,
      semesterStartDate: currentSemesterStart,
      semesterEndDate: currentSemesterEnd,
      semesterName: config?.calendar?.semesterName || undefined, // Propagate admin-configured semester name
      events: mergedEvents,
      academicYearStartDate: firstSemesterStart ? firstSemesterStart.date : currentSemesterStart,
      academicYearEndDate: lastSemesterEnd
        ? lastSemesterEnd.endDate || lastSemesterEnd.date
        : currentSemesterEnd,
    });

    setLoading(false);
  }, [userEvents, config?.calendar]);

  // Cleanup reminders for past events automatically
  const cleanupPastEventReminders = useCallback(async () => {
    if (!currentUser || !calendarData) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter out reminder preferences for events that have passed
    const updatedPreferences = reminderPreferences.filter((eventKey) => {
      // Find the event in calendarData that matches this key
      const event = calendarData.events.find((e) => getEventKey(e) === eventKey);

      if (!event) {
        return false; // Remove if event doesn't exist
      }

      // Get the end date of the event
      const eventEndDate = new Date(event.endDate || event.date);
      eventEndDate.setHours(0, 0, 0, 0);

      // Keep the reminder if the event hasn't ended yet
      return eventEndDate >= today;
    });

    // If there are reminders to remove, update the backend
    if (updatedPreferences.length < reminderPreferences.length) {
      setReminderPreferences(updatedPreferences);

      try {
        const prefDocRef = db.collection('userReminderPreferences').doc(currentUser.uid);
        await prefDocRef.set({
          userId: currentUser.uid,
          reminderEventKeys: updatedPreferences,
        });
      } catch (error) {
        console.error('Error cleaning up past event reminders:', error);
      }
    }
  }, [currentUser, calendarData, reminderPreferences, getEventKey]);

  // Run reminder cleanup when calendar data or reminders change
  useEffect(() => {
    if (!currentUser || !calendarData) return;

    // Run cleanup immediately
    cleanupPastEventReminders();

    // Run cleanup once per day (24 hours)
    const intervalId = setInterval(cleanupPastEventReminders, 24 * 60 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [currentUser, calendarData]); // Removed cleanupPastEventReminders from deps to avoid infinite loop

  // Add user event to Firebase
  const addUserEvent = useCallback(
    async (event: CalendarEvent) => {
      if (!currentUser) throw new Error('User must be logged in');

      const eventData = {
        ...event,
        userId: currentUser.uid,
        createdAt: new Date().toISOString(),
      };

      await db.collection('userEvents').add(eventData);

      await logActivity(currentUser.uid, {
        type: 'event',
        title: 'Event Added',
        description: `Added "${event.description}" to calendar.`,
        icon: '📅',
        link: '/academic-calendar',
      });
    },
    [currentUser]
  );

  // Update user event in Firebase
  const updateUserEvent = useCallback(
    async (eventId: string, event: CalendarEvent) => {
      if (!currentUser) throw new Error('User must be logged in');

      const eventRef = db.collection('userEvents').doc(eventId);
      const oldEventSnap = await eventRef.get();
      const oldEvent = oldEventSnap.data() as CalendarEvent;

      await eventRef.update({
        ...event,
        updatedAt: new Date().toISOString(),
      });

      // Check if only reminder was toggled
      const reminderToggled = oldEvent.remindMe !== event.remindMe;
      const onlyReminderChanged =
        reminderToggled &&
        oldEvent.date === event.date &&
        oldEvent.description === event.description &&
        oldEvent.type === event.type;

      // Sync reminder preference with remindMe flag
      if (reminderToggled) {
        const eventKey = getEventKey(event);
        const hasPreference = reminderPreferences.includes(eventKey);

        // If remindMe is true but preference doesn't exist, add it
        if (event.remindMe && !hasPreference) {
          await toggleReminderPreference(eventKey);
        }
        // If remindMe is false but preference exists, remove it
        else if (!event.remindMe && hasPreference) {
          await toggleReminderPreference(eventKey);
        }
      }

      if (onlyReminderChanged) {
        await logActivity(currentUser.uid, {
          type: 'reminder',
          title: event.remindMe ? 'Reminder Set' : 'Reminder Removed',
          description: `For event: "${event.description}"`,
          icon: event.remindMe ? '🔔' : '🔕',
          link: '/academic-calendar',
        });
      } else {
        await logActivity(currentUser.uid, {
          type: 'event',
          title: 'Event Updated',
          description: `Updated event: "${event.description}"`,
          icon: '✏️',
          link: '/academic-calendar',
        });
      }
    },
    [currentUser, reminderPreferences, getEventKey, toggleReminderPreference]
  );

  // Delete user event from Firebase
  const deleteUserEvent = useCallback(
    async (eventId: string) => {
      if (!currentUser) throw new Error('User must be logged in');

      const eventRef = db.collection('userEvents').doc(eventId);
      const eventSnap = await eventRef.get();

      if (eventSnap.exists) {
        const eventData = eventSnap.data() as CalendarEvent;

        // Delete the event from Firebase
        await eventRef.delete();

        // Remove reminder preference if it exists
        const eventKey = getEventKey(eventData);
        if (reminderPreferences.includes(eventKey)) {
          const newPreferences = reminderPreferences.filter((key) => key !== eventKey);
          setReminderPreferences(newPreferences);

          try {
            const prefDocRef = db.collection('userReminderPreferences').doc(currentUser.uid);
            await prefDocRef.set({
              userId: currentUser.uid,
              reminderEventKeys: newPreferences,
            });
          } catch (error) {
            console.error('Error removing reminder preference:', error);
          }
        }

        await logActivity(currentUser.uid, {
          type: 'event',
          title: 'Event Deleted',
          description: `Deleted event: "${eventData.description}"${reminderPreferences.includes(eventKey) ? ' and its reminder' : ''}`,
          icon: '🗑️',
          link: '/academic-calendar',
        });
      } else {
        // Fallback if the event doesn't exist for some reason
        await eventRef.delete();
      }
    },
    [currentUser, reminderPreferences, getEventKey]
  );

  const contextValue = useMemo(
    () => ({
      calendarData,
      setCalendarData,
      loading,
      addUserEvent,
      updateUserEvent,
      deleteUserEvent,
      reminderPreferences,
      toggleReminderPreference,
      getEventKey,
    }),
    [
      calendarData,
      setCalendarData,
      loading,
      addUserEvent,
      updateUserEvent,
      deleteUserEvent,
      reminderPreferences,
      toggleReminderPreference,
      getEventKey,
    ]
  );

  return <CalendarContext.Provider value={contextValue}>{children}</CalendarContext.Provider>;
};

export const useCalendar = () => {
  const context = useContext(CalendarContext);
  if (context === undefined) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
};
