import type { MovieFaqItem } from './movie-aeo';

export type ThemeCategory = 'mind-bending' | 'horror-thriller' | 'true-stories' | 'action-world' | 'seasonal-favorites';

export interface ThemeCatalogItem {
  slug: string;
  label: string;
  title: string;
  category: ThemeCategory;
  keywordTmdbIds: number[];
  keywordNames: string[];
  tagline: string;
  description: string;
}

export const THEME_CATEGORY_LABELS: Record<ThemeCategory, string> = {
  'mind-bending': 'Mind-Bending Sci-Fi & Mystery',
  'horror-thriller': 'Horror & Dark Thrillers',
  'true-stories': 'True Stories, Books & Prestige',
  'action-world': 'Action, Crime & World Cinema',
  'seasonal-favorites': 'Seasonal & Crowd Favorites',
};

export const THEME_CATALOG: ThemeCatalogItem[] = [
  // Seasonal & Crowd Favorites
  {
    slug: 'christmas',
    label: 'Christmas Movies',
    title: 'Best Christmas Movies & Holiday Trailers',
    category: 'seasonal-favorites',
    keywordTmdbIds: [207317],
    keywordNames: ['christmas'],
    tagline: 'Cozy holiday classics, festive comedies, and winter family favorites.',
    description:
      'Browse the best Christmas and holiday movies with official trailers, runtimes, ratings, and where to stream this festive season.',
  },
  {
    slug: 'coming-of-age',
    label: 'Coming-of-Age Movies',
    title: 'Best Coming-of-Age Movies',
    category: 'seasonal-favorites',
    keywordTmdbIds: [10683],
    keywordNames: ['coming of age'],
    tagline: 'Heartfelt stories about growing up, first love, and self-discovery.',
    description:
      'Explore standout coming-of-age movies from Hollywood, Europe, and Asia complete with official trailers, casts, and streaming guides.',
  },
  {
    slug: 'dark-comedy',
    label: 'Dark Comedy Movies',
    title: 'Best Dark Comedy Movies',
    category: 'seasonal-favorites',
    keywordTmdbIds: [10123],
    keywordNames: ['dark comedy'],
    tagline: 'Razor-sharp satire, wicked twists, and pitch-black laughs.',
    description:
      'Discover top dark comedy movies with trailers, cast credits, audience scores, and where to watch.',
  },
  {
    slug: 'sports',
    label: 'Sports Movies',
    title: 'Best Sports Movies',
    category: 'seasonal-favorites',
    keywordTmdbIds: [6075],
    keywordNames: ['sports'],
    tagline: 'Underdog triumphs, championship rivalries, and inspiring athletic dramas.',
    description:
      'Watch trailers and browse the best sports movies ranked by popularity with runtimes, ratings, and streaming platforms.',
  },
  {
    slug: 'musical',
    label: 'Musical Movies',
    title: 'Best Musical Movies',
    category: 'seasonal-favorites',
    keywordTmdbIds: [4344],
    keywordNames: ['musical'],
    tagline: 'Showstopping song-and-dance spectacles and modern movie musicals.',
    description:
      'Explore musical movies with official trailers, soundtracks, casts, runtimes, and streaming availability.',
  },
  {
    slug: 'superhero',
    label: 'Superhero Movies',
    title: 'Best Superhero Movies',
    category: 'seasonal-favorites',
    keywordTmdbIds: [9715],
    keywordNames: ['superhero'],
    tagline: 'Comic-book blockbusters, origin stories, and multiversal crossovers.',
    description:
      'Browse top superhero movies with official trailers, release years, runtimes, cast lists, and streaming platforms.',
  },

  // Mind-Bending Sci-Fi & Mystery
  {
    slug: 'time-travel',
    label: 'Time Travel Movies',
    title: 'Best Time Travel Movies',
    category: 'mind-bending',
    keywordTmdbIds: [4379],
    keywordNames: ['time travel'],
    tagline: 'Paradoxes, time loops, and mind-bending journeys across eras.',
    description:
      'Discover the best time travel movies with verified official trailers, synopses, ratings, and where to stream.',
  },
  {
    slug: 'plot-twist',
    label: 'Plot Twist Movies',
    title: 'Best Plot Twist Movies',
    category: 'mind-bending',
    keywordTmdbIds: [275311],
    keywordNames: ['plot twist'],
    tagline: 'Shocking reveals and unpredictable endings you will not see coming.',
    description:
      'Explore mind-bending plot twist movies with official trailers, cast lists, audience scores, and streaming options.',
  },
  {
    slug: 'dystopian',
    label: 'Dystopian Movies',
    title: 'Best Dystopian & Future-World Movies',
    category: 'mind-bending',
    keywordTmdbIds: [4565],
    keywordNames: ['dystopia'],
    tagline: 'Authoritarian futures, rebel uprisings, and high-stakes survival worlds.',
    description:
      'Browse top dystopian sci-fi movies complete with official trailers, runtimes, ratings, and where to watch.',
  },
  {
    slug: 'cyberpunk',
    label: 'Cyberpunk Movies',
    title: 'Best Cyberpunk Movies',
    category: 'mind-bending',
    keywordTmdbIds: [12190],
    keywordNames: ['cyberpunk'],
    tagline: 'Neon-lit megacities, rogue AI, and high-tech noir cinema.',
    description:
      'Discover cyberpunk sci-fi and anime movies with official trailers, directors, casts, and streaming platforms.',
  },
  {
    slug: 'space',
    label: 'Space Movies',
    title: 'Best Space & Interstellar Movies',
    category: 'mind-bending',
    keywordTmdbIds: [9882],
    keywordNames: ['space'],
    tagline: 'Deep-space expeditions, astronaut survival, and cosmic mysteries.',
    description:
      'Explore the best space movies complete with trailers, cast credits, runtimes, and streaming availability.',
  },
  {
    slug: 'alien',
    label: 'Alien Movies',
    title: 'Best Alien & First Contact Movies',
    category: 'mind-bending',
    keywordTmdbIds: [9951],
    keywordNames: ['alien'],
    tagline: 'Extraterrestrial invasions, sci-fi horror, and mysterious first encounters.',
    description:
      'Browse alien and extraterrestrial sci-fi movies with official trailers, audience ratings, and streaming guides.',
  },
  {
    slug: 'post-apocalyptic',
    label: 'Post-Apocalyptic Movies',
    title: 'Best Post-Apocalyptic Movies',
    category: 'mind-bending',
    keywordTmdbIds: [359337],
    keywordNames: ['post-apocalyptic'],
    tagline: 'Wasteland survival epics set after the fall of civilization.',
    description:
      'Watch trailers and discover post-apocalyptic survival films with ratings, runtimes, and streaming platforms.',
  },
  {
    slug: 'murder-mystery',
    label: 'Murder Mystery Movies',
    title: 'Best Murder Mystery & Whodunit Movies',
    category: 'mind-bending',
    keywordTmdbIds: [207046, 703],
    keywordNames: ['murder mystery', 'detective'],
    tagline: 'Clever detectives, locked-room puzzles, and gripping whodunit thrillers.',
    description:
      'Explore murder mystery and detective movies complete with official trailers, casts, ratings, and where to watch.',
  },
  {
    slug: 'conspiracy',
    label: 'Conspiracy Movies',
    title: 'Best Conspiracy Thriller Movies',
    category: 'mind-bending',
    keywordTmdbIds: [10410],
    keywordNames: ['conspiracy'],
    tagline: 'Cover-ups, whistleblowers, and paranoid political & corporate thrillers.',
    description:
      'Discover conspiracy thriller movies with verified trailers, synopses, casts, and streaming availability.',
  },

  // Horror & Dark Thrillers
  {
    slug: 'found-footage',
    label: 'Found Footage Movies',
    title: 'Best Found Footage Horror Movies',
    category: 'horror-thriller',
    keywordTmdbIds: [163053],
    keywordNames: ['found footage'],
    tagline: 'Raw handheld terror, mockumentary nightmares, and screenlife thrillers.',
    description:
      'Browse over a thousand found footage horror movies with official trailers, ratings, runtimes, and streaming options.',
  },
  {
    slug: 'psychological-thriller',
    label: 'Psychological Thriller Movies',
    title: 'Best Psychological Thriller Movies',
    category: 'horror-thriller',
    keywordTmdbIds: [12565],
    keywordNames: ['psychological thriller'],
    tagline: 'Unreliable narrators, slow-burn dread, and razor-edge mind games.',
    description:
      'Explore top psychological thriller movies with trailers, cast credits, audience scores, and where to stream.',
  },
  {
    slug: 'serial-killer',
    label: 'Serial Killer Movies',
    title: 'Best Serial Killer & Crime Thriller Movies',
    category: 'horror-thriller',
    keywordTmdbIds: [10714],
    keywordNames: ['serial killer'],
    tagline: 'Chilling manhunts, criminal profilers, and dark investigative thrillers.',
    description:
      'Discover serial killer thrillers and crime dramas with official trailers, casts, ratings, and streaming platforms.',
  },
  {
    slug: 'slasher',
    label: 'Slasher Movies',
    title: 'Best Slasher Horror Movies',
    category: 'horror-thriller',
    keywordTmdbIds: [12339],
    keywordNames: ['slasher'],
    tagline: 'Masked killers, final girls, and relentless late-night horror thrills.',
    description:
      'Browse classic and modern slasher horror movies with official trailers, runtimes, ratings, and where to watch.',
  },
  {
    slug: 'ghost',
    label: 'Ghost Movies',
    title: 'Best Ghost & Haunted House Movies',
    category: 'horror-thriller',
    keywordTmdbIds: [162846],
    keywordNames: ['ghost'],
    tagline: 'Haunted estates, restless spirits, and spine-tingling supernatural horror.',
    description:
      'Watch trailers and discover ghost movies from Hollywood, Europe, and Asia complete with ratings and streaming guides.',
  },
  {
    slug: 'supernatural',
    label: 'Supernatural Movies',
    title: 'Best Supernatural Movies',
    category: 'horror-thriller',
    keywordTmdbIds: [6152],
    keywordNames: ['supernatural'],
    tagline: 'Paranormal mysteries, dark curses, and otherworldly forces.',
    description:
      'Explore supernatural horror and fantasy movies with official trailers, cast lists, and streaming availability.',
  },
  {
    slug: 'zombie',
    label: 'Zombie Movies',
    title: 'Best Zombie & Outbreak Movies',
    category: 'horror-thriller',
    keywordTmdbIds: [12377],
    keywordNames: ['zombie'],
    tagline: 'Viral apocalypses, relentless hordes, and intense survival horror.',
    description:
      'Browse the best zombie movies across the US, South Korea, Japan, and Europe with trailers and streaming options.',
  },
  {
    slug: 'vampire',
    label: 'Vampire Movies',
    title: 'Best Vampire Movies',
    category: 'horror-thriller',
    keywordTmdbIds: [3133],
    keywordNames: ['vampire'],
    tagline: 'Gothic horror, midnight action, and modern blood-soaked thrillers.',
    description:
      'Discover vampire movies complete with official trailers, audience scores, casts, and where to watch.',
  },
  {
    slug: 'folk-horror',
    label: 'Folk Horror Movies',
    title: 'Best Folk Horror Movies',
    category: 'horror-thriller',
    keywordTmdbIds: [209568],
    keywordNames: ['folk horror'],
    tagline: 'Isolated villages, ancient rituals, and eerie rural nightmares.',
    description:
      'Explore folk horror movies from the UK, Nordics, US, and Asia with official trailers, ratings, and streaming guides.',
  },
  {
    slug: 'monster',
    label: 'Monster Movies',
    title: 'Best Monster & Creature Feature Movies',
    category: 'horror-thriller',
    keywordTmdbIds: [1299],
    keywordNames: ['monster'],
    tagline: 'Terrifying creatures, survival showdowns, and larger-than-life beasts.',
    description:
      'Browse monster movies with verified trailers, runtimes, ratings, and global streaming options.',
  },

  // True Stories, Books & Prestige
  {
    slug: 'based-on-true-story',
    label: 'Based on a True Story',
    title: 'Best Movies Based on a True Story',
    category: 'true-stories',
    keywordTmdbIds: [9672],
    keywordNames: ['based on true story'],
    tagline: 'Unbelievable real-life dramas, historic triumphs, and gripping true events.',
    description:
      'Discover over 1,000 movies based on true stories with official trailers, casts, audience scores, and streaming guides.',
  },
  {
    slug: 'based-on-a-book',
    label: 'Based on a Book',
    title: 'Best Movies Based on Books & Novels',
    category: 'true-stories',
    keywordTmdbIds: [818],
    keywordNames: ['based on novel or book'],
    tagline: 'Acclaimed literary adaptations, bestselling thrillers, and epic sagas.',
    description:
      'Explore the best movie adaptations based on novels and books complete with trailers, cast lists, and where to stream.',
  },
  {
    slug: 'true-crime',
    label: 'True Crime Movies',
    title: 'Best True Crime Movies',
    category: 'true-stories',
    keywordTmdbIds: [33722],
    keywordNames: ['true crime'],
    tagline: 'Real-world investigations, notorious scandals, and courtroom dramas.',
    description:
      'Browse gripping true crime movies with official trailers, ratings, runtimes, and streaming availability.',
  },
  {
    slug: 'world-war-ii',
    label: 'World War II Movies',
    title: 'Best World War II Movies',
    category: 'true-stories',
    keywordTmdbIds: [1956],
    keywordNames: ['world war ii'],
    tagline: 'Epic war dramas, resistance thrillers, and gripping historical stories.',
    description:
      'Discover World War II movies complete with official trailers, directors, casts, and streaming platforms.',
  },

  // Action, Crime & World Cinema
  {
    slug: 'heist',
    label: 'Heist Movies',
    title: 'Best Heist & Bank Robbery Movies',
    category: 'action-world',
    keywordTmdbIds: [10051, 15363],
    keywordNames: ['heist', 'bank robbery'],
    tagline: 'Mastermind crews, impossible vaults, and high-stakes double crosses.',
    description:
      'Explore top heist and bank robbery movies with official trailers, cast lists, ratings, and where to watch.',
  },
  {
    slug: 'revenge',
    label: 'Revenge Movies',
    title: 'Best Revenge Action & Thriller Movies',
    category: 'action-world',
    keywordTmdbIds: [9748],
    keywordNames: ['revenge'],
    tagline: 'Relentless vengeance thrillers from Hollywood, South Korea, and beyond.',
    description:
      'Browse the best revenge movies complete with trailers, audience ratings, casts, and streaming options.',
  },
  {
    slug: 'survival',
    label: 'Survival Movies',
    title: 'Best Survival Movies',
    category: 'action-world',
    keywordTmdbIds: [10349],
    keywordNames: ['survival'],
    tagline: 'Extreme nature, disaster escapes, and edge-of-your-seat endurance.',
    description:
      'Discover gripping survival movies with official trailers, runtimes, ratings, and where to stream.',
  },
  {
    slug: 'martial-arts',
    label: 'Martial Arts Movies',
    title: 'Best Martial Arts & Kung Fu Movies',
    category: 'action-world',
    keywordTmdbIds: [779],
    keywordNames: ['martial arts'],
    tagline: 'Hard-hitting choreography from Hong Kong, Japan, Indonesia, and Hollywood.',
    description:
      'Watch trailers and browse the best martial arts movies ranked by popularity with casts and streaming platforms.',
  },
  {
    slug: 'anime',
    label: 'Anime Movies',
    title: 'Best Anime Movies & Japanese Animation',
    category: 'action-world',
    keywordTmdbIds: [210024],
    keywordNames: ['anime'],
    tagline: 'Acclaimed Japanese anime features across fantasy, sci-fi, romance, and action.',
    description:
      'Explore the best anime feature films with official trailers, studios, ratings, and streaming availability.',
  },
  {
    slug: 'spy',
    label: 'Spy & Espionage Movies',
    title: 'Best Spy & Espionage Movies',
    category: 'action-world',
    keywordTmdbIds: [470],
    keywordNames: ['spy'],
    tagline: 'Secret agents, globe-trotting missions, and Cold War & modern intrigue.',
    description:
      'Discover spy and espionage movies complete with official trailers, cast lists, ratings, and streaming guides.',
  },
  {
    slug: 'prison',
    label: 'Prison Movies',
    title: 'Best Prison & Escape Movies',
    category: 'action-world',
    keywordTmdbIds: [378],
    keywordNames: ['prison'],
    tagline: 'Daring breakouts, gritty dramas, and tense survival behind bars.',
    description:
      'Browse prison and escape movies with verified trailers, audience scores, and where to watch.',
  },
  {
    slug: 'kaiju',
    label: 'Kaiju Movies',
    title: 'Best Kaiju & Giant Monster Movies',
    category: 'action-world',
    keywordTmdbIds: [161791],
    keywordNames: ['kaiju'],
    tagline: 'City-shattering giant monsters from Godzilla classics to modern spectacles.',
    description:
      'Explore kaiju and giant monster movies with official trailers, release dates, ratings, and streaming platforms.',
  },
  {
    slug: 'samurai-and-yakuza',
    label: 'Samurai & Yakuza Movies',
    title: 'Best Samurai & Yakuza Movies',
    category: 'action-world',
    keywordTmdbIds: [1462, 1794],
    keywordNames: ['samurai', 'yakuza'],
    tagline: 'Legendary sword epics and gripping Japanese underworld crime cinema.',
    description:
      'Discover samurai and yakuza movies complete with official trailers, directors, casts, and streaming availability.',
  },
];

