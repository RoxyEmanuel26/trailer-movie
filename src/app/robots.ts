import { MetadataRoute } from 'next';
import { SeoService } from '@/lib/services/SeoService';
import { absoluteUrl, siteConfig } from '@/lib/site-config';

export default function robots(): MetadataRoute.Robots {
  if (!siteConfig.indexingEnabled) {
    return {
      rules: { userAgent: '*', disallow: '/' },
      sitemap: absoluteUrl('/sitemap.xml'),
    };
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/login', '/monitoring', '/person-not-found'],
    },
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
