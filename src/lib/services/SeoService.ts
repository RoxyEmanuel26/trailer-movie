import { SeoRepository } from '../repositories/SeoRepository';
import { SettingsRepository } from '../repositories/SettingsRepository';
import { Prisma } from '@prisma/client';
import { Metadata } from 'next';
import { cache } from 'react';
import { MovieRepository } from '../repositories/MovieRepository';
import { PersonRepository } from '../repositories/PersonRepository';
import { ORIGIN_CATALOG, POPULAR_CATALOG } from '../public-catalog';
import { STREAMING_CATALOG } from '../streaming-catalog';
import { moviePath, personPath } from '../public-routes';
import { absoluteUrl, isValidContactEmail, normalizeMetaDescription, siteConfig } from '../site-config';
import type { SitemapEntry } from '../sitemap-xml';
import { getTmdbImageUrl } from '../tmdb-image-loader';
import { catalogMetadataCanonical, paginatedMetadataTitle, socialImage } from '../seo-metadata';
import { trailerSchema } from '../trailer-schema';
import { clearAllPublicMemoryCaches, createMemoryCache } from '../memory-cache';

export const PERSON_SITEMAP_PAGE_SIZE = 45_000;
// Movie entries include image/video metadata; leave headroom below Google's
// 50 MB uncompressed limit instead of targeting only the URL-count limit.
export const MOVIE_SITEMAP_PAGE_SIZE = 10_000;

export function escapeCdata(value: string) {
  return value.replace(/]]>/g, ']]]]><![CDATA[>');
}

function normalizeLegacyBrand(value: string) {
  return value.replace(/TrailerTube|Trailer Movie|Trailer CMS|TrailerMovie/gi, siteConfig.name);
}

const globalSeoSettingsCache = createMemoryCache<{
  defaultTitle: string;
  defaultDescription: string;
  defaultKeywords: string;
  ogSiteName: string;
  twitterHandle: string;
  googleVerification: string;
  bingVerification: string;
  yandexVerification: string;
}>({
  maxEntries: 2,
  ttlMs: 10 * 60_000,
});

