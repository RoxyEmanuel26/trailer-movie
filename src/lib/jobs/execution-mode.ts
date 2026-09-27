export function isLocalImportMode(env: Record<string, string | undefined> = process.env) {
  return env.IMPORT_EXECUTION_MODE === 'local';
}
