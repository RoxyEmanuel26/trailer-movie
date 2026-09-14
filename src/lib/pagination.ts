export function parseStrictPage(value: string | string[] | undefined) {
  if (value === undefined) return 1;
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) return null;
  const page = Number(value);
  return Number.isSafeInteger(page) ? page : null;
}

export function pagePath(path: string, page: number) {
  return page > 1 ? `${path}?page=${page}` : path;
}

export function isPageOutOfRange(page: number, total: number, pageSize: number) {
  return page > 1 && page > Math.max(1, Math.ceil(total / pageSize));
}
