import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
// @ts-ignore
const { GoogleGenerativeAI } = require('@google/genai');

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();


interface CampusEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  category: string;
  organizer: string;
  imageUrl: string;
  sourceUrl?: string;
}

interface Announcement {
  id: string;
  title: string;
  date: string;
  content: string;
  category: string;
  author: string;
  sourceUrl?: string;
}

interface GeminiSearchResult {
  events: Omit<CampusEvent, 'id'>[];
  announcements: Omit<Announcement, 'id'>[];
}

/**
 * Fetches latest news, events, and announcements about IIT Dhanbad using Gemini AI
 */
async function fetchIITDhanbadUpdates(): Promise<GeminiSearchResult> {
  const apiKey = functions.config().gemini?.api_key || import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    console.error('Gemini API key not found in config or environment variables');
    throw new Error('Gemini API key not configured');
  }

  console.log('Using Gemini API key:', apiKey.substring(0, 10) + '...');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `You are an AI assistant tasked with extracting the LATEST and MOST RECENT information about IIT Dhanbad (Indian Institute of Technology Dhanbad). Your goal is to act like a web scraper and pull authentic data from the official sources provided.

CRITICAL: Today's date is October 17, 2025. You MUST ONLY include information with dates from 2025 onwards. IGNORE and DISCARD any items from 2024 or earlier.

EXTRACT information ONLY from the following official IIT (ISM) Dhanbad URLs:
- Main Website: https://www.iitism.ac.in/
- Notices: https://www.iitism.ac.in/notices
- Events: https://www.iitism.ac.in/events
- News: https://www.iitism.ac.in/news
- Academic Calendar: https://www.iitism.ac.in/academic-calendar

Based on the content found at these URLs, identify and extract the following:
1.  **Upcoming campus events:** Look for workshops, seminars, fests (Concetto, Srijan, Parakram, Basant), placement drives, etc. scheduled for on or after October 17, 2025.
2.  **Recent announcements and news:** Look for academic notices, exam schedules, registration deadlines, collaborations, achievements, etc., published recently in 2025.
3.  **Academic calendar events:** Look for holidays, exam periods, semester start/end dates, timetable changes, and other academic calendar events that affect the regular class schedule.

MANDATORY REQUIREMENTS:
- ALL data (events, announcements, news) MUST be directly extracted from the content of the provided URLs. Do NOT invent or generate any information.
- ALL dates MUST be from 2025. Verify this for every single item.
- For the "sourceUrl" field, you MUST use the exact URL from the list above from which you extracted the information. For example, if you extract an event from the events page, the sourceUrl MUST be "https://www.iitism.ac.in/events".
- Generate between 8 to 12 of the most recent and relevant items you can find.
- Provide realistic details for each field based on the source. If a detail (like time or organizer) is not available, you can use a sensible placeholder like "To be announced" or the relevant department name.
- For imageUrl, use reliable placeholder images from https://picsum.photos/800/400?random=X where X is a different number for each event.

Return your response in a valid JSON format as specified below:
{
  "events": [
    {
      "title": "Extracted Event Title",
      "date": "2025-10-28",
      "time": "10:00 AM",
      "location": "Extracted Venue",
      "description": "Extracted detailed description of the event.",
      "category": "Technical",
      "organizer": "Extracted Organizing Department",
      "imageUrl": "https://picsum.photos/800/400?random=1",
      "sourceUrl": "https://www.iitism.ac.in/events"
    }
  ],
  "announcements": [
    {
      "title": "Extracted Announcement Title",
      "date": "2025-10-17",
      "content": "Extracted content of the announcement or news.",
      "category": "Academic",
      "author": "Registrar Office",
      "sourceUrl": "https://www.iitism.ac.in/notices"
    }
  ]
}

CRITICAL VALIDATION before returning the JSON:
- Is every single date in 2025?
- Does every "sourceUrl" exactly match one of the URLs provided in this prompt?
- Is the information realistic and directly derivable from official university communications?
- Are all imageUrl fields using the picsum.photos format with different random numbers?`;

  try {
    console.log('Sending request to Gemini API...');
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    console.log('Received response from Gemini API, length:', text.length);
    console.log('Response preview:', text.substring(0, 200) + '...');

    // Extract JSON from response (might be wrapped in markdown code blocks)
    let jsonText = text;
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
      console.log('Extracted JSON from markdown code block');
    } else {
      const codeMatch = text.match(/```\n([\s\S]*?)\n```/);
      if (codeMatch) {
        jsonText = codeMatch[1];
        console.log('Extracted JSON from generic code block');
      } else {
        console.log('No code blocks found, using raw text');
      }
    }

    console.log('Attempting to parse JSON...');
    const data: GeminiSearchResult = JSON.parse(jsonText);
    console.log('Successfully parsed JSON:', { events: data.events?.length || 0, announcements: data.announcements?.length || 0 });

    // Validate and sanitize the data
    if (!data.events) data.events = [];
    if (!data.announcements) data.announcements = [];

    // Fix and validate URLs
    const validUrls = [
      'https://www.iitism.ac.in/',
      'https://www.iitism.ac.in/notices',
      'https://www.iitism.ac.in/events',
      'https://www.iitism.ac.in/news',
      'https://www.iitism.ac.in/academic-calendar'
    ];

    // Ensure all events have valid URLs
    data.events = data.events.map(event => {
      if (!event.sourceUrl || !validUrls.includes(event.sourceUrl)) {
        // Default to events page for events
        event.sourceUrl = 'https://www.iitism.ac.in/events';
      }
      return event;
    });

    // Ensure all announcements have valid URLs
    data.announcements = data.announcements.map(announcement => {
      if (!announcement.sourceUrl || !validUrls.includes(announcement.sourceUrl)) {
        // Default to notices page for announcements
        announcement.sourceUrl = 'https://www.iitism.ac.in/notices';
      }
      return announcement;
    });

    return data;
  } catch (error) {
    console.error('Error fetching IIT Dhanbad updates:', error);
    
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    // Return empty data instead of throwing to prevent function crashes
    console.log('Returning empty data due to error');
    return {
      events: [],
      announcements: []
    };
  }
}

