import { SeoRepository } from '../repositories/SeoRepository';
import { SettingsRepository } from '../repositories/SettingsRepository';
import { Prisma } from '@prisma/client';
import { Metadata } from 'next';
import { cache } from 'react';
import { MovieRepository } from '../repositories/MovieRepository';
import { PersonRepository } from '../repositories/PersonRepository';
import { ORIGIN_CATALOG, POPULAR_CATALOG } from '../public-catalog';
import { personPath } from '../public-routes';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
export const PERSON_SITEMAP_PAGE_SIZE = 45_000;

export class SeoService {
  // --------------------------------------------------------------------------
  // Basic SEO Page CRUD
  // --------------------------------------------------------------------------

  static getHomepageSeo = cache(async () => {
    return SeoRepository.getByRoute('/');
  });

  static async updateHomepageSeo(
    data: Omit<Prisma.SeoPageCreateInput, 'routePath' | 'seoableType' | 'seoableId'>
  ) {
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
    const map = settings.reduce(
      (acc, curr) => ({ ...acc, [curr.key]: curr.value }),
      {} as Record<string, string>
    );
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
    fallback: {
      title?: string;
      description?: string;
      image?: string;
      path?: string;
      indexable?: boolean;
      openGraphType?: 'website' | 'profile';
    } = {}
  ): Promise<Metadata> {
    const [globalSettings, pageSeo] = await Promise.all([
      this.getGlobalSeoSettings(),
      SeoRepository.findPageSEO(seoableType, seoableId),
    ]);

    const title = pageSeo?.metaTitle || fallback.title || globalSettings.defaultTitle;
    const description =
      pageSeo?.metaDescription || fallback.description || globalSettings.defaultDescription;
    const keywords = globalSettings.defaultKeywords;
    const ogImage = pageSeo?.ogImageUrl || fallback.image;

    // Canonical URL
    const canonical =
      pageSeo?.canonicalUrl || (fallback.path ? `${APP_URL}${fallback.path}` : APP_URL);

    const isNoindex = pageSeo?.isNoindex === true || fallback.indexable === false;

    return {
      title,
      description,
      keywords,
      alternates: {
        canonical,
      },
      robots: {
        index: !isNoindex,
        follow: !isNoindex,
      },
      openGraph: {
        title: title,
        description: description,
        url: canonical,
        siteName: globalSettings.ogSiteName,
        images: ogImage ? [{ url: ogImage }] : [],
        type: fallback.openGraphType || 'website',
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
  static generateStructuredData(
    type: 'WebSite' | 'Movie' | 'Person' | 'CollectionPage' | 'BreadcrumbList',
    data: any
  ) {
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
        '@id': `${APP_URL}${data.path}`,
        name: data.title,
        description: data.description,
        image: data.image,
        dateCreated: data.releaseDate,
        director: data.directors?.map((director: any) => ({
          '@type': 'Person',
          name: director.name,
          ...(director.path ? { url: `${APP_URL}${director.path}` } : {}),
        })),
        actor: data.actors?.map((actor: any) => ({
          '@type': 'Person',
          name: actor.name,
          ...(actor.path ? { url: `${APP_URL}${actor.path}` } : {}),
        })),
        genre: data.genre?.name,
      };

      if (data.youtubeTrailerId) {
        schema.trailer = {
          '@type': 'VideoObject',
          name: `${data.title} Trailer`,
          description: data.description || `Trailer for ${data.title}`,
          thumbnailUrl:
            data.image || `https://img.youtube.com/vi/${data.youtubeTrailerId}/maxresdefault.jpg`,
          embedUrl: `https://www.youtube.com/embed/${data.youtubeTrailerId}`,
          uploadDate: data.releaseDate,
        };
      }

      if (data.voteAverage && data.voteCount && data.voteCount > 0) {
        schema.aggregateRating = {
          '@type': 'AggregateRating',
          ratingValue: data.voteAverage.toFixed(1),
          ratingCount: data.voteCount,
          bestRating: '10',
          worstRating: '1',
        };
      }

      return schema;
    }

    if (type === 'Person') {
      return {
        '@context': 'https://schema.org',
        '@type': 'Person',
        '@id': `${APP_URL}${data.path}#person`,
        url: `${APP_URL}${data.path}`,
        mainEntityOfPage: `${APP_URL}${data.path}`,
        name: data.name,
        description: data.description || undefined,
        image: data.image || undefined,
        gender: data.gender || undefined,
        birthDate: data.birthDate || undefined,
        deathDate: data.deathDate || undefined,
        birthPlace: data.birthPlace || undefined,
        jobTitle: data.jobTitle || undefined,
        sameAs: data.sameAs?.length ? data.sameAs : undefined,
      };
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
    const [{ movies, genres, collections }, years] = await Promise.all([
      SeoRepository.getSitemapData(),
      MovieRepository.listPublishedReleaseYears(),
    ]);

    const sitemap = [
      { url: APP_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
      {
        url: `${APP_URL}/genres`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      },
    ];

    movies.forEach((m) =>
      sitemap.push({
        url: `${APP_URL}/watch/${m.slug}`,
        lastModified: m.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.8,
      })
    );
    genres.forEach((g) =>
      sitemap.push({
        url: `${APP_URL}/genre/${g.slug}`,
        lastModified: g.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.6,
      })
    );
    collections.forEach((c) =>
      sitemap.push({
        url: `${APP_URL}/collection/${c.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      })
    );
    POPULAR_CATALOG.forEach((item) =>
      sitemap.push({
        url: `${APP_URL}/popular/${item.slug}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.7,
      })
    );
    ORIGIN_CATALOG.forEach((item) =>
      sitemap.push({
        url: `${APP_URL}/origin/${item.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.6,
      })
    );
    years.forEach((year) =>
      sitemap.push({
        url: `${APP_URL}/year/${year}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.6,
      })
    );

    return sitemap;
  }

  static async getPersonSitemapPageCount() {
    const total = await PersonRepository.countIndexableForSitemap();
    return Math.ceil(total / PERSON_SITEMAP_PAGE_SIZE);
  }

  static async generatePersonSitemapData(page: number) {
    if (!Number.isSafeInteger(page) || page < 0) return [];

    const people = await PersonRepository.listIndexableForSitemap({
      skip: page * PERSON_SITEMAP_PAGE_SIZE,
      take: PERSON_SITEMAP_PAGE_SIZE,
    });

    return people.map((person) => ({
      url: `${APP_URL}${personPath(person.slug)}`,
      lastModified: person.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));
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
    const movies = await SeoRepository.getRssFeedData();

    const items = movies
      .map(
        (m) => `
      <item>
        <title><![CDATA[${m.title}]]></title>
        <link>${APP_URL}/watch/${m.slug}</link>
        <guid>${APP_URL}/watch/${m.slug}</guid>
        <pubDate>${m.createdAt.toUTCString()}</pubDate>
        <description><![CDATA[${m.synopsis || ''}]]></description>
      </item>
    `
      )
      .join('');

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
