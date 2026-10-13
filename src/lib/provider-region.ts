export function providerRegionCodes(links: Array<{ countryCode?: string | null }> = []) {
  return [...new Set(links.map((link) => link.countryCode || '').filter((code) => /^[A-Z]{2}$/.test(code)))].sort();
}

export function providerRegion(codes: string[], preferred: string) {
  return codes.includes(preferred) ? preferred : codes.includes('US') ? 'US' : codes.includes('GB') ? 'GB' : codes[0] || '';
}
