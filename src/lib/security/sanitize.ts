const ALLOWED_RICH_TAGS = new Set(['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li']);
const SAFE_HREF_PATTERN = /^(?:https?:\/\/|mailto:|\/(?!\/)|#)/i;
const SAFE_TARGET_VALUES = new Set(['_blank', '_self', '_parent', '_top']);

function stripDangerousBlocks(value: string): string {
  return value
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|iframe|object|embed|svg|math)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<(script|style|iframe|object|embed|svg|math)\b[^>]*\/?>/gi, '');
}

/**
 * Sanitizes input strings to prevent XSS attacks by removing malicious HTML tags.
 * Pure zero-dependency implementation safe for both server and client runtimes
 * without pulling jsdom/whatwg-url into Next.js server chunks.
 */
export function sanitizeHtml(input: string | undefined | null): string {
  if (!input) return '';
  return stripDangerousBlocks(input)
    .replace(/<[^>]+>/g, '')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Allows basic formatting tags but strips dangerous ones (script, iframe, etc).
 * Use this for rich-text fields (like Movie synopsis or Genre descriptions).
 */
export function sanitizeRichText(input: string | undefined | null): string {
  if (!input) return '';
  const cleaned = stripDangerousBlocks(input);
  return cleaned.replace(/<\/?([a-zA-Z0-9]+)\b([^>]*)>/g, (fullMatch, rawTag: string, rawAttrs: string) => {
    const tag = rawTag.toLowerCase();
    if (!ALLOWED_RICH_TAGS.has(tag)) return '';
    if (fullMatch.startsWith('</')) return `</${tag}>`;
    if (tag === 'br') return '<br>';
    if (tag !== 'a') return `<${tag}>`;

    const safeAttrs: string[] = [];
    const attrRegex = /([a-zA-Z0-9:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;
    let match: RegExpExecArray | null;
    while ((match = attrRegex.exec(rawAttrs)) !== null) {
      const attrName = match[1].toLowerCase();
      const attrVal = (match[2] ?? match[3] ?? match[4] ?? '').trim();
      if (attrName === 'href' && SAFE_HREF_PATTERN.test(attrVal)) {
        safeAttrs.push(`href="${attrVal.replace(/"/g, '&quot;')}"`);
      } else if (attrName === 'target' && SAFE_TARGET_VALUES.has(attrVal)) {
        safeAttrs.push(`target="${attrVal}"`);
      } else if (attrName === 'rel') {
        const cleanRel = attrVal.replace(/[^a-zA-Z0-9\s-]/g, '').trim();
        if (cleanRel) safeAttrs.push(`rel="${cleanRel}"`);
      }
    }
    return safeAttrs.length > 0 ? `<a ${safeAttrs.join(' ')}>` : '<a>';
  });
}
