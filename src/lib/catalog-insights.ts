interface CatalogStats {
  earliestYear: number | null;
  latestYear: number | null;
  dominantGenres: Array<{ name: string; count: number }>;
  highlights: Array<{ title: string }>;
}

export function catalogInsightFacts(
  stats: CatalogStats,
  highlightedTitles?: string[]
) {
  const facts: Array<{ label: string; value: string }> = [];
  if (stats.earliestYear && stats.latestYear) {
    facts.push({
      label: 'Release range',
      value: stats.earliestYear === stats.latestYear
        ? String(stats.latestYear)
        : `${stats.earliestYear}–${stats.latestYear}`,
    });
  }
  if (stats.dominantGenres.length) {
    facts.push({
      label: 'Leading genres',
      value: stats.dominantGenres.map((genre) => genre.name).join(', '),
    });
  }
  const titles = highlightedTitles?.length
    ? highlightedTitles
    : stats.highlights.map((movie) => movie.title);
  if (titles.length) {
    facts.push({ label: 'Catalog highlights', value: titles.slice(0, 3).join(', ') });
  }
  return facts;
}
