/** Keep a single page render from occupying the entire database connection pool. */
export async function runBoundedQueries<T extends readonly unknown[]>(
  tasks: { readonly [K in keyof T]: () => Promise<T[K]> },
  concurrency: number,
): Promise<T> {
  const results: unknown[] = new Array(tasks.length);
  let next = 0;
  let failure: unknown;
  let failed = false;
  const workers = Array.from({ length: Math.min(Math.max(1, concurrency), tasks.length) }, async () => {
    while (!failed && next < tasks.length) {
      const index = next++;
      try {
        results[index] = await tasks[index]();
      } catch (error) {
        if (!failed) failure = error;
        failed = true;
      }
    }
  });
  await Promise.all(workers);
  if (failed) throw failure;
  return results as unknown as T;
}