const pageSeoCache = createMemoryCache<Awaited<ReturnType<typeof SeoRepository.findPageSEO>>>({
  maxEntries: 3000,
  ttlMs: 10 * 60_000,
});

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
    const result = await SeoRepository.upsertByRoute('/', data);
    clearAllPublicMemoryCaches();
    return result;
  }

  static getEntitySeo = cache(async (seoableType: string, seoableId: string) => {
    return SeoRepository.getByEntity(seoableType, seoableId);
  });

  static async updateEntitySeo(
    seoableType: string,
    seoableId: string,
    data: Omit<Prisma.SeoPageCreateInput, 'seoableType' | 'seoableId'>
  ) {
    const result = await SeoRepository.upsertByEntity(seoableType, seoableId, data);
    clearAllPublicMemoryCaches();
    return result;
  }

  // --------------------------------------------------------------------------
  // Global Settings
  // --------------------------------------------------------------------------

  static getGlobalSeoSettings = cache(async () =>
    globalSeoSettingsCache.getOrLoad('global-seo-settings', async () => {
      const settings = await SettingsRepository.getGroup('seo');
      const map = settings.reduce(
        (acc, curr) => ({ ...acc, [curr.key]: curr.value }),
        {} as Record<string, string>
      );
      return {
        defaultTitle: normalizeLegacyBrand(map['seo.defaultTitle'] || siteConfig.name),
        defaultDescription: normalizeLegacyBrand(map['seo.defaultDescription'] || siteConfig.description),
        defaultKeywords: map['seo.defaultKeywords'] || 'movies, trailers',
        ogSiteName: siteConfig.name,
        twitterHandle: siteConfig.twitterHandle,
        googleVerification: siteConfig.googleVerification,
        bingVerification: map['seo.bingVerification'] || '',
        yandexVerification: map['seo.yandexVerification'] || '',
      };
    })
  );

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
    const environmentOwned = new Set(['ogSiteName', 'twitterHandle', 'googleVerification']);
    const settings = Object.entries(data).filter(([key]) => !environmentOwned.has(key)).map(([key, value]) => ({
      key: `seo.${key}`,
      value,
      group: 'seo',
    }));
    await SettingsRepository.upsertMany(settings);
    clearAllPublicMemoryCaches();
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
      pageSeoCache.getOrLoad(`${seoableType}:${seoableId}`, () =>
        SeoRepository.findPageSEO(seoableType, seoableId)
      ),
    ]);

    const title = paginatedMetadataTitle(normalizeLegacyBrand(pageSeo?.metaTitle || fallback.title || globalSettings.defaultTitle), fallback.path || '/');
    const description = normalizeMetaDescription(
      normalizeLegacyBrand(pageSeo?.metaDescription || fallback.description || ''),
      globalSettings.defaultDescription
    );
    const keywords = globalSettings.defaultKeywords;
    const ogImage = pageSeo?.ogImageUrl || fallback.image;

    // Canonical URL
    const canonical = catalogMetadataCanonical(pageSeo?.canonicalUrl, fallback.path || '/');
    const image = socialImage(ogImage, title);

    const isNoindex =
      !siteConfig.indexingEnabled || pageSeo?.isNoindex === true || fallback.indexable === false;

    return {
      title,
      description,
      keywords,
      alternates: {
        canonical,
      },
      robots: {
        index: !isNoindex,
        follow: true,
      },
      openGraph: {
        title: title,
        description: description,
        url: canonical,
        siteName: globalSettings.ogSiteName,
        images: [image],
        type: fallback.openGraphType || 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: title,
        description: description,
        images: [image],
        ...(globalSettings.twitterHandle ? { creator: globalSettings.twitterHandle } : {}),
      },
      verification: {
        google: globalSettings.googleVerification || undefined,
        yandex: globalSettings.yandexVerification || undefined,
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
        url: siteConfig.url,
        potentialAction: {
          '@type': 'SearchAction',
          target: absoluteUrl('/search?q={search_term_string}'),
          'query-input': 'required name=search_term_string',
        },
      };
    }

    if (type === 'Movie') {
      const schema: any = {
        '@context': 'https://schema.org',
        '@type': 'Movie',
        '@id': `${absoluteUrl(data.path)}#movie`,
        name: data.title,
        description: data.description,
        image: data.image,
        datePublished: data.releaseDate,
        director: data.directors?.map((director: any) => ({
          '@type': 'Person',
          name: director.name,
          ...(director.path ? { url: absoluteUrl(director.path) } : {}),
        })),
        actor: data.actors?.map((actor: any) => ({
          '@type': 'Person',
          name: actor.name,
          ...(actor.path ? { url: absoluteUrl(actor.path) } : {}),
        })),
        genre: Array.isArray(data.genres)
          ? data.genres.map((genre: any) => genre.name || genre)
          : data.genre?.name,
      };

      schema.trailer = trailerSchema({ videoId: data.youtubeTrailerId, title: `${data.title} Trailer`, description: data.description || `Trailer for ${data.title}`, publishedDate: data.trailerPublishedDate });
      // Imported third-party ratings remain visible catalog information, not
      // MovieFlix review-snippet claims (Google's review-snippet guidelines).

      return schema;
    }

    if (type === 'Person') {
      return {
        '@context': 'https://schema.org',
        '@type': 'Person',
        '@id': `${absoluteUrl(data.path)}#person`,
        url: absoluteUrl(data.path),
        mainEntityOfPage: absoluteUrl(data.path),
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
        url: absoluteUrl(data.path),
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
          item: absoluteUrl(item.path),
        })),
      };
    }

    return null;
  }

  /**
   * Generate Sitemap Data
   */
  static async generateSitemapData() {
    const [{ genres, collections }, years, originCountMap, streamingCountMap, homepageLastModified, overrides] = await Promise.all([
      SeoRepository.getCoreSitemapData(),
      MovieRepository.listPublishedReleaseYearStats(),
      MovieRepository.countOriginGroups(ORIGIN_CATALOG),
      MovieRepository.countStreamingGroups(STREAMING_CATALOG),
      SeoRepository.getHomepageLastModified(),
      SeoRepository.listSitemapOverrides(),
    ]);
    const originCounts = ORIGIN_CATALOG.map((item) => ({ item, total: originCountMap.get(item.slug) || 0 }));
    const streamingCounts = STREAMING_CATALOG.map((item) => ({ item, total: streamingCountMap.get(item.slug) || 0 }));

    const sitemap: SitemapEntry[] = [
      { url: siteConfig.url, lastModified: homepageLastModified, changeFrequency: 'daily', priority: 1.0 },
      { url: absoluteUrl('/movies'), changeFrequency: 'daily', priority: 0.8 },
      { url: absoluteUrl('/streaming'), changeFrequency: 'weekly', priority: 0.8 },
      { url: absoluteUrl('/genres'), changeFrequency: 'weekly', priority: 0.7 },
      { url: absoluteUrl('/countries'), changeFrequency: 'weekly', priority: 0.7 },
      { url: absoluteUrl('/years'), changeFrequency: 'weekly', priority: 0.7 },
      { url: absoluteUrl('/popular'), changeFrequency: 'daily', priority: 0.7 },
      { url: absoluteUrl('/about'), changeFrequency: 'monthly', priority: 0.4 },
      { url: absoluteUrl('/methodology'), changeFrequency: 'monthly', priority: 0.4 },
      { url: absoluteUrl('/privacy'), changeFrequency: 'monthly', priority: 0.2 },
      { url: absoluteUrl('/terms'), changeFrequency: 'monthly', priority: 0.2 },
      ...(isValidContactEmail(siteConfig.contactEmail)
        ? [
            { url: absoluteUrl('/contact'), changeFrequency: 'monthly', priority: 0.3 },
            { url: absoluteUrl('/dmca'), changeFrequency: 'monthly', priority: 0.2 },
          ] satisfies SitemapEntry[]
        : []),
    ];

    genres.forEach((g) =>
      sitemap.push({
        url: absoluteUrl(`/genre/${g.slug}`),
        lastModified: g.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.6,
      })
    );
    collections.forEach((c) =>
      sitemap.push({
        url: absoluteUrl(`/collection/${c.slug}`),
        lastModified: c.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.7,
      })
    );
    POPULAR_CATALOG.forEach((item) =>
      sitemap.push({
        url: absoluteUrl(`/popular/${item.slug}`),
        changeFrequency: 'daily',
        priority: 0.7,
      })
    );
    streamingCounts.filter(({ total }) => total >= 3).forEach(({ item }) =>
      sitemap.push({
        url: absoluteUrl(`/streaming/${item.slug}`),
        changeFrequency: 'weekly',
        priority: 0.7,
      })
    );
    originCounts.filter(({ total }) => total >= 3).forEach(({ item }) =>
      sitemap.push({
        url: absoluteUrl(`/origin/${item.slug}`),
        changeFrequency: 'weekly',
        priority: 0.6,
      })
    );
    years.filter((item) => Number(item.count) >= 3).forEach((item) =>
      sitemap.push({
        url: absoluteUrl(`/year/${item.year}`),
        lastModified: item.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.6,
      })
    );

    const entityPaths = new Map<string, string>([
      ...genres.map((genre) => [`Genre:${genre.id}`, `/genre/${genre.slug}`] as const),
      ...collections.map((collection) => [`Collection:${collection.id}`, `/collection/${collection.slug}`] as const),
    ]);
    const excludedUrls = new Set(overrides.flatMap((override) => {
      let path = override.routePath || entityPaths.get(`${override.seoableType}:${override.seoableId}`);
      if (!path && override.seoableType === 'Page') path = override.seoableId === 'home' ? '/' : `/${override.seoableId.replace(/^\//, '')}`;
      if (!path && override.seoableType === 'OriginCatalog') path = `/origin/${override.seoableId}`;
      if (!path && override.seoableType === 'StreamingCatalog') path = `/streaming/${override.seoableId}`;
      if (!path && override.seoableType === 'YearCatalog') path = `/year/${override.seoableId}`;
      if (!path && override.seoableType === 'PopularCatalog') path = `/popular/${override.seoableId}`;
      return path ? [absoluteUrl(path)] : [];
    }));
    return sitemap.filter((entry) => !excludedUrls.has(entry.url));
  }

  static async getMovieSitemapPageCount() {
    const total = await SeoRepository.countIndexableMovies();
    return Math.ceil(total / MOVIE_SITEMAP_PAGE_SIZE);
  }

  static async generateMovieSitemapData(page: number): Promise<SitemapEntry[]> {
    if (!Number.isSafeInteger(page) || page < 0) return [];
    const movies = await SeoRepository.listIndexableMoviesForSitemap({
      skip: page * MOVIE_SITEMAP_PAGE_SIZE,
      take: MOVIE_SITEMAP_PAGE_SIZE,
    });

    return movies.map((movie) => {
      const trailer = movie.trailers[0];
      const youtubeId = trailer?.sourceId || movie.youtubeTrailerId;
      const description = normalizeMetaDescription(
        movie.synopsis,
        `Watch the official trailer for ${movie.title} on MovieFlix.`
      );
      return {
        url: absoluteUrl(moviePath(movie.slug)),
        lastModified: movie.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.8,
        ...(movie.posterUrl
          ? { image: { loc: getTmdbImageUrl(movie.posterUrl, 500), title: `${movie.title} poster` } }
          : {}),
        ...(youtubeId
          ? {
              video: {
                thumbnailLoc:
                  trailer?.thumbnailUrl || `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
                title: trailer?.title || `${movie.title} trailer`,
                description,
                playerLoc: `https://www.youtube.com/embed/${youtubeId}`,
                publicationDate: trailer?.publishedDate || undefined,
              },
            }
          : {}),
      };
    });
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
      url: absoluteUrl(personPath(person.slug)),
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

Sitemap: ${absoluteUrl('/sitemap.xml')}`;
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
        <title><![CDATA[${escapeCdata(m.title)}]]></title>
        <link>${absoluteUrl(moviePath(m.slug))}</link>
        <guid>${absoluteUrl(moviePath(m.slug))}</guid>
        <pubDate>${m.createdAt.toUTCString()}</pubDate>
        <description><![CDATA[${escapeCdata(m.synopsis || '')}]]></description>
      </item>
    `
      )
      .join('');

    return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>MovieFlix</title>
    <link>${siteConfig.url}</link>
    <description>Latest movies and trailers from MovieFlix</description>
    ${items}
  </channel>
</rss>`;
  }
}
