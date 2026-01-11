/**
 * Security Utilities
 *
 * Provides bank-grade security functions for input validation and sanitization.
 * Use these functions to protect against XSS, injection attacks, and malformed data.
 */

/**
 * HTML entity map for escaping dangerous characters
 */
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

/**
 * Escape HTML entities to prevent XSS attacks.
 * Use this when displaying user-generated content in HTML.
 *
 * @param input - The string to sanitize
 * @returns HTML-escaped string safe for rendering
 */
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  return input.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Remove potentially dangerous characters from input.
 * Use this for general input sanitization.
 *
 * @param input - The string to sanitize
 * @param options - Configuration options
 * @returns Sanitized string
 */
export function sanitizeInput(
  input: string,
  options: {
    allowNewlines?: boolean;
    maxLength?: number;
    trimWhitespace?: boolean;
  } = {}
): string {
  if (typeof input !== 'string') {
    return '';
  }

  const { allowNewlines = false, maxLength = 10000, trimWhitespace = true } = options;

  let sanitized = input;

  // Trim whitespace if enabled
  if (trimWhitespace) {
    sanitized = sanitized.trim();
  }

  // Remove null bytes and other control characters
  // eslint-disable-next-line no-control-regex
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Handle newlines
  if (!allowNewlines) {
    sanitized = sanitized.replace(/[\r\n]/g, ' ');
  }

  // Enforce max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Validate email format.
 * Uses a comprehensive regex that handles most valid email formats.
 *
 * @param email - The email to validate
 * @returns true if valid email format
 */
export function validateEmail(email: string): boolean {
  if (typeof email !== 'string' || email.length > 254) {
    return false;
  }
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
}

/**
 * Validate URL safety.
 * Ensures URLs use safe protocols and don't contain javascript: or data: schemes.
 *
 * @param url - The URL to validate
 * @returns true if URL is safe
 */
export function validateUrl(url: string): boolean {
  if (typeof url !== 'string') {
    return false;
  }

  // Must start with http:// or https://
  const safeProtocolRegex = /^https?:\/\//i;
  if (!safeProtocolRegex.test(url)) {
    return false;
  }

  // Check for dangerous patterns
  const dangerousPatterns = [
    /javascript:/i,
    /data:/i,
    /vbscript:/i,
    /on\w+=/i, // onclick=, onerror=, etc.
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(url)) {
      return false;
    }
  }

  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate Firestore document ID format.
 * Firestore IDs must be valid UTF-8, 1-1500 bytes, no forward slashes.
 *
 * @param id - The ID to validate
 * @returns true if valid Firestore ID
 */
export function isValidFirestoreId(id: string): boolean {
  if (typeof id !== 'string') {
    return false;
  }

  // Must be 1-1500 bytes
  const byteLength = new Blob([id]).size;
  if (byteLength < 1 || byteLength > 1500) {
    return false;
  }

  // Cannot be '.' or '..'
  if (id === '.' || id === '..') {
    return false;
  }

  // Cannot contain forward slashes
  if (id.includes('/')) {
    return false;
  }

  // Cannot start with double underscore
  if (id.startsWith('__')) {
    return false;
  }

  return true;
}

/**
 * Client-side rate limiting helper.
 * Tracks action counts in session storage to prevent abuse.
 *
 * @param actionKey - Unique key for the action being rate limited
 * @param maxActions - Maximum number of actions allowed
 * @param windowMs - Time window in milliseconds
 * @returns true if action is allowed, false if rate limited
 */
export function rateLimitCheck(
  actionKey: string,
  maxActions: number = 10,
  windowMs: number = 60000
): boolean {
  const storageKey = `rate_limit_${actionKey}`;
  const now = Date.now();

  try {
    const stored = sessionStorage.getItem(storageKey);
    let data: { timestamps: number[] } = { timestamps: [] };

    if (stored) {
      data = JSON.parse(stored);
    }

    // Filter out old timestamps outside the window
    data.timestamps = data.timestamps.filter((ts) => now - ts < windowMs);

    // Check if over limit
    if (data.timestamps.length >= maxActions) {
      return false;
    }

    // Add current timestamp and save
    data.timestamps.push(now);
    sessionStorage.setItem(storageKey, JSON.stringify(data));

    return true;
  } catch {
    // If session storage fails, allow the action
    return true;
  }
}

/**
 * Validate phone number format.
 * Accepts various international formats.
 *
 * @param phone - The phone number to validate
 * @returns true if valid phone format
 */
export function validatePhone(phone: string): boolean {
  if (typeof phone !== 'string') {
    return false;
  }

  // Remove common formatting characters
  const cleaned = phone.replace(/[\s\-().]/g, '');

  // Must be 7-15 digits, optionally starting with +
  const phoneRegex = /^\+?[0-9]{7,15}$/;
  return phoneRegex.test(cleaned);
}

/**
 * Sanitize filename to prevent path traversal attacks.
 *
 * @param filename - The filename to sanitize
 * @returns Safe filename
 */
export function sanitizeFilename(filename: string): string {
  if (typeof filename !== 'string') {
    return 'unnamed';
  }

  // Remove path separators and dangerous characters
  let sanitized = filename
    .replace(/\.\./g, '') // Remove path traversal
    .replace(/[/\\:*?"<>|]/g, '') // Remove dangerous chars
    .replace(/^\.+/, ''); // Remove leading dots

  // Ensure we have a reasonable filename
  if (!sanitized || sanitized.length === 0) {
    sanitized = 'unnamed';
  }

  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.split('.').pop() || '';
    const name = sanitized.substring(0, 250 - ext.length);
    sanitized = ext ? `${name}.${ext}` : name;
  }

  return sanitized;
}

/**
 * Check if a string contains potential SQL injection patterns.
 * Note: This is a client-side helper only. Always use parameterized queries server-side.
 *
 * @param input - The input to check
 * @returns true if suspicious patterns detected
 */
export function hasSqlInjectionPatterns(input: string): boolean {
  if (typeof input !== 'string') {
    return false;
  }

  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|EXEC|EXECUTE)\b)/i,
    /('|")\s*(OR|AND)\s*('|")/i,
    /--\s*$/m,
    /;\s*(SELECT|INSERT|UPDATE|DELETE|DROP)/i,
    /UNION\s+SELECT/i,
  ];

  for (const pattern of sqlPatterns) {
    if (pattern.test(input)) {
      return true;
    }
  }

  return false;
}

/**
 * Generate a cryptographically secure random string.
 * Uses Web Crypto API for secure random generation.
 *
 * @param length - Length of the string to generate
 * @returns Random string
 */
export function generateSecureId(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .substring(0, length);
}
