import { AppError } from '../errors';

const ALLOWED_DOMAINS = [
  'api.themoviedb.org',
  'image.tmdb.org',
  'youtube.com',
  'www.youtube.com',
  'googleapis.com',
  'youtube.googleapis.com',
];

interface HardenedFetchOptions extends RequestInit {
  timeoutMs?: number;
}

/**
 * A hardened wrapper around the native fetch API designed to prevent Server-Side Request Forgery (SSRF)
 * by strictly validating requested URLs against a domain allowlist, enforcing timeouts, and dropping protocol-less URLs.
 */
export async function secureFetch(url: string, options: HardenedFetchOptions = {}): Promise<Response> {
  const { timeoutMs = 5000, ...fetchOptions } = options;

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch (error) {
    throw new AppError(`Invalid URL provided to secureFetch: ${url}`, 400);
  }

  // 1. Enforce Protocol
  if (parsedUrl.protocol !== 'https:') {
    throw new AppError(`SSRF Blocked: Only HTTPS is allowed. Received ${parsedUrl.protocol}`, 403);
  }

  // 2. Enforce Domain Allowlist
  if (!ALLOWED_DOMAINS.includes(parsedUrl.hostname)) {
    throw new AppError(`SSRF Blocked: Domain ${parsedUrl.hostname} is not in the allowlist.`, 403);
  }

  // 3. Enforce Timeout
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(parsedUrl.toString(), {
      ...fetchOptions,
      signal: controller.signal,
    });
    
    // 4. (Optional) Could inspect Content-Type or Content-Length here to prevent massive downloads
    // const contentLength = response.headers.get('content-length');
    // if (contentLength && parseInt(contentLength, 10) > 10 * 1024 * 1024) throw error;
    
    return response;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new AppError(`Request to ${parsedUrl.hostname} timed out after ${timeoutMs}ms.`, 504);
    }
    throw error;
  } finally {
    clearTimeout(id);
  }
}
