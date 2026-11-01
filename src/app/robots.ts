import { MetadataRoute } from 'next';
import { absoluteUrl, siteConfig } from '@/lib/site-config';

export const dynamic = 'force-dynamic';

const DISALLOWED_PATHS = [
  '/admin/',
  '/api/',
  '/login',
  '/monitoring',
  '/person-not-found',
  '/search',
];

export const AI_SEARCH_CRAWLERS = [
  'Googlebot',
  'Google-InspectionTool',
  'Google-Extended',
  'Bingbot',
  'Applebot',
  'Applebot-Extended',
  'OAI-SearchBot',
  'ChatGPT-User',
  'GPTBot',
  'PerplexityBot',
  'ClaudeBot',
  'Claude-SearchBot',
  'DuckAssistBot',
];

export const BLOCKED_SCRAPER_BOTS = ['CCBot', 'Bytespider'];

export default function robots(): MetadataRoute.Robots {
  if (!siteConfig.indexingEnabled) {
    return {
      rules: { userAgent: '*', disallow: '/' },
      sitemap: absoluteUrl('/sitemap.xml'),
    };
  }

  return {
    rules: [
      {
        userAgent: AI_SEARCH_CRAWLERS,
        allow: '/',
        disallow: DISALLOWED_PATHS,
      },
      {
        userAgent: BLOCKED_SCRAPER_BOTS,
        disallow: '/',
      },
      {
        userAgent: '*',
        allow: '/',
        disallow: DISALLOWED_PATHS,
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
