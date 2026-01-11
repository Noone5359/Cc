import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

/**
 * Rate Limiter Middleware for Firebase Cloud Functions
 * 
 * Implements a sliding window rate limiter using Firestore.
 * Protects against abuse and DDoS attacks.
 */

const db = admin.firestore();

interface RateLimitConfig {
  maxRequests: number;    // Maximum requests per window
  windowMs: number;       // Time window in milliseconds
  keyPrefix?: string;     // Prefix for rate limit keys
}

interface RateLimitRecord {
  count: number;
  windowStart: admin.firestore.Timestamp;
}

/**
 * Default rate limit configurations for different endpoint types
 */
export const RATE_LIMIT_CONFIGS = {
  // Standard API endpoints: 60 requests per minute
  standard: {
    maxRequests: 60,
    windowMs: 60 * 1000,
    keyPrefix: 'rate_standard',
  } as RateLimitConfig,
  
  // Auth endpoints: 10 requests per minute (stricter)
  auth: {
    maxRequests: 10,
    windowMs: 60 * 1000,
    keyPrefix: 'rate_auth',
  } as RateLimitConfig,
  
  // Data mutation endpoints: 30 requests per minute
  mutation: {
    maxRequests: 30,
    windowMs: 60 * 1000,
    keyPrefix: 'rate_mutation',
  } as RateLimitConfig,
  
  // Bulk operations: 5 requests per minute (very strict)
  bulk: {
    maxRequests: 5,
    windowMs: 60 * 1000,
    keyPrefix: 'rate_bulk',
  } as RateLimitConfig,
};

/**
 * Extracts client identifier from request.
 * Uses IP address with fallback to a header-based ID.
 */
function getClientId(req: functions.https.Request): string {
  // Try to get IP from various headers (for proxied requests)
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    const ips = Array.isArray(forwardedFor) 
      ? forwardedFor[0] 
      : forwardedFor.split(',')[0];
    return ips?.trim() || 'unknown';
  }
  
  // Fall back to direct IP
  return req.ip || 'unknown';
}

/**
 * Checks if a request should be rate limited.
 * Returns true if the request is allowed, false if rate limited.
 */
export async function checkRateLimit(
  clientId: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const prefix = config.keyPrefix || 'rate_limit';
  const docId = `${prefix}_${clientId.replace(/[^a-zA-Z0-9]/g, '_')}`;
  const docRef = db.collection('_rateLimits').doc(docId);

  try {
    const result = await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(docRef);
      const now = admin.firestore.Timestamp.now();
      const nowMs = now.toMillis();

      if (!doc.exists) {
        // First request - create new record
        const record: RateLimitRecord = {
          count: 1,
          windowStart: now,
        };
        transaction.set(docRef, record);
        return {
          allowed: true,
          remaining: config.maxRequests - 1,
          resetAt: new Date(nowMs + config.windowMs),
        };
      }

      const data = doc.data() as RateLimitRecord;
      const windowStartMs = data.windowStart.toMillis();
      const windowAge = nowMs - windowStartMs;

      if (windowAge >= config.windowMs) {
        // Window expired - reset
        const record: RateLimitRecord = {
          count: 1,
          windowStart: now,
        };
        transaction.set(docRef, record);
        return {
          allowed: true,
          remaining: config.maxRequests - 1,
          resetAt: new Date(nowMs + config.windowMs),
        };
      }

      // Within window - increment counter
      if (data.count >= config.maxRequests) {
        // Rate limit exceeded
        return {
          allowed: false,
          remaining: 0,
          resetAt: new Date(windowStartMs + config.windowMs),
        };
      }

      // Increment and allow
      transaction.update(docRef, {
        count: admin.firestore.FieldValue.increment(1),
      });

      return {
        allowed: true,
        remaining: config.maxRequests - data.count - 1,
        resetAt: new Date(windowStartMs + config.windowMs),
      };
    });

    return result;
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // On error, allow the request but log the issue
    return {
      allowed: true,
      remaining: -1,
      resetAt: new Date(Date.now() + config.windowMs),
    };
  }
}

/**
 * Rate limiting middleware for HTTP functions.
 * Wraps a handler function with rate limiting logic.
 */
export function withRateLimit(
  config: RateLimitConfig,
  handler: (req: functions.https.Request, res: functions.Response) => Promise<void>
) {
  return async (req: functions.https.Request, res: functions.Response) => {
    const clientId = getClientId(req);
    const result = await checkRateLimit(clientId, config);

    // Set rate limit headers
    res.set('X-RateLimit-Limit', config.maxRequests.toString());
    res.set('X-RateLimit-Remaining', Math.max(0, result.remaining).toString());
    res.set('X-RateLimit-Reset', result.resetAt.toISOString());

    if (!result.allowed) {
      res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((result.resetAt.getTime() - Date.now()) / 1000),
        resetAt: result.resetAt.toISOString(),
      });
      return;
    }

    // Proceed with the handler
    await handler(req, res);
  };
}

/**
 * Cleanup old rate limit records.
 * Run this as a scheduled function to prevent Firestore bloat.
 */
export async function cleanupRateLimits(): Promise<number> {
  const cutoff = admin.firestore.Timestamp.fromDate(
    new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
  );

  const snapshot = await db
    .collection('_rateLimits')
    .where('windowStart', '<', cutoff)
    .limit(500) // Process in batches
    .get();

  if (snapshot.empty) {
    return 0;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  return snapshot.size;
}
