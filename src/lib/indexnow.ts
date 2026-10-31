import { absoluteUrl, siteConfig } from './site-config';

const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
const MAX_URLS_PER_BATCH = 10_000;

export interface IndexNowPayload {
  host: string;
  key: string;
  keyLocation: string;
  urlList: string[];
}

export function isValidIndexNowKey(key: string | null | undefined): key is string {
  return Boolean(key && /^[a-zA-Z0-9-]{8,128}$/.test(key));
}

export function buildIndexNowPayload(
  pathsOrUrls: string[],
  options: { siteUrl?: string; key?: string; indexingEnabled?: boolean } = {}
): IndexNowPayload | null {
  if (options.indexingEnabled === false) return null;
  const key = (options.key ?? siteConfig.indexNowKey)?.trim();
  if (!isValidIndexNowKey(key)) return null;

  const base = (options.siteUrl ?? siteConfig.url).replace(/\/+$/, '');
  let parsedBase: URL;
  try {
    parsedBase = new URL(base);
  } catch {
    return null;
  }

  const seen = new Set<string>();
  const urlList: string[] = [];
  for (const raw of pathsOrUrls) {
    if (!raw) continue;
    const fullUrl = raw.startsWith('http://') || raw.startsWith('https://')
      ? raw
      : `${base}${raw.startsWith('/') ? raw : `/${raw}`}`;
    try {
      const candidate = new URL(fullUrl);
      if (candidate.host !== parsedBase.host) continue;
      const normalized = candidate.toString();
      if (!seen.has(normalized)) {
        seen.add(normalized);
        urlList.push(normalized);
        if (urlList.length >= MAX_URLS_PER_BATCH) break;
      }
    } catch {
      continue;
    }
  }

  if (urlList.length === 0) return null;

  return {
    host: parsedBase.host,
    key,
    keyLocation: `${base}/indexnow-key.txt`,
    urlList,
  };
}

/**
 * Submits newly published or updated canonical URLs to IndexNow
 * (powering Bing, ChatGPT Search, Microsoft Copilot, DuckDuckGo, and Yandex).
 * Safe no-op when SEO indexing is disabled or INDEXNOW_KEY is not configured.
 */
export async function submitIndexNowUrls(pathsOrUrls: string[]): Promise<{ submitted: number; ok: boolean }> {
  if (!siteConfig.indexingEnabled) {
    return { submitted: 0, ok: false };
  }
  const payload = buildIndexNowPayload(pathsOrUrls, {
    siteUrl: siteConfig.url,
    key: siteConfig.indexNowKey,
  });
  if (!payload) return { submitted: 0, ok: false };

  try {
    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    });
    return {
      submitted: payload.urlList.length,
      ok: response.ok || response.status === 202,
    };
  } catch {
    return { submitted: 0, ok: false };
  }
}

export function coreIndexNowPaths() {
  return [
    absoluteUrl('/'),
    absoluteUrl('/movies'),
    absoluteUrl('/popular'),
    absoluteUrl('/streaming'),
    absoluteUrl('/sitemap.xml'),
  ];
}
