export function databaseConnectionTimeout(value: string | undefined, fallback = 8_000) {
  const milliseconds = Number(value);
  return Number.isSafeInteger(milliseconds) && milliseconds >= 1_000 && milliseconds <= 60_000
    ? milliseconds
    : fallback;
}
