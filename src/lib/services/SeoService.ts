import { SeoRepository } from '../repositories/SeoRepository';
import { SettingsRepository } from '../repositories/SettingsRepository';
import { Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import { Metadata } from 'next';
import { cache } from 'react';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export class SeoService {
  // --------------------------------------------------------------------------
  // Basic SEO Page CRUD
  // --------------------------------------------------------------------------

  static getHomepageSeo = cache(async () => {
    return SeoRepository.getByRoute('/');
  });

  static async updateHomepageSeo(data: Omit<Prisma.SeoPageCreateInput, 'routePath' | 'seoableType' | 'seoableId'>) {
    return SeoRepository.upsertByRoute('/', data);
  }

  static getEntitySeo = cache(async (seoableType: string, seoableId: string) => {
    return SeoRepository.getByEntity(seoableType, seoableId);
  });

  static async updateEntitySeo(
    seoableType: string,
    seoableId: string,
    data: Omit<Prisma.SeoPageCreateInput, 'seoableType' | 'seoableId'>
  ) {
    return SeoRepository.upsertByEntity(seoableType, seoableId, data);
  }

  // --------------------------------------------------------------------------
  // Global Settings
  // --------------------------------------------------------------------------

  static getGlobalSeoSettings = cache(async () => {
    const settings = await SettingsRepository.getGroup('seo');
    const map = settings.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {} as Record<string, string>);
    return {
      defaultTitle: map['seo.defaultTitle'] || 'Trailer Movie',
      defaultDescription: map['seo.defaultDescription'] || 'Watch the best movie trailers.',
      defaultKeywords: map['seo.defaultKeywords'] || 'movies, trailers',
      ogSiteName: map['seo.ogSiteName'] || 'Trailer Movie',
      twitterHandle: map['seo.twitterHandle'] || '@trailermovie',
      googleVerification: map['seo.googleVerification'] || '',
      bingVerification: map['seo.bingVerification'] || '',
      yandexVerification: map['seo.yandexVerification'] || '',
    };
  });

  static async updateGlobalSeoSettings(data: {
    defaultTitle: string;
    defaultDescription: string;
    defaultKeywords: string;
    ogSiteName: string;
    twitterHandle: string;
    googleVerification: string;
    bingVerification: string;
    yandexVerification: string;
  }) {
    const settings = Object.entries(data).map(([key, value]) => ({
      key: `seo.${key}`,
      value,
      group: 'seo',
    }));
    await SettingsRepository.upsertMany(settings);
    return data;
  }

  // --------------------------------------------------------------------------
  // Generators
  // --------------------------------------------------------------------------

  /**
   * Generate Next.js Metadata for any entity or route.
   */
  static async generateMetadata(
    seoableType: string,
    seoableId: string,
    fallback: { title?: string; description?: string; image?: string; path?: string } = {}
  ): Promise<Metadata> {
    const [globalSettings, pageSeo] = await Promise.all([
      this.getGlobalSeoSettings(),
      SeoRepository.findPageSEO(seoableType, seoableId)
    ]);

    const title = pageSeo?.metaTitle || fallback.title || globalSettings.defaultTitle;
    const description = pageSeo?.metaDescription || fallback.description || globalSettings.defaultDescription;
    const keywords = globalSettings.defaultKeywords;
    const ogImage = pageSeo?.ogImageUrl || fallback.image;
    
    // Canonical URL
    const canonical = pageSeo?.canonicalUrl || (fallback.path ? `${APP_URL}${fallback.path}` : APP_URL);

    return {
      title,
      description,
      keywords,
      alternates: {
        canonical,
      },
      robots: {
        index: pageSeo?.isNoindex ? false : true,
        follow: pageSeo?.isNoindex ? false : true,
      },
      openGraph: {
        title: title,
        description: description,
        url: canonical,
        siteName: globalSettings.ogSiteName,
        images: ogImage ? [{ url: ogImage }] : [],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: title,
        description: description,
        images: ogImage ? [ogImage] : [],
        creator: globalSettings.twitterHandle,
      },
      verification: {
        google: globalSettings.googleVerification,
        yandex: globalSettings.yandexVerification,
        other: {
          bing: globalSettings.bingVerification ? [globalSettings.bingVerification] : [],
        },
      },
    };
  }

  /**
   * Generate JSON-LD Structured Data
   */
  static generateStructuredData(type: 'WebSite' | 'Movie' | 'CollectionPage' | 'BreadcrumbList', data: any) {
    if (type === 'WebSite') {
      return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: data.name,
        url: APP_URL,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${APP_URL}/search?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      };
    }
    
    if (type === 'Movie') {
      const schema: any = {
        '@context': 'https://schema.org',
        '@type': 'Movie',
        name: data.title,
        description: data.description,
        image: data.image,
        dateCreated: data.releaseDate,
        director: data.directors?.map((d: any) => ({ '@type': 'Person', name: d.name })),
        actor: data.actors?.map((a: any) => ({ '@type': 'Person', name: a.name })),
        genre: data.genre?.name,
      };

      if (data.youtubeTrailerId) {
        schema.trailer = {
          '@type': 'VideoObject',
          name: `${data.title} Trailer`,
          description: data.description || `Trailer for ${data.title}`,
          thumbnailUrl: data.image || `https://img.youtube.com/vi/${data.youtubeTrailerId}/maxresdefault.jpg`,
          embedUrl: `https://www.youtube.com/embed/${data.youtubeTrailerId}`,
          uploadDate: data.releaseDate,
        };
      }

      return schema;
    }

    if (type === 'CollectionPage') {
      return {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: data.title,
        description: data.description,
        url: `${APP_URL}${data.path}`,
      };
    }

    if (type === 'BreadcrumbList') {
      return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: data.items.map((item: any, index: number) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: `${APP_URL}${item.path}`,
        })),
      };
    }
    
    return null;
  }

  /**
   * Generate Sitemap Data
   */
  static async generateSitemapData() {
    const [movies, genres, collections] = await Promise.all([
      prisma.movie.findMany({ where: { status: 'PUBLISHED' }, select: { slug: true, updatedAt: true }, take: 1000 }),
      prisma.genre.findMany({ select: { slug: true, updatedAt: true }, take: 100 }),
      prisma.collection.findMany({ where: { isActive: true }, select: { slug: true }, take: 100 }),
    ]);

    const sitemap = [
      { url: APP_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    ];

    movies.forEach(m => sitemap.push({ url: `${APP_URL}/movies/${m.slug}`, lastModified: m.updatedAt, changeFrequency: 'weekly', priority: 0.8 }));
    genres.forEach(g => sitemap.push({ url: `${APP_URL}/genres/${g.slug}`, lastModified: g.updatedAt, changeFrequency: 'weekly', priority: 0.6 }));
    collections.forEach(c => sitemap.push({ url: `${APP_URL}/collections/${c.slug}`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 }));

    return sitemap;
  }

  /**
   * Generate Robots.txt
   */
  static generateRobotsTxt() {
    return `User-agent: *
Allow: /

Sitemap: ${APP_URL}/sitemap.xml`;
  }

  /**
   * Generate RSS Feed XML
   */
  static async generateRssFeed() {
    const movies = await prisma.movie.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const items = movies.map(m => `
      <item>
        <title><![CDATA[${m.title}]]></title>
        <link>${APP_URL}/movies/${m.slug}</link>
        <guid>${APP_URL}/movies/${m.slug}</guid>
        <pubDate>${m.createdAt.toUTCString()}</pubDate>
        <description><![CDATA[${m.synopsis || ''}]]></description>
      </item>
    `).join('');

    return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>Trailer Movie</title>
    <link>${APP_URL}</link>
    <description>Latest Movies and Trailers</description>
    ${items}
  </channel>
</rss>`;
  }
}
