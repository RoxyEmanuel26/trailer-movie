import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitizes input strings to prevent XSS attacks by removing malicious HTML tags.
 * Uses DOMPurify which is safe for both server and client environments.
 */
export function sanitizeHtml(input: string | undefined | null): string {
  if (!input) return '';
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // Strip ALL HTML tags by default for strict text fields
    ALLOWED_ATTR: [],
  });
}

/**
 * Allows basic formatting tags but strips dangerous ones (script, iframe, etc).
 * Use this for rich-text fields (like Movie synopsis or Genre descriptions).
 */
export function sanitizeRichText(input: string | undefined | null): string {
  if (!input) return '';
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
}
