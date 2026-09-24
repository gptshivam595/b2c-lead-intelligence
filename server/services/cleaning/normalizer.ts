/**
 * AI Lead Intelligence — Deterministic Data Normalizer
 * Pure TypeScript logic for string, phone, email, and value sanitization.
 */

import { sanitizeFormulaString } from '../ingestion/schemaDetector.ts';

/**
 * Clean whitespace and collapse consecutive spaces.
 */
export function normalizeWhitespace(str: string | null | undefined): string {
  if (!str) return '';
  return str.replace(/\s+/g, ' ').trim();
}

/**
 * Proper title-casing for personal and place names.
 */
export function normalizeName(nameStr: string | null | undefined): string {
  const clean = normalizeWhitespace(nameStr);
  if (!clean) return '';

  return clean
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Common typo domain correction mapping
 */
const EMAIL_TYPO_DOMAINS: Record<string, string> = {
  'gmial.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'hotmial.com': 'hotmail.com',
  'outlok.com': 'outlook.com',
};

/**
 * Normalize and validate email address according to RFC-5322 syntax.
 */
export function normalizeEmail(emailStr: string | null | undefined): {
  normalized: string | null;
  isValid: boolean;
  correctionApplied: boolean;
} {
  const clean = normalizeWhitespace(emailStr).toLowerCase();
  if (!clean) {
    return { normalized: null, isValid: false, correctionApplied: false };
  }

  let corrected = clean;
  let correctionApplied = false;

  const atIndex = clean.lastIndexOf('@');
  if (atIndex > 0 && atIndex < clean.length - 1) {
    const domain = clean.substring(atIndex + 1);
    if (EMAIL_TYPO_DOMAINS[domain]) {
      corrected = `${clean.substring(0, atIndex)}@${EMAIL_TYPO_DOMAINS[domain]}`;
      correctionApplied = true;
    }
  }

  // RFC-5322 compatible regex
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const isValid = emailRegex.test(corrected);

  return {
    normalized: corrected,
    isValid,
    correctionApplied,
  };
}

/**
 * Normalize phone numbers to standardized E.164 or cleaned digit strings.
 * Detects repeating dummy digits (e.g. 9999999999, 0000000000) or invalid lengths.
 */
export function normalizePhone(phoneStr: string | null | undefined, _countryHint?: string): {
  normalized: string | null;
  isValid: boolean;
  isSuspicious: boolean;
  digitsOnly: string;
} {
  const raw = normalizeWhitespace(phoneStr);
  if (!raw) {
    return { normalized: null, isValid: false, isSuspicious: false, digitsOnly: '' };
  }

  // Strip all non-digit characters except leading plus
  let hasLeadingPlus = raw.startsWith('+');
  const digits = raw.replace(/\D/g, '');

  if (!digits) {
    return { normalized: null, isValid: false, isSuspicious: true, digitsOnly: '' };
  }

  // Check for suspicious repeating patterns (e.g., 9999999999, 0000000000, 1234567890)
  const isAllSameDigit = /^(\d)\1+$/.test(digits);
  const isTrivialSequence = digits === '1234567890' || digits === '0123456789';
  const isSuspicious = isAllSameDigit || isTrivialSequence || digits.length < 7 || digits.length > 15;

  let formatted = '';
  // If 10 digits without country code, assume +91 or format as +[country]
  if (digits.length === 10) {
    formatted = `+91${digits}`;
  } else if (digits.length === 12 && digits.startsWith('91')) {
    formatted = `+${digits}`;
  } else if (hasLeadingPlus) {
    formatted = `+${digits}`;
  } else {
    formatted = digits;
  }

  const isValid = !isSuspicious && digits.length >= 8 && digits.length <= 15;

  return {
    normalized: formatted,
    isValid,
    isSuspicious,
    digitsOnly: digits,
  };
}
