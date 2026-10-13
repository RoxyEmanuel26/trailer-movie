import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { isTransientDatabaseError } from './database-errors';

const MAX_SNAPSHOT_AGE_MS = 24 * 60 * 60 * 1_000;

function snapshotPath(key: string) {
  if (!/^[a-z0-9-]+$/.test(key)) throw new Error('Invalid public snapshot key');
  const root = process.env.SITEMAP_CACHE_DIR?.trim() || path.join(process.cwd(), '.cache', 'sitemaps');
  return path.resolve(root, 'public-data', `${key}.json`);
}

function reviveDates(key: string, value: unknown) {
  if (typeof value === 'string' && /(Date|At)$/.test(key) && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return value;
}

export async function readPublicSnapshot<T>(key: string, isValid: (value: unknown) => value is T): Promise<T | null> {
  try {
    const envelope = JSON.parse(await readFile(snapshotPath(key), 'utf8'), reviveDates);
    const age = Date.now() - new Date(envelope.savedAt).getTime();
    if (envelope.version !== 1 || !Number.isFinite(age) || age < -60_000 || age > MAX_SNAPSHOT_AGE_MS) return null;
    return isValid(envelope.data) ? envelope.data : null;
  } catch {
    return null;
  }
}

export async function writePublicSnapshot<T>(key: string, data: T) {
  const target = snapshotPath(key);
  await mkdir(path.dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, JSON.stringify({ version: 1, savedAt: new Date(), data }), { encoding: 'utf8', flag: 'wx' });
    await rename(temporary, target);
  } finally {
    await unlink(temporary).catch(() => undefined);
  }
}

export async function loadPublicDataWithSnapshot<T>(
  key: string,
  load: () => Promise<T>,
  isValid: (value: unknown) => value is T,
): Promise<{ data: T; source: 'live' | 'snapshot' }> {
  try {
    const data = await load();
    // An unwritable cache directory must never turn a healthy database read into a 500.
    await writePublicSnapshot(key, data).catch(() => undefined);
    return { data, source: 'live' };
  } catch (error) {
    if (!isTransientDatabaseError(error)) throw error;
    const data = await readPublicSnapshot(key, isValid);
    if (!data) throw error;
    return { data, source: 'snapshot' };
  }
}
