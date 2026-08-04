'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaginationProps {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  className?: string;
}

export function Pagination({ totalItems, itemsPerPage, currentPage, className = '' }: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) return null;

  const createPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className={`flex flex-wrap items-center justify-center gap-2 ${className}`}>
      <Button
        variant="outline"
        size="icon"
        asChild
        disabled={currentPage === 1}
        className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
      >
        <Link href={createPageUrl(currentPage - 1)} aria-label="Previous Page">
          <ChevronLeft className="h-4 w-4" />
        </Link>
      </Button>

      {getPageNumbers().map((page, index) => {
        if (page === '...') {
          return (
            <Button key={`ellipsis-${index}`} variant="ghost" size="icon" disabled>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          );
        }

        const isCurrent = page === currentPage;
        return (
          <Button
            key={`page-${page}`}
            variant={isCurrent ? 'default' : 'outline'}
            size="icon"
            asChild
          >
            <Link href={createPageUrl(page as number)} aria-label={`Page ${page}`} aria-current={isCurrent ? 'page' : undefined}>
              {page}
            </Link>
          </Button>
        );
      })}

      <Button
        variant="outline"
        size="icon"
        asChild
        disabled={currentPage === totalPages}
        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
      >
        <Link href={createPageUrl(currentPage + 1)} aria-label="Next Page">
          <ChevronRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