const THEME_BY_SLUG = new Map(THEME_CATALOG.map((item) => [item.slug, item]));
const THEME_BY_TMDB_ID = new Map<number, ThemeCatalogItem>();
const THEME_BY_KEYWORD_NAME = new Map<string, ThemeCatalogItem>();

for (const theme of THEME_CATALOG) {
  for (const id of theme.keywordTmdbIds) {
    if (!THEME_BY_TMDB_ID.has(id)) {
      THEME_BY_TMDB_ID.set(id, theme);
    }
  }
  for (const name of theme.keywordNames) {
    const norm = name.trim().toLowerCase();
    if (!THEME_BY_KEYWORD_NAME.has(norm)) {
      THEME_BY_KEYWORD_NAME.set(norm, theme);
    }
  }
}

export function getThemeBySlug(slug: string): ThemeCatalogItem | null {
  return THEME_BY_SLUG.get(slug.toLowerCase()) || null;
}

export function matchMovieThemes(
  keywords: Array<{ keyword?: { tmdbId?: number | null; name?: string | null } | null }> | null | undefined,
  limit = 3,
): ThemeCatalogItem[] {
  if (!Array.isArray(keywords) || keywords.length === 0) return [];
  const seen = new Set<string>();
  const matched: ThemeCatalogItem[] = [];
  for (const entry of keywords) {
    const kw = entry?.keyword;
    if (!kw) continue;
    const hit =
      (typeof kw.tmdbId === 'number' ? THEME_BY_TMDB_ID.get(kw.tmdbId) : undefined) ||
      (kw.name ? THEME_BY_KEYWORD_NAME.get(kw.name.trim().toLowerCase()) : undefined);
    if (hit && !seen.has(hit.slug)) {
      seen.add(hit.slug);
      matched.push(hit);
      if (matched.length >= limit) break;
    }
  }
  return matched;
}

