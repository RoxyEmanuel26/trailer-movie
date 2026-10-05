import { timingSafeEqual } from 'node:crypto';

export const ORIGIN_GATE_HEADER = 'x-movieflix-origin-token';

export function hasValidOriginToken(headers: Headers, secret: string | undefined): boolean {
  if (!secret || secret.length < 32) return false;
  const supplied = headers.get(ORIGIN_GATE_HEADER);
  if (!supplied) return false;
  const expectedBytes = Buffer.from(secret);
  const suppliedBytes = Buffer.from(supplied);
  return suppliedBytes.length === expectedBytes.length && timingSafeEqual(suppliedBytes, expectedBytes);
}
