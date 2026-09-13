interface Env {
  PAGES_BASE_URL: string;
  CRON_SECRET: string;
}

async function triggerImport(env: Env) {
  const endpoint = new URL('/api/admin/cron/process-imports', env.PAGES_BASE_URL).toString();
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { authorization: `Bearer ${env.CRON_SECRET}`, accept: 'application/json' },
    signal: AbortSignal.timeout(240_000),
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`Import endpoint returned ${response.status}: ${body.slice(0, 500)}`);
  console.log('Import cron completed', body);
}

const worker = {
  async scheduled(_controller: unknown, env: Env, context: { waitUntil(promise: Promise<unknown>): void }) {
    context.waitUntil(triggerImport(env));
  },
};

export default worker;