export function buildThemeFaqs(input: {
  theme: ThemeCatalogItem;
  total: number;
  highlights: string[];
}): MovieFaqItem[] {
  const topList = input.highlights.slice(0, 4).join(', ');
  return [
    {
      question: `How many ${input.theme.label.toLowerCase()} are available on MovieFlix?`,
      answer: `MovieFlix currently features ${input.total.toLocaleString('en-US')} verified ${input.theme.label.toLowerCase()} complete with official YouTube trailers, synopses, runtimes, ratings, and regional streaming options.`,
    },
    ...(topList
      ? [
          {
            question: `What are the top ${input.theme.label.toLowerCase()} to watch right now?`,
            answer: `Popular ${input.theme.label.toLowerCase()} trending on MovieFlix include ${topList}. Click any movie to watch its official trailer and see where it is streaming in the US, Europe, or Asia.`,
          },
        ]
      : []),
    {
      question: `How can I pick a ${input.theme.label.replace(/\s+movies$/i, '').toLowerCase()} movie to watch tonight?`,
      answer: `Browse this curated list ordered by global audience popularity, save favorites to your zero-login Watchlist, or try the MovieFlix What to Watch Tonight swipe picker to narrow down a movie solo or with a partner in 30 seconds.`,
    },
  ];
}
