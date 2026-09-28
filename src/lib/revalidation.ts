const PUBLIC_PATH_PREFIXES = [
  '/watch/', '/person/', '/genre/', '/origin/', '/year/', '/popular/', '/tag/', '/collection/',
] as const;

export function isAllowedRevalidationPath(path: string) {
  if (!path.startsWith('/') || path.includes('?') || path.includes('#') || path.includes('\\')) return false;
  if (path.includes('//') || path.split('/').some((segment) => segment === '..' || segment === '.')) return false;
  return PUBLIC_PATH_PREFIXES.some((prefix) => path.startsWith(prefix) && path.length > prefix.length);
}

export function hasValidRevalidationSecret(request: Request) {
  const expected = process.env.REVALIDATION_SECRET;
  const authorization = request.headers.get('authorization') || '';
  const received = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!expected || !received) return false;
  const left = Buffer.from(received);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}
import { timingSafeEqual } from 'node:crypto';
