'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';

interface ResponsiveDetailsProps {
  children: React.ReactNode;
  label?: string;
  className?: string;
}

export function ResponsiveDetails({
  children,
  label = 'More details',
  className = '',
}: ResponsiveDetailsProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const isDesktop = React.useSyncExternalStore(
    subscribeToDesktopViewport,
    () => window.matchMedia('(min-width: 768px)').matches,
    () => false
  );

  return (
    <details
      open={isDesktop || isOpen}
      onToggle={(event) => {
        if (!isDesktop) setIsOpen(event.currentTarget.open);
      }}
      className={`group/responsive-details ${className}`}
    >
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between rounded-xl border bg-card px-4 py-3 text-sm font-semibold transition-colors hover:bg-muted/60 active:bg-muted md:hidden [&::-webkit-details-marker]:hidden">
        {label}
        <ChevronDown className="h-4 w-4 transition-transform duration-200 group-open/responsive-details:rotate-180" />
      </summary>
      <div className="pt-3 md:pt-0">{children}</div>
    </details>
  );
}

function subscribeToDesktopViewport(callback: () => void) {
  const mediaQuery = window.matchMedia('(min-width: 768px)');
  mediaQuery.addEventListener('change', callback);
  return () => mediaQuery.removeEventListener('change', callback);
}
