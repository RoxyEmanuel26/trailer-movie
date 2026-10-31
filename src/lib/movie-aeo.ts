import { matchStreamingCatalogSlug } from './streaming-catalog';

export interface MovieFaqItem {
  question: string;
  answer: string;
}

export interface MovieAeoInput {
  title: string;
  year: number | null;
  releaseDate: Date | null;
  runtimeMinutes: number | null;
  ageRating: string | null;
  mpaaRating: string | null;
  voteAverage: number | null;
  voteCount: number | null;
  genres: string[];
  directors: string[];
  cast: Array<{ name: string; characterName?: string | null }>;
  countries: string[];
  languages: string[];
  hasActiveTrailer: boolean;
  providerNames: string[];
}

export interface MatchedStreamingPlatformLink {
  name: string;
  slug: string;
}

function normalizeProviderLabel(rawName: string): string {
  const norm = rawName.trim();
  if (/^netflix/i.test(norm)) return 'Netflix';
  if (/amazon|prime video/i.test(norm)) return 'Prime Video';
  if (/apple/i.test(norm)) return 'Apple TV';
  if (/disney/i.test(norm)) return 'Disney+';
  if (/google/i.test(norm)) return 'Google Play';
  if (/youtube/i.test(norm)) return 'YouTube';
  if (/hbo|^max$/i.test(norm) && !/maxdome/i.test(norm)) return 'Max';
  if (/hulu/i.test(norm)) return 'Hulu';
  if (/paramount/i.test(norm)) return 'Paramount+';
  if (/peacock/i.test(norm)) return 'Peacock';
  if (/vidio/i.test(norm)) return 'Vidio';
  if (/catchplay/i.test(norm)) return 'Catchplay+';
  if (/viu/i.test(norm)) return 'Viu';
  if (/tubi/i.test(norm)) return 'Tubi';
  if (/plex/i.test(norm)) return 'Plex';
  if (/mubi/i.test(norm)) return 'MUBI';
  if (/crunchyroll/i.test(norm)) return 'Crunchyroll';
  return norm;
}

export function extractUniqueProviders(
  links?: Array<{ provider?: { name?: string | null } | null }> | null,
  legacyProviders?: any
): { names: string[]; hubLinks: MatchedStreamingPlatformLink[] } {
  const seen = new Set<string>();
  const names: string[] = [];

  if (Array.isArray(links)) {
    for (const link of links) {
      const raw = link?.provider?.name;
      if (!raw) continue;
      const clean = normalizeProviderLabel(raw);
      if (clean && !seen.has(clean)) {
        seen.add(clean);
        names.push(clean);
      }
    }
  }

  if (names.length === 0 && legacyProviders && typeof legacyProviders === 'object') {
    const buckets = [
      ...(legacyProviders.flatrate || []),
      ...(legacyProviders.free || []),
      ...(legacyProviders.ads || []),
      ...(legacyProviders.rent || []),
      ...(legacyProviders.buy || []),
    ];
    for (const item of buckets) {
      const raw = item?.provider_name;
      if (!raw) continue;
      const clean = normalizeProviderLabel(String(raw));
      if (clean && !seen.has(clean)) {
        seen.add(clean);
        names.push(clean);
      }
    }
  }

  const hubLinks: MatchedStreamingPlatformLink[] = [];
  const seenSlugs = new Set<string>();
  for (const name of names) {
    const slug = matchStreamingCatalogSlug(name);
    if (slug && !seenSlugs.has(slug)) {
      seenSlugs.add(slug);
      hubLinks.push({ name, slug });
    }
  }

  return { names, hubLinks };
}

