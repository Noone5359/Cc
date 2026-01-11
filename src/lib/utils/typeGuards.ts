/**
 * Type guard utilities for better type safety
 */

import { User } from '@/types';

/**
 * Check if a value is defined (not null or undefined)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Check if a user object has all required fields
 */
export function isValidUser(user: Partial<User> | null | undefined): user is User {
  if (!user) return false;

  return !!(user.id && user.name && user.admissionNumber && user.email);
}

/**
 * Get a safe value or return default
 */
export function getSafeValue<T>(value: T | null | undefined, defaultValue: T): T {
  return isDefined(value) ? value : defaultValue;
}

/**
 * Check if a string is not empty
 */
export function isNonEmptyString(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Check if an array is not empty
 */
export function isNonEmptyArray<T>(value: T[] | null | undefined): value is T[] {
  return Array.isArray(value) && value.length > 0;
}
