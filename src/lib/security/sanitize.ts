const ALLOWED_RICH_TAGS = new Set(['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li']);
const SAFE_HREF_PATTERN = /^(?:https?:\/\/|mailto:|\/(?![\/\\])|#)/i;
const SAFE_TARGET_VALUES = new Set(['_blank', '_self', '_parent', '_top']);
const MAX_SANITIZE_PASSES = 20;

function stripDangerousBlocks(value: string): string {
  let prev = value;
  for (let i = 0; i < MAX_SANITIZE_PASSES; i++) {
    const next = prev
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<(script|style|iframe|object|embed|svg|math)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
      .replace(/<(script|style|iframe|object|embed|svg|math)\b[^>]*\/?>/gi, '');
    if (next === prev) return next;
    prev = next;
  }
  return prev.replace(/</g, '&lt;');
}

/**
 * Sanitizes input strings to prevent XSS attacks by removing malicious HTML tags.
 * Pure zero-dependency implementation safe for both server and client runtimes
 * without pulling jsdom/whatwg-url into Next.js server chunks.
 */
export function sanitizeHtml(input: string | undefined | null): string {
  if (!input) return '';
  let cleaned = stripDangerousBlocks(input);
  let prev = '';
  for (let i = 0; i < MAX_SANITIZE_PASSES && cleaned !== prev; i++) {
    prev = cleaned;
    cleaned = cleaned.replace(/<[^>]+>/g, '');
  }
  return cleaned.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Allows basic formatting tags but strips dangerous ones (script, iframe, etc).
 * Use this for rich-text fields (like Movie synopsis or Genre descriptions).
 */
export function sanitizeRichText(input: string | undefined | null): string {
  if (!input) return '';
  const sanitizePass = (value: string) =>
    stripDangerousBlocks(value).replace(/<\/?([a-zA-Z0-9]+)\b([^>]*)>/g, (fullMatch, rawTag: string, rawAttrs: string) => {
      const tag = rawTag.toLowerCase();
      if (!ALLOWED_RICH_TAGS.has(tag)) return '';
      if (fullMatch.startsWith('</')) return `</${tag}>`;
      if (tag === 'br') return '<br>';
      if (tag !== 'a') return `<${tag}>`;

      let safeHref: string | null = null;
      let safeTarget: string | null = null;
      let safeRelTokens: string[] = [];

      const attrRegex = /([a-zA-Z0-9:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;
      let match: RegExpExecArray | null;
      while ((match = attrRegex.exec(rawAttrs)) !== null) {
        const attrName = match[1].toLowerCase();
        const attrVal = (match[2] ?? match[3] ?? match[4] ?? '').trim();
        if (attrName === 'href' && safeHref === null && SAFE_HREF_PATTERN.test(attrVal)) {
          safeHref = attrVal.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        } else if (attrName === 'target' && safeTarget === null && SAFE_TARGET_VALUES.has(attrVal)) {
          safeTarget = attrVal;
        } else if (attrName === 'rel' && safeRelTokens.length === 0) {
          safeRelTokens = attrVal
            .replace(/[^a-zA-Z0-9\s-]/g, '')
            .split(/\s+/)
            .map((token) => token.trim().toLowerCase())
            .filter(Boolean);
        }
      }

      if (safeTarget === '_blank') {
        const relSet = new Set(safeRelTokens);
        relSet.add('noopener');
        relSet.add('noreferrer');
        safeRelTokens = Array.from(relSet);
      }

      const safeAttrs: string[] = [];
      if (safeHref !== null) safeAttrs.push(`href="${safeHref}"`);
      if (safeTarget !== null) safeAttrs.push(`target="${safeTarget}"`);
      if (safeRelTokens.length > 0) safeAttrs.push(`rel="${safeRelTokens.join(' ')}"`);
      return safeAttrs.length > 0 ? `<a ${safeAttrs.join(' ')}>` : '<a>';
    });

  let current = sanitizePass(input);
  let converged = false;
  for (let i = 0; i < MAX_SANITIZE_PASSES; i++) {
    const next = sanitizePass(current);
    if (next === current) {
      converged = true;
      break;
    }
    current = next;
  }

  if (!converged) {
    return current.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Neutralize any remaining malformed/unclosed tags (e.g. `<img src=x onerror=1` or injected attrs)
  return current.replace(
    /<(?!\/?(?:b|i|em|strong|p|br|ul|ol|li)>|\/a>|a(?:\s+(?:href="[^"<>]*"|target="(?:_blank|_self|_parent|_top)"|rel="[a-z0-9\s-]+"))*>)/gi,
    '&lt;',
  );
}
