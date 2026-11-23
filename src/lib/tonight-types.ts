export type TonightRegionPreset =
  | 'global'
  | 'us'
  | 'europe'
  | 'asia'
  | 'korean'
  | 'japanese';

export interface TonightRegionOption {
  id: TonightRegionPreset;
  label: string;
  countryCodes: string[];
  languageCodes: string[];
}

export const TONIGHT_REGIONS: TonightRegionOption[] = [
  { id: 'global', label: 'Worldwide', countryCodes: [], languageCodes: [] },
  { id: 'us', label: 'US & Hollywood', countryCodes: ['US', 'CA'], languageCodes: ['en'] },
  {
    id: 'europe',
    label: 'European Cinema',
    countryCodes: ['GB', 'FR', 'DE', 'ES', 'IT', 'SE', 'NO', 'DK', 'BE', 'NL', 'IE', 'PL'],
    languageCodes: [],
  },
  {
    id: 'asia',
    label: 'Asian Cinema',
    countryCodes: ['JP', 'KR', 'IN', 'ID', 'HK', 'TW', 'TH', 'PH', 'CN'],
    languageCodes: [],
  },
  { id: 'korean', label: 'Korean', countryCodes: ['KR'], languageCodes: ['ko'] },
  { id: 'japanese', label: 'Japanese & Anime', countryCodes: ['JP'], languageCodes: ['ja'] },
];

export const TONIGHT_MOODS = [
  { id: 'any', label: 'Any Mood', genreSlugs: [] as string[] },
  { id: 'adrenaline', label: 'Adrenaline & Action', genreSlugs: ['action', 'adventure'] },
  { id: 'mind-bending', label: 'Mind-Bending Sci-Fi', genreSlugs: ['science-fiction', 'mystery'] },
  { id: 'edge-of-seat', label: 'Edge-of-Seat Thriller', genreSlugs: ['thriller', 'crime'] },
  { id: 'scare-night', label: 'Horror & Scare Night', genreSlugs: ['horror'] },
  { id: 'feel-good', label: 'Feel-Good & Comedy', genreSlugs: ['comedy', 'family'] },
  { id: 'date-night', label: 'Date Night & Romance', genreSlugs: ['romance', 'drama'] },
  { id: 'animated', label: 'Animation & Fantasy', genreSlugs: ['animation', 'fantasy'] },
] as const;

export const TONIGHT_STREAMING_FILTERS = [
  { id: 'any', label: 'Any Platform', tmdbIds: [] as number[] },
  { id: 'netflix', label: 'Netflix', tmdbIds: [8, 175, 1796] },
  { id: 'prime-video', label: 'Prime Video', tmdbIds: [9, 10, 119, 613, 2100] },
  { id: 'disney-plus', label: 'Disney+', tmdbIds: [337, 122] },
  { id: 'apple-tv', label: 'Apple TV', tmdbIds: [350, 2] },
  { id: 'max', label: 'Max', tmdbIds: [1899, 425] },
  { id: 'hulu', label: 'Hulu', tmdbIds: [15] },
  { id: 'sky', label: 'Sky', tmdbIds: [130, 29, 30, 39] },
  { id: 'rakuten-tv', label: 'Rakuten TV', tmdbIds: [35] },
  { id: 'canal-plus', label: 'CANAL+', tmdbIds: [58, 381] },
  { id: 'mubi', label: 'MUBI', tmdbIds: [11] },
  { id: 'crunchyroll', label: 'Crunchyroll', tmdbIds: [283] },
  { id: 'viu', label: 'Viu', tmdbIds: [158] },
  { id: 'vidio', label: 'Vidio', tmdbIds: [489] },
] as const;

export interface TonightMovieCard {
  id: string;
  tmdbId: number | null;
  title: string;
  slug: string;
  synopsis: string | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  releaseYear: number | null;
  runtimeMinutes: number | null;
  voteAverage: number | null;
  youtubeTrailerId: string | null;
  genres: string[];
  providers: string[];
}

export interface TonightRoomState {
  code: string;
  createdAt: number;
  deck: TonightMovieCard[];
  hostLikes: string[];
  hostPasses: string[];
  guestLikes: string[];
  guestPasses: string[];
  guestJoined: boolean;
}

export function normalizeRoomCode(raw: string): string | null {
  const cleaned = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!/^[A-Z0-9]{6}$/.test(cleaned)) return null;
  return cleaned;
}

export function computeRoomMatches(room: TonightRoomState): TonightMovieCard[] {
  const guestLikeSet = new Set(room.guestLikes);
  const matchedIds = new Set(room.hostLikes.filter((id) => guestLikeSet.has(id)));
  return room.deck.filter((movie) => matchedIds.has(movie.id));
}