/**
 * Stores events in Firestore, avoiding duplicates and filtering old dates
 */
async function storeEvents(events: Omit<CampusEvent, 'id'>[]): Promise<void> {
  const eventsRef = db.collection('events');
  const cutoffDate = '2025-01-01'; // Only store events from 2025 onwards

  for (const event of events) {
    // Skip events with old dates
    if (event.date < cutoffDate) {
      console.log(`Skipping old event (${event.date}): ${event.title}`);
      continue;
    }

    // Check for duplicates based on title and date
    const existingQuery = await eventsRef
      .where('title', '==', event.title)
      .where('date', '==', event.date)
      .limit(1)
      .get();

    if (existingQuery.empty) {
      // Add new event
      await eventsRef.add({
        ...event,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`Added new event (${event.date}): ${event.title}`);
    } else {
      // Update existing event
      const doc = existingQuery.docs[0];
      if (doc) {
        await eventsRef.doc(doc.id).update({
          ...event,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`Updated existing event (${event.date}): ${event.title}`);
      }
    }
  }
}

/**
 * Stores announcements in Firestore, avoiding duplicates and filtering old dates
 */
async function storeAnnouncements(announcements: Omit<Announcement, 'id'>[]): Promise<void> {
  const newsRef = db.collection('news');
   const cutoffDate = '2025-01-01'; // Only store events from 2025 onwards

  for (const announcement of announcements) {
    // Skip announcements with old dates
    if (announcement.date < cutoffDate) {
      console.log(`Skipping old announcement (${announcement.date}): ${announcement.title}`);
      continue;
    }

    // Check for duplicates based on title and date
    const existingQuery = await newsRef
      .where('title', '==', announcement.title)
      .where('date', '==', announcement.date)
      .limit(1)
      .get();

    if (existingQuery.empty) {
      // Add new announcement
      await newsRef.add({
        ...announcement,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`Added new announcement (${announcement.date}): ${announcement.title}`);
    } else {
      // Update existing announcement
      const doc = existingQuery.docs[0];
      if (doc) {
        await newsRef.doc(doc.id).update({
          ...announcement,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`Updated existing announcement (${announcement.date}): ${announcement.title}`);
      }
    }
  }
}

/**
 * Cloud Function that runs every 6 hours to fetch and store IIT Dhanbad updates
 * Schedule: Runs at 00:00, 06:00, 12:00, 18:00
 */
export const fetchIITDhanbadData = functions
  .runWith({ timeoutSeconds: 300, memory: '512MB' })
  .pubsub
  .schedule('0 */6 * * *')
  .timeZone('Asia/Kolkata')
  .onRun(async () => {
    console.log('Starting scheduled fetch of IIT Dhanbad updates...');

    try {
      const data = await fetchIITDhanbadUpdates();

      console.log(`Fetched ${data.events.length} events and ${data.announcements.length} announcements`);

      // Store in Firestore
      await storeEvents(data.events);
      await storeAnnouncements(data.announcements);

      console.log('Successfully completed IIT Dhanbad data fetch and storage');
      return null;
    } catch (error) {
      console.error('Error in scheduled function:', error);
      throw error;
    }
  });

/**
 * HTTP callable function to manually trigger the data fetch
 * Useful for testing and immediate updates
 */
export const manualFetchIITDhanbadData = functions.https.onCall(async () => {
  console.log('Manual fetch triggered');

  try {
    const updates = await fetchIITDhanbadUpdates();

    console.log(`Fetched ${updates.events.length} events and ${updates.announcements.length} announcements`);

    await storeEvents(updates.events);
    await storeAnnouncements(updates.announcements);

    return {
      success: true,
      message: `Successfully fetched and stored ${updates.events.length} events and ${updates.announcements.length} announcements`,
      eventsCount: updates.events.length,
      announcementsCount: updates.announcements.length,
    };
  } catch (error) {
    console.error('Error in manual fetch:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to fetch IIT Dhanbad updates',
      error
    );
  }
});

/**
 * Simple HTTP endpoint for easy manual testing
 * Access via: http://localhost:5001/PROJECT-ID/us-central1/triggerFetch
 */
export const triggerFetch = functions
  .runWith({ timeoutSeconds: 300, memory: '512MB' })
  .https.onRequest(async (_req, res) => {
    console.log('Manual fetch triggered via HTTP');

    try {
      const updates = await fetchIITDhanbadUpdates();

      console.log(`Fetched ${updates.events.length} events and ${updates.announcements.length} announcements`);

      await storeEvents(updates.events);
      await storeAnnouncements(updates.announcements);

      res.status(200).json({
        success: true,
        message: `Successfully fetched and stored ${updates.events.length} events and ${updates.announcements.length} announcements`,
        eventsCount: updates.events.length,
        announcementsCount: updates.announcements.length,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error in manual fetch:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

/**
 * Test function to debug API key and basic functionality
 * Access via: http://localhost:5001/PROJECT-ID/us-central1/testGemini
 */
export const testGemini = functions
  .runWith({ timeoutSeconds: 60, memory: '256MB' })
  .https.onRequest(async (_req, res) => {
    console.log('Testing Gemini API connection...');

    try {
      const apiKey = functions.config().gemini?.api_key || process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        res.status(400).json({
          success: false,
          error: 'Gemini API key not configured',
          config: {
            hasConfigKey: !!functions.config().gemini?.api_key,
            hasEnvKey: !!process.env.GEMINI_API_KEY
          }
        });
        return;
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const testPrompt = 'Say "Hello, Gemini API is working!" in JSON format: {"message": "your response"}';
      
      const result = await model.generateContent(testPrompt);
      const response = result.response;
      const text = response.text();

      res.status(200).json({
        success: true,
        message: 'Gemini API is working',
        response: text,
        apiKeyPrefix: apiKey.substring(0, 10) + '...'
      });

    } catch (error) {
      console.error('Gemini API test failed:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  });
