import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Building2, Globe2 } from 'lucide-react';
import { matchMovieStudios } from '@/lib/studio-catalog';
import { matchMovieThemes } from '@/lib/theme-catalog';

function formatCurrency(amount: any) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

function toSafeExternalUrl(raw?: string | null): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
  } catch {
    return null;
  }
  return null;
}

export function MovieExtraInfo({
  budget,
  revenue,
  ageRating,
  companies,
  keywords,
  countries,
  languages,
  homepage,
}: {
  budget: any;
  revenue: any;
  ageRating: string | null;
  companies: any[];
  keywords: any[];
  countries?: any[];
  languages?: any[];
  homepage?: string | null;
}) {
  const certification = ageRating || 'NR';
  const safeHomepage = toSafeExternalUrl(homepage);
  const safeCompanies = Array.isArray(companies) ? companies : [];
  const safeKeywords = Array.isArray(keywords) ? keywords : [];

  return (
    <div className="flex flex-col gap-6 mt-6">
      <div className="cinema-panel rounded-2xl p-5">
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Production details
        </h3>

        <dl className="space-y-4 text-sm">
          {Number(budget) > 0 ? (
            <div className="flex flex-col">
              <dt className="text-muted-foreground flex items-center gap-1">
                <DollarSign className="w-3 h-3" /> Budget
              </dt>
              <dd className="font-medium text-base">{formatCurrency(budget)}</dd>
            </div>
          ) : null}
          {countries && countries.length > 0 ? (
            <div className="flex flex-col">
              <dt className="text-muted-foreground">Countries</dt>
              <dd className="font-medium">
                {countries.map((item) => item.country?.name || item.name).join(', ')}
              </dd>
            </div>
          ) : null}
          {languages && languages.length > 0 ? (
            <div className="flex flex-col">
              <dt className="text-muted-foreground">Languages</dt>
              <dd className="font-medium">
                {languages.map((item) => item.language?.name || item.name).join(', ')}
              </dd>
            </div>
          ) : null}

          {Number(revenue) > 0 ? (
            <div className="flex flex-col">
              <dt className="text-muted-foreground flex items-center gap-1">
                <DollarSign className="w-3 h-3" /> Box office revenue
              </dt>
              <dd className="font-medium text-base">{formatCurrency(revenue)}</dd>
            </div>
          ) : null}
          {safeHomepage ? (
            <div className="flex flex-wrap gap-3 pt-1">
              <a
                href={safeHomepage}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                <Globe2 className="h-3.5 w-3.5" />
                Official movie site
              </a>
            </div>
          ) : null}

          <div className="flex flex-col">
            <dt className="text-muted-foreground">Age Rating (US)</dt>
            <dd className="font-medium mt-1">
              <Badge variant="outline" className="font-bold">
                {certification}
              </Badge>
            </dd>
          </div>
        </dl>
      </div>

      {safeCompanies.length > 0 && (
        <div className="cinema-panel rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Studios
          </h3>
          <div className="flex flex-col gap-4">
            {safeCompanies.map((mc: any, idx: number) => {
              const company = mc.company || mc;
              const matchedStudio = matchMovieStudios([{ company }], 1)[0] || null;
              const logoNode = company.logoUrl || company.logo_path ? (
                <div className="relative w-10 h-10 bg-white rounded-md p-1 border shrink-0">
                  <Image
                    src={
                      company.logoUrl || `https://image.tmdb.org/t/p/w92${company.logo_path}`
                    }
                    alt={company.name}
                    fill
                    sizes="40px"
                    className="object-contain p-1"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 bg-muted flex items-center justify-center rounded-md border shrink-0">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                </div>
              );
              const key = company.id
                ? `${company.id}-${idx}`
                : company.name
                  ? `${company.name}-${idx}`
                  : idx;

              if (matchedStudio) {
                return (
                  <Link
                    key={key}
                    href={`/studio/${matchedStudio.slug}`}
                    prefetch={false}
                    className="group flex items-center gap-3 rounded-lg transition-colors hover:text-primary"
                  >
                    {logoNode}
                    <span className="text-sm font-medium group-hover:underline">{company.name}</span>
                  </Link>
                );
              }

              return (
                <div key={key} className="flex items-center gap-3">
                  {logoNode}
                  <span className="text-sm font-medium">{company.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {safeKeywords.length > 0 && (
        <div className="cinema-panel rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Keywords
          </h3>
          <div className="flex flex-wrap gap-2">
            {safeKeywords.map((mk: any, idx: number) => {
              const k = mk.keyword || mk;
              const matchedTheme = matchMovieThemes([{ keyword: k }], 1)[0] || null;
              const key = k.id ? `${k.id}-${idx}` : k.name ? `${k.name}-${idx}` : idx;

              if (matchedTheme) {
                return (
                  <Link key={key} href={`/theme/${matchedTheme.slug}`} prefetch={false}>
                    <Badge
                      variant="secondary"
                      className="font-medium text-xs transition-colors hover:bg-primary hover:text-primary-foreground"
                    >
                      {k.name}
                    </Badge>
                  </Link>
                );
              }

              return (
                <Badge
                  key={key}
                  variant="secondary"
                  className="font-normal text-xs"
                >
                  {k.name}
                </Badge>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function MovieExtraInfoSkeleton() {
  return (
    <div className="flex flex-col gap-6 mt-6 animate-pulse">
      <div className="bg-card p-6 rounded-xl border h-48"></div>
      <div className="bg-card p-6 rounded-xl border h-32"></div>
    </div>
  );
}
