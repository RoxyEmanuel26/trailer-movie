export interface TmdbMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  release_date: string; // YYYY-MM-DD
  runtime: number | null;
  poster_path: string | null;
  backdrop_path: string | null;
  status: string; // e.g., "Released", "Post Production"
  genres: TmdbGenre[];
  production_countries: TmdbCountry[];
  spoken_languages: TmdbLanguage[];
  production_companies: TmdbProductionCompany[];
}

export interface TmdbGenre {
  id: number;
  name: string;
}

export interface TmdbCountry {
  iso_3166_1: string;
  name: string;
}

export interface TmdbLanguage {
  iso_639_1: string;
  name: string;
}

export interface TmdbProductionCompany {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

export interface TmdbCredits {
  id: number;
  cast: TmdbCastMember[];
  crew: TmdbCrewMember[];
}

export interface TmdbCastMember {
  id: number;
  name: string;
  character: string;
  order: number;
  profile_path: string | null;
}

export interface TmdbCrewMember {
  id: number;
  name: string;
  job: string; // e.g., "Director", "Writer", "Producer"
  department: string;
  profile_path: string | null;
}

export interface TmdbPerson {
  id: number;
  name: string;
  biography: string;
  profile_path: string | null;
}

export interface TmdbVideos {
  id: number;
  results: TmdbVideoResult[];
}

export interface TmdbVideoResult {
  id: string;
  iso_639_1: string;
  iso_3166_1: string;
  name: string;
  key: string; // YouTube ID or similar
  site: string; // e.g., "YouTube"
  size: number;
  type: string; // e.g., "Trailer", "Teaser", "Clip", "Featurette"
  official: boolean;
  published_at: string;
}

export interface TmdbSearchResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}
