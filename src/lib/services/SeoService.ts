import { SeoRepository } from '../repositories/SeoRepository';
import { SettingsRepository } from '../repositories/SettingsRepository';
import { Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import { extractYouTubeId } from '../utils/youtube';
import { Metadata } from 'next';
import { cache } from 'react';
import { revalidatePath, revalidateTag } from 'next/cache';
import { HOMEPAGE_CATALOG_TAG } from '../homepage-cache';
import { MovieRepository } from '../repositories/MovieRepository';
import { PersonRepository } from '../repositories/PersonRepository';
import { ORIGIN_CATALOG, POPULAR_CATALOG } from '../public-catalog';
import { STREAMING_CATALOG } from '../streaming-catalog';
import { moviePath, personPath } from '../public-routes';
import { absoluteUrl, isValidContactEmail, normalizeMetaDescription, siteConfig } from '../site-config';
import type { SitemapEntry } from '../sitemap-xml';
import { getTmdbImageUrl } from '../tmdb-image-loader';
import { catalogMetadataCanonical, paginatedMetadataTitle, socialImage } from '../seo-metadata';
import { formatTrailerTitle, trailerSchema } from '../trailer-schema';
import { clearAllPublicMemoryCaches, createMemoryCache } from '../memory-cache';
import { MIN_INDEXABLE_GUIDE_MOVIES } from '../programmatic-guides';

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

const rssFeedCache = createMemoryCache<string>({
  maxEntries: 2,
  ttlMs: 15 * 60_000,
});

function revalidatePublicSeo(paths: string[] = ['/']) {
  clearAllPublicMemoryCaches();
  try {
    revalidateTag(HOMEPAGE_CATALOG_TAG, { expire: 0 });
    for (const p of paths) {
      revalidatePath(p);
    }
  } catch {
    // Revalidation APIs require an active Next.js server store; ignore in CLI/tests.
  }
}

export class SeoService {
  // --------------------------------------------------------------------------
  // Basic SEO Page CRUD
  // --------------------------------------------------------------------------

  static getHomepageSeo = cache(async () => {
    return (await SeoRepository.getByEntity('Page', 'home')) ?? (await SeoRepository.getByRoute('/'));
  });

  static async updateHomepageSeo(
    data: Omit<Prisma.SeoPageCreateInput, 'routePath' | 'seoableType' | 'seoableId'>
  ) {
    const result = await prisma.$transaction(async (tx) => {
      const [byEntity, byRoute] = await Promise.all([
        SeoRepository.getByEntity('Page', 'home', tx),
        SeoRepository.getByRoute('/', tx),
      ]);

      if (byEntity && byRoute && byEntity.id !== byRoute.id) {
        await tx.seoPage.delete({ where: { id: byRoute.id } });
        return tx.seoPage.update({
          where: { id: byEntity.id },
          data: { ...data, routePath: '/' },
        });
      }

      if (byEntity) {
        return tx.seoPage.update({
          where: { id: byEntity.id },
          data: { ...data, routePath: '/' },
        });
      }

      if (byRoute) {
        return tx.seoPage.update({
          where: { id: byRoute.id },
          data: { ...data, seoableType: 'Page', seoableId: 'home', routePath: '/' },
        });
      }

      return tx.seoPage.create({
        data: {
          seoableType: 'Page',
          seoableId: 'home',
          routePath: '/',
          ...data,
        },
      });
    });

    revalidatePublicSeo(['/', '/opengraph-image', '/sitemap.xml']);
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
    revalidatePublicSeo(result.routePath ? ['/', result.routePath, '/sitemap.xml'] : ['/', '/sitemap.xml']);
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
        bingVerification: siteConfig.bingVerification || map['seo.bingVerification'] || '',
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
    revalidatePublicSeo(['/', '/sitemap.xml']);
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
      keywords?: string[];
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
    const ogImage = pageSeo?.ogImageUrl || fallback.image;

    // Canonical URL
    const canonical = catalogMetadataCanonical(pageSeo?.canonicalUrl, fallback.path || '/');
    const image = socialImage(ogImage, title);

    const isNoindex =
      !siteConfig.indexingEnabled || pageSeo?.isNoindex === true || fallback.indexable === false;

    const bingCode = globalSettings.bingVerification?.trim() || '';
    const googleCode = globalSettings.googleVerification?.trim() || '';
    const yandexCode = globalSettings.yandexVerification?.trim() || '';
    const hasVerification = Boolean(googleCode || yandexCode || bingCode);

    return {
      title,
      description,
      ...(fallback.keywords?.length ? { keywords: fallback.keywords } : {}),
      alternates: {
        canonical,
      },
      robots: {
        index: !isNoindex,
        follow: true,
        googleBot: isNoindex
          ? {
              index: false,
              follow: true,
            }
          : {
              index: true,
              follow: true,
              'max-image-preview': 'large',
              'max-snippet': -1,
              'max-video-preview': -1,
            },
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
      ...(hasVerification
        ? {
            verification: {
              ...(googleCode ? { google: googleCode } : {}),
              ...(yandexCode ? { yandex: yandexCode } : {}),
              ...(bingCode ? { other: { 'msvalidate.01': bingCode } } : {}),
            },
          }
        : {}),
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
    // Stage sitemap queries in bounded steps so core sitemap rebuilds never starve
    // a small PostgreSQL connection pool while public traffic is browsing.
    const [{ genres, collections }, years, homepageLastModified, overrides] = await Promise.all([
      SeoRepository.getCoreSitemapData(),
      MovieRepository.listPublishedReleaseYearStats(),
      SeoRepository.getHomepageLastModified(),
      SeoRepository.listSitemapOverrides(),
    ]);
    const originCountMap = await MovieRepository.countOriginGroups(ORIGIN_CATALOG);
    const streamingCountMap = await MovieRepository.countStreamingGroups(STREAMING_CATALOG);
    const facetGuides = await MovieRepository.listIndexableFacetGuides({
      platforms: STREAMING_CATALOG.map(({ slug, tmdbIds }) => ({ slug, tmdbIds })),
      origins: ORIGIN_CATALOG.map(({ slug, countryCodes, languageCodes }) => ({
        slug,
        countryCodes,
        languageCodes,
      })),
      minCount: MIN_INDEXABLE_GUIDE_MOVIES,
    });
    const originCounts = ORIGIN_CATALOG.map((item) => ({ item, total: originCountMap.get(item.slug) || 0 }));
    const streamingCounts = STREAMING_CATALOG.map((item) => ({ item, total: streamingCountMap.get(item.slug) || 0 }));

    const sitemap: SitemapEntry[] = [
      { url: siteConfig.url, lastModified: homepageLastModified, changeFrequency: 'daily', priority: 1.0 },
      { url: absoluteUrl('/movies'), lastModified: homepageLastModified, changeFrequency: 'daily', priority: 0.8 },
      { url: absoluteUrl('/streaming'), lastModified: homepageLastModified, changeFrequency: 'weekly', priority: 0.8 },
      { url: absoluteUrl('/genres'), lastModified: homepageLastModified, changeFrequency: 'weekly', priority: 0.7 },
      { url: absoluteUrl('/countries'), lastModified: homepageLastModified, changeFrequency: 'weekly', priority: 0.7 },
      { url: absoluteUrl('/years'), lastModified: homepageLastModified, changeFrequency: 'weekly', priority: 0.7 },
      { url: absoluteUrl('/popular'), lastModified: homepageLastModified, changeFrequency: 'daily', priority: 0.7 },
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
        priority: 0.7,
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
        lastModified: homepageLastModified,
        changeFrequency: 'daily',
        priority: 0.7,
      })
    );
    streamingCounts.filter(({ total }) => total >= 3).forEach(({ item }) =>
      sitemap.push({
        url: absoluteUrl(`/streaming/${item.slug}`),
        lastModified: homepageLastModified,
        changeFrequency: 'weekly',
        priority: 0.7,
      })
    );
    originCounts.filter(({ total }) => total >= 3).forEach(({ item }) =>
      sitemap.push({
        url: absoluteUrl(`/origin/${item.slug}`),
        lastModified: homepageLastModified,
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

    // High-intent 2-facet programmatic SEO guides (strict >= 10 published movies quality gate)
    facetGuides.streamingGenre.forEach((entry) =>
      sitemap.push({
        url: absoluteUrl(`/streaming/${entry.streamingSlug}/${entry.genreSlug}`),
        lastModified: homepageLastModified,
        changeFrequency: 'weekly',
        priority: 0.7,
      })
    );
    facetGuides.genreYear.forEach((entry) =>
      sitemap.push({
        url: absoluteUrl(`/genre/${entry.genreSlug}/${entry.year}`),
        lastModified: homepageLastModified,
        changeFrequency: 'weekly',
        priority: 0.7,
      })
    );
    facetGuides.originGenre.forEach((entry) =>
      sitemap.push({
        url: absoluteUrl(`/origin/${entry.originSlug}/${entry.genreSlug}`),
        lastModified: homepageLastModified,
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
      if (!path && override.seoableType === 'StreamingGenreGuide') path = `/streaming/${override.seoableId}`;
      if (!path && override.seoableType === 'GenreYearGuide') path = `/genre/${override.seoableId}`;
      if (!path && override.seoableType === 'OriginGenreGuide') path = `/origin/${override.seoableId}`;
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
      const youtubeId =
        extractYouTubeId(trailer?.sourceId || '') ||
        extractYouTubeId(movie.youtubeTrailerId || '');
      const year = movie.releaseDate ? new Date(movie.releaseDate).getUTCFullYear() : null;
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
                title: formatTrailerTitle(movie.title, trailer?.title, year),
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
    return rssFeedCache.getOrLoad('rss-feed-v2', async () => {
      const movies = await SeoRepository.getRssFeedData();
      const feedUrl = absoluteUrl('/feed.xml');
      const lastBuildDate = (movies[0]?.createdAt || new Date()).toUTCString();

      const items = movies
        .map((m) => {
          const year = m.releaseDate ? new Date(m.releaseDate).getUTCFullYear() : null;
          const itemTitle = year ? `${m.title} (${year})` : m.title;
          const itemUrl = absoluteUrl(moviePath(m.slug));
          const poster = m.posterUrl ? getTmdbImageUrl(m.posterUrl, 500) : null;
          const categories = (m.genres || [])
            .map((g) => `<category><![CDATA[${escapeCdata(g.genre.name)}]]></category>`)
            .join('');
          const mediaTag = poster
            ? `<media:thumbnail url="${poster.replace(/&/g, '&amp;')}" width="500" />`
            : '';

          return `
      <item>
        <title><![CDATA[${escapeCdata(itemTitle)}]]></title>
        <link>${itemUrl}</link>
        <guid isPermaLink="true">${itemUrl}</guid>
        <pubDate>${m.createdAt.toUTCString()}</pubDate>
        <description><![CDATA[${escapeCdata(m.synopsis || `Watch the official trailer for ${itemTitle} on MovieFlix.`)}]]></description>
        ${categories}
        ${mediaTag}
      </item>`;
        })
        .join('');

      return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${siteConfig.name} — Latest Movies &amp; Official Trailers</title>
    <link>${siteConfig.url}</link>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />
    <description>${siteConfig.description}</description>
    <language>en</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>${items}
  </channel>
</rss>`;
    });
  }
}
