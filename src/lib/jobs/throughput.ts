export type ImportThroughput = {
  movieBatchSize: number;
  personBatchSize: number;
  movieConcurrency: number;
  personConcurrency: number;
};

function boundedInteger(value: string | undefined, fallback: number, maximum: number) {
  if (!value || !/^[1-9]\d*$/.test(value)) return fallback;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? Math.min(parsed, maximum) : fallback;
}

export function getImportThroughput(env: Record<string, string | undefined> = process.env): ImportThroughput {
  const movieBatchSize = boundedInteger(env.IMPORT_MOVIE_BATCH_SIZE, 20, 20);
  const personBatchSize = boundedInteger(env.IMPORT_PERSON_BATCH_SIZE, 40, 40);
  return {
    movieBatchSize,
    personBatchSize,
    movieConcurrency: Math.min(movieBatchSize, boundedInteger(env.IMPORT_MOVIE_CONCURRENCY, 4, 10)),
    personConcurrency: Math.min(personBatchSize, boundedInteger(env.IMPORT_PERSON_CONCURRENCY, 8, 20)),
  };
}

export async function runBounded<T>(items: readonly T[], concurrency: number, run: (item: T) => Promise<void>) {
  let cursor = 0;
  const results: PromiseSettledResult<void>[] = new Array(items.length);
  const worker = async () => {
    while (cursor < items.length) {
      const index = cursor++;
      try {
        await run(items[index]);
        results[index] = { status: 'fulfilled', value: undefined };
      } catch (reason) {
        results[index] = { status: 'rejected', reason };
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(items.length, Math.max(1, concurrency)) }, worker));
  return results;
}
