/**
 * Security Audit Logging Service
 *
 * Provides bank-grade audit logging for security-sensitive operations.
 * Logs are stored in a separate Firestore collection for compliance and incident tracking.
 *
 * Features:
 * - Immutable audit trail (append-only by Firestore rules)
 * - Structured security event types
 * - Automatic metadata capture (timestamp, user agent)
 * - Non-blocking logging (doesn't affect app performance)
 */

import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { db, auth } from '@lib/firebase';

/**
 * Security event types for audit logging
 */
export type SecurityEventType =
  | 'login_success'
  | 'login_failure'
  | 'logout'
  | 'session_expired'
  | 'password_reset_request'
  | 'profile_update'
  | 'role_change'
  | 'admin_action'
  | 'data_access'
  | 'data_export'
  | 'form_submission'
  | 'file_upload'
  | 'file_delete'
  | 'suspicious_activity'
  | 'rate_limit_exceeded';

/**
 * Severity levels for audit events
 */
export type AuditSeverity = 'info' | 'warning' | 'critical';

/**
 * Audit log entry structure
 */
export interface AuditLogEntry {
  eventType: SecurityEventType;
  severity: AuditSeverity;
  userId: string;
  userEmail?: string;
  action: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp?: firebase.firestore.Timestamp;
  success: boolean;
  errorMessage?: string;
}

/**
 * Get client metadata for audit logs
 */
function getClientMetadata(): { userAgent: string } {
  return {
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
  };
}

/**
 * Log a security audit event.
 * This is a non-blocking operation that won't affect app performance.
 *
 * @param entry - Audit log entry details
 */
export async function logSecurityEvent(
  entry: Omit<AuditLogEntry, 'timestamp' | 'userAgent'>
): Promise<void> {
  try {
    const metadata = getClientMetadata();
    const currentUser = auth.currentUser;

    const auditEntry: AuditLogEntry = {
      ...entry,
      userId: entry.userId || currentUser?.uid || 'anonymous',
      userEmail: entry.userEmail || currentUser?.email || undefined,
      userAgent: metadata.userAgent,
      timestamp:
        firebase.firestore.FieldValue.serverTimestamp() as unknown as firebase.firestore.Timestamp,
    };

    // Log to audit collection (non-blocking)
    await db.collection('auditLogs').add(auditEntry);
  } catch (error) {
    // Log locally but don't throw - audit logging should never break the app
    console.error('Failed to log security event:', error);

    // Fallback: log to console for debugging
    if (import.meta.env.DEV) {
      console.warn('[AUDIT]', entry.eventType, entry.action, entry.details);
    }
  }
}

// ============================================
// Convenience functions for common events
// ============================================

/**
 * Log a successful login
 */
export function logLoginSuccess(userId: string, email?: string): void {
  logSecurityEvent({
    eventType: 'login_success',
    severity: 'info',
    userId,
    userEmail: email,
    action: 'User logged in successfully',
    success: true,
  }).catch(console.error);
}

/**
 * Log a failed login attempt
 */
export function logLoginFailure(email: string, reason: string): void {
  logSecurityEvent({
    eventType: 'login_failure',
    severity: 'warning',
    userId: 'unknown',
    userEmail: email,
    action: 'Login attempt failed',
    details: { reason },
    success: false,
    errorMessage: reason,
  }).catch(console.error);
}

/**
 * Log a logout event
 */
export function logLogout(userId: string, reason: 'manual' | 'session_expired' | 'idle'): void {
  logSecurityEvent({
    eventType: reason === 'manual' ? 'logout' : 'session_expired',
    severity: 'info',
    userId,
    action: `User logged out: ${reason}`,
    details: { reason },
    success: true,
  }).catch(console.error);
}

/**
 * Log a profile update
 */
export function logProfileUpdate(userId: string, updatedFields: string[]): void {
  logSecurityEvent({
    eventType: 'profile_update',
    severity: 'info',
    userId,
    action: 'Profile information updated',
    details: { updatedFields },
    success: true,
  }).catch(console.error);
}

/**
 * Log an admin action
 */
export function logAdminAction(
  userId: string,
  action: string,
  targetResource: string,
  details?: Record<string, unknown>
): void {
  logSecurityEvent({
    eventType: 'admin_action',
    severity: 'warning',
    userId,
    action: action,
    details: { targetResource, ...details },
    success: true,
  }).catch(console.error);
}

/**
 * Log a file upload
 */
export function logFileUpload(
  userId: string,
  fileName: string,
  fileType: string,
  fileSize: number
): void {
  logSecurityEvent({
    eventType: 'file_upload',
    severity: 'info',
    userId,
    action: 'File uploaded',
    details: { fileName, fileType, fileSizeBytes: fileSize },
    success: true,
  }).catch(console.error);
}

/**
 * Log suspicious activity
 */
export function logSuspiciousActivity(
  userId: string,
  description: string,
  details?: Record<string, unknown>
): void {
  logSecurityEvent({
    eventType: 'suspicious_activity',
    severity: 'critical',
    userId,
    action: description,
    details,
    success: false,
  }).catch(console.error);
}

/**
 * Log rate limit exceeded
 */
export function logRateLimitExceeded(userId: string, actionType: string): void {
  logSecurityEvent({
    eventType: 'rate_limit_exceeded',
    severity: 'warning',
    userId,
    action: `Rate limit exceeded for: ${actionType}`,
    details: { actionType },
    success: false,
  }).catch(console.error);
}
