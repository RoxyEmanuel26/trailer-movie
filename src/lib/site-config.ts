const DEFAULT_PRODUCTION_URL = 'https://www.movieflix.site';
const DEVELOPMENT_URL = 'http://localhost:3000';
export const BRAND_NAME = 'MovieFlix' as const;

function normalizeSiteUrl(value: string) {
  return value.replace(/\/+$/, '');
}

export const siteConfig = {
  // The public identity is intentionally code-owned so an environment typo or
  // stale deployment setting cannot replace MovieFlix in metadata or schema.
  name: BRAND_NAME,
  get url() {
    const current = process.env.NEXT_PUBLIC_APP_URL?.trim();
    return normalizeSiteUrl(
      current || (process.env.NODE_ENV === 'production' ? DEFAULT_PRODUCTION_URL : DEVELOPMENT_URL)
    );
  },
  description:
    'Explore movies, trailers, cast, ratings, and where to watch—all in one thoughtfully organized MovieFlix guide.',
  get googleVerification() {
    return process.env.GOOGLE_SITE_VERIFICATION?.trim() || '';
  },
  get twitterHandle() {
    return process.env.NEXT_PUBLIC_TWITTER_HANDLE?.trim() || '';
  },
  get contactEmail() {
    return process.env.CONTACT_EMAIL?.trim() || '';
  },
  get indexingEnabled() {
    return process.env.NODE_ENV === 'production' && process.env.SEO_INDEXING_ENABLED === 'true';
  },
  get indexNowKey() {
    return process.env.INDEXNOW_KEY?.trim() || '';
  },
};

export function absoluteUrl(path = '/') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${siteConfig.url}${normalizedPath === '/' ? '' : normalizedPath}`;
}

export function canonicalUrl(candidate: string | null | undefined, fallbackPath = '/') {
  if (!candidate) return absoluteUrl(fallbackPath);

  try {
    const candidateUrl = new URL(candidate, siteConfig.url);
    const configuredSiteUrl = new URL(siteConfig.url);
    const invalidProtocol = configuredSiteUrl.protocol === 'https:' && candidateUrl.protocol !== 'https:';
    if (invalidProtocol || candidateUrl.host !== configuredSiteUrl.host || candidateUrl.username || candidateUrl.password) {
      return absoluteUrl(fallbackPath);
    }
    candidateUrl.hash = '';
    return candidateUrl.toString().replace(/\/$/, '');
  } catch {
    return absoluteUrl(fallbackPath);
  }
}

export function isValidContactEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function validateProductionSeoConfig(input: {
  url?: string;
  indexingEnabled: boolean;
  googleVerification?: string;
  contactEmail?: string;
  analyticsHmacSecret?: string;
  revalidationSecret?: string;
  betterAuthSecret?: string;
  betterAuthUrl?: string;
}) {
  if (!input.url) return 'NEXT_PUBLIC_APP_URL is required for a production build.';
  try {
    const url = new URL(input.url);
    if (url.protocol !== 'https:' || url.host !== 'www.movieflix.site' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
      return 'NEXT_PUBLIC_APP_URL must be https://www.movieflix.site in production.';
    }
  } catch {
    return 'NEXT_PUBLIC_APP_URL must be a valid public HTTPS URL in production.';
  }
  if (input.indexingEnabled && !input.googleVerification?.trim()) {
    return 'GOOGLE_SITE_VERIFICATION is required when SEO indexing is enabled.';
  }
  if (input.indexingEnabled && !isValidContactEmail(input.contactEmail || '')) {
    return 'CONTACT_EMAIL must be a valid email when SEO indexing is enabled.';
  }
  if (input.indexingEnabled && (input.analyticsHmacSecret?.length || 0) < 32) {
    return 'ANALYTICS_HMAC_SECRET must contain at least 32 characters when SEO indexing is enabled.';
  }
  if (input.indexingEnabled && (input.revalidationSecret?.length || 0) < 32) {
    return 'REVALIDATION_SECRET must contain at least 32 characters when SEO indexing is enabled.';
  }
  if (input.indexingEnabled && (input.betterAuthSecret?.length || 0) < 32) {
    return 'BETTER_AUTH_SECRET must contain at least 32 characters when SEO indexing is enabled.';
  }
  if (input.indexingEnabled && input.betterAuthUrl !== input.url) {
    return 'BETTER_AUTH_URL must match NEXT_PUBLIC_APP_URL when SEO indexing is enabled.';
  }
  return null;
}

export function assertProductionSiteConfig() {
  if (process.env.NODE_ENV !== 'production') return;
  if (!process.env.ORIGIN_GATE_SECRET || process.env.ORIGIN_GATE_SECRET.length < 32 || /replace/i.test(process.env.ORIGIN_GATE_SECRET)) {
    throw new Error('ORIGIN_GATE_SECRET must be a unique random value of at least 32 characters in production.');
  }
  const error = validateProductionSeoConfig({
    url: process.env.NEXT_PUBLIC_APP_URL?.trim(),
    indexingEnabled: process.env.SEO_INDEXING_ENABLED === 'true',
    googleVerification: process.env.GOOGLE_SITE_VERIFICATION,
    contactEmail: process.env.CONTACT_EMAIL?.trim() || '',
    analyticsHmacSecret: process.env.ANALYTICS_HMAC_SECRET,
    revalidationSecret: process.env.REVALIDATION_SECRET,
    betterAuthSecret: process.env.BETTER_AUTH_SECRET,
    betterAuthUrl: process.env.BETTER_AUTH_URL,
  });
  if (error) throw new Error(error);
}

export function normalizeMetaDescription(value: string | null | undefined, fallback: string) {
  const normalized = (value || fallback).replace(/\s+/g, ' ').trim();
  if (normalized.length <= 160) return normalized;
  return `${normalized.slice(0, 157).trimEnd()}...`;
}
