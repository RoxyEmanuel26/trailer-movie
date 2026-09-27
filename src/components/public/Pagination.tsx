'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

type PageItem = number | 'ellipsis';

interface PaginationProps {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  className?: string;
}

export function Pagination({
  totalItems,
  itemsPerPage,
  currentPage,
  className = '',
}: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) return null;

  const createPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (pageNumber === 1) params.delete('page');
    else params.set('page', pageNumber.toString());
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  const getPageNumbers = (): PageItem[] => {
    const pages: PageItem[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, 'ellipsis', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, 'ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages);
      }
    }
    return pages;
  };

  const getMobilePageNumbers = () => {
    if (totalPages <= 3) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const start = Math.min(Math.max(currentPage - 1, 1), totalPages - 2);
    return [start, start + 1, start + 2];
  };

  const previousButton = currentPage === 1 ? (
    <Button
      variant="ghost"
      disabled
      aria-label="Previous page"
      className="h-11 min-w-11 gap-1.5 rounded-xl px-0 sm:px-3"
    >
      <ChevronLeft className="h-4 w-4" />
      <span className="hidden sm:inline">Previous</span>
    </Button>
  ) : (
    <Button variant="ghost" asChild className="h-11 min-w-11 gap-1.5 rounded-xl px-0 sm:px-3">
      <Link href={createPageUrl(currentPage - 1)} aria-label="Previous page">
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Previous</span>
      </Link>
    </Button>
  );

  const nextButton = currentPage === totalPages ? (
    <Button
      variant="ghost"
      disabled
      aria-label="Next page"
      className="h-11 min-w-11 gap-1.5 rounded-xl px-0 sm:px-3"
    >
      <span className="hidden sm:inline">Next</span>
      <ChevronRight className="h-4 w-4" />
    </Button>
  ) : (
    <Button variant="ghost" asChild className="h-11 min-w-11 gap-1.5 rounded-xl px-0 sm:px-3">
      <Link href={createPageUrl(currentPage + 1)} aria-label="Next page">
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="h-4 w-4" />
      </Link>
    </Button>
  );

  return (
    <nav
      aria-label="Pagination"
      className={`flex flex-col items-center justify-center gap-3 ${className}`}
    >
      <p className="text-xs font-medium tabular-nums text-muted-foreground sm:text-sm">
        Page <span className="font-semibold text-foreground">{currentPage}</span> of{' '}
        <span className="font-semibold text-foreground">{totalPages}</span>
      </p>

      <div className="inline-flex max-w-full items-center gap-1 rounded-2xl border bg-card/90 p-1.5 shadow-sm">
        {previousButton}

        <div className="flex items-center gap-1 sm:hidden">
          {getMobilePageNumbers().map((page) => {
            const isCurrent = page === currentPage;
            return (
              <Button
                key={`mobile-page-${page}`}
                variant={isCurrent ? 'default' : 'ghost'}
                size="icon"
                className="h-11 w-11 rounded-xl tabular-nums"
                asChild
              >
                <Link
                  href={createPageUrl(page)}
                  aria-label={`Page ${page}`}
                  aria-current={isCurrent ? 'page' : undefined}
                >
                  {page}
                </Link>
              </Button>
            );
          })}
        </div>

        <div className="hidden items-center gap-1 sm:flex">
          {getPageNumbers().map((page, index) => {
            if (page === 'ellipsis') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="flex h-11 w-8 items-center justify-center text-muted-foreground"
                  aria-hidden="true"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </span>
              );
            }

            const isCurrent = page === currentPage;
            return (
              <Button
                key={`page-${page}`}
                variant={isCurrent ? 'default' : 'ghost'}
                size="icon"
                className="h-11 w-11 rounded-xl tabular-nums"
                asChild
              >
                <Link
                  href={createPageUrl(page)}
                  aria-label={`Page ${page}`}
                  aria-current={isCurrent ? 'page' : undefined}
                >
                  {page}
                </Link>
              </Button>
            );
          })}
        </div>

        {nextButton}
      </div>
    </nav>
  );
}
