/**
 * Common input validation utilities for web application forms.
 */

/**
 * Validates whether a phone number matches standard 11-digit Philippine mobile format:
 * - Must be exactly 11 digits
 * - Must start with 09
 * - Must contain only digits (no letters or special characters)
 */
export function isValidPhilippineNumber(phone: string): boolean {
  if (!phone) return false;
  const trimmed = phone.trim();
  return /^09\d{9}$/.test(trimmed);
}

/**
 * Sanitizes phone number input:
 * - Removes any non-digit character (blocking letters, symbols, spaces)
 * - Limits length to maximum 11 digits
 */
export function cleanPhoneNumber(input: string): string {
  if (!input) return "";
  return input.replace(/\D/g, "").slice(0, 11);
}

/**
 * Validates email format.
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  const trimmed = email.trim();
  // Standard email regex
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

/**
 * Validates name fields (first name, last name):
 * - Must contain only letters, spaces, hyphens, and apostrophes
 * - No numbers or special characters allowed
 */
export function isValidName(name: string): boolean {
  if (!name) return false;
  const trimmed = name.trim();
  // Allow letters (including Unicode/international characters), spaces, hyphens, apostrophes, and periods
  return /^[a-zA-ZÀ-ÿ\s'\-\.]+$/.test(trimmed);
}

/**
 * Sanitizes name input:
 * - Removes any numbers and special characters (except spaces, hyphens, apostrophes, and periods)
 */
export function cleanName(input: string): string {
  if (!input) return "";
  // Keep only letters (including international), spaces, hyphens, apostrophes, and periods
  return input.replace(/[^a-zA-ZÀ-ÿ\s'\-\.]/g, "");
}
