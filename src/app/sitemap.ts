import { MetadataRoute } from 'next';
import { SeoService } from '@/lib/services/SeoService';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const data = await SeoService.generateSitemapData();
  
  return data.map((item) => ({
    url: item.url,
    lastModified: item.lastModified,
    changeFrequency: item.changeFrequency as "weekly" | "daily" | "always" | "hourly" | "monthly" | "yearly" | "never" | undefined,
    priority: item.priority,
  }));
}
