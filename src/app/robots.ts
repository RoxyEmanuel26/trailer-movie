import { MetadataRoute } from 'next';
import { SeoService } from '@/lib/services/SeoService';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export default function robots(): MetadataRoute.Robots {
  // Although we generate string inside SeoService, Next.js robots.ts expects a configuration object
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