export function formatRuntimeHuman(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m (${minutes} minutes)`;
  if (hours > 0) return `${hours}h (${minutes} minutes)`;
  return `${minutes} minutes`;
}

export function buildMovieQuickFactsAndFaq(input: MovieAeoInput): {
  quickSummary: string;
  faqs: MovieFaqItem[];
} {
  const titleWithYear = input.year ? `${input.title} (${input.year})` : input.title;
  const genrePhrase = input.genres.length > 0 ? input.genres.slice(0, 3).join(', ').toLowerCase() : 'feature';
  const directorPhrase =
    input.directors.length > 0 ? ` directed by ${input.directors.slice(0, 2).join(' and ')}` : '';
  const castNames = input.cast.slice(0, 3).map((c) => c.name);
  const castPhrase = castNames.length > 0 ? `, starring ${castNames.join(', ')}` : '';

  const detailsParts: string[] = [];
  if (input.runtimeMinutes) detailsParts.push(`runs ${input.runtimeMinutes} minutes`);
  const cert = input.ageRating || input.mpaaRating;
  if (cert) detailsParts.push(`carries a ${cert} classification`);
  if (input.voteAverage && input.voteCount) {
    detailsParts.push(
      `holds a ${input.voteAverage.toFixed(1)}/10 audience score across ${input.voteCount.toLocaleString('en-US')} votes`
    );
  }

  const providerSentence =
    input.providerNames.length > 0
      ? ` Viewers can check regional availability across ${input.providerNames.slice(0, 4).join(', ')}${input.providerNames.length > 4 ? ', and more' : ''}, alongside its official trailer on MovieFlix.`
      : input.hasActiveTrailer
        ? ' Watch the official trailer and explore complete cast, crew, and release details on MovieFlix.'
        : ' Explore complete cast, crew, and release details on MovieFlix.';

  const secondSentence =
    detailsParts.length > 0 ? ` The film ${detailsParts.join(', ')}.` : '';

  const quickSummary = `${titleWithYear} is a ${genrePhrase} film${directorPhrase}${castPhrase}.${secondSentence}${providerSentence}`;

  const faqs: MovieFaqItem[] = [];

  if (input.providerNames.length > 0) {
    const listed = input.providerNames.slice(0, 6).join(', ');
    faqs.push({
      question: `Where can I watch ${titleWithYear} online?`,
      answer: `${input.title} is listed across ${listed}${input.providerNames.length > 6 ? `, and ${input.providerNames.length - 6} additional services` : ''} depending on your country. Use the regional availability selector on this MovieFlix page to compare streaming, rental, and purchase options in your territory, or watch the official trailer above.`,
    });
  } else if (input.hasActiveTrailer) {
    faqs.push({
      question: `Is there an official trailer for ${titleWithYear}?`,
      answer: `Yes. You can watch the official trailer for ${input.title} directly on this MovieFlix page, and check back as regional streaming, digital rental, and purchase listings are updated.`,
    });
  }

  if (input.runtimeMinutes || cert) {
    const runtimeText = input.runtimeMinutes
      ? `${input.title} has a runtime of ${formatRuntimeHuman(input.runtimeMinutes)}`
      : `${input.title}'s exact runtime has not been listed yet`;
    const ratingText = cert
      ? ` and is rated ${cert}`
      : '';
    faqs.push({
      question: `How long is ${input.title} and what is its age rating?`,
      answer: `${runtimeText}${ratingText}. Classification standards can vary by country and release format.`,
    });
  }

  if (input.directors.length > 0 || input.cast.length > 0) {
    const dirPart =
      input.directors.length > 0
        ? `${input.title} was directed by ${input.directors.join(', ')}.`
        : '';
    const actorList = input.cast
      .slice(0, 5)
      .map((c) => (c.characterName ? `${c.name} (${c.characterName})` : c.name))
      .join(', ');
    const castPart = actorList ? ` Key cast members include ${actorList}.` : '';
    faqs.push({
      question: `Who directed and starred in ${input.title}?`,
      answer: `${dirPart}${castPart}`.trim(),
    });
  }

  if (input.releaseDate || input.countries.length > 0) {
    const formattedDate = input.releaseDate
      ? new Intl.DateTimeFormat('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
          timeZone: 'UTC',
        }).format(input.releaseDate)
      : null;
    const datePart = formattedDate ? `${input.title} was released on ${formattedDate}.` : '';
    const originPart =
      input.countries.length > 0
        ? ` Production countries include ${input.countries.join(', ')}${input.languages.length > 0 ? `, with spoken dialogue in ${input.languages.join(', ')}` : ''}.`
        : '';
    faqs.push({
      question: `When was ${input.title} released and where was it produced?`,
      answer: `${datePart}${originPart}`.trim(),
    });
  }

  return { quickSummary, faqs };
}

export function buildFaqJsonLd(pageUrl: string, faqs: MovieFaqItem[]) {
  if (!faqs.length) return null;
  return {
    '@type': 'FAQPage',
    '@id': `${pageUrl}#faq`,
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}
