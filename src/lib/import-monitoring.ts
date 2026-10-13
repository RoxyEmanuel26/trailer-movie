import { isTransientDatabaseError } from './database-errors';

/** A failed read is unknown, never a successful empty queue. */
export async function readImportMonitoring<T>(load: () => Promise<T>): Promise<T | null> {
  try {
    return await load();
  } catch (error) {
    if (!isTransientDatabaseError(error)) throw error;
    return null;
  }
}
