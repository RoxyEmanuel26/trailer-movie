import * as React from 'react';
import Link from 'next/link';
import { LayoutDashboard, Film, Search, Activity, DownloadCloud, AlertTriangle } from 'lucide-react';

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  const tabs = [
    { name: 'Overview', href: '/admin/analytics', icon: LayoutDashboard },
    { name: 'Movies', href: '/admin/analytics/movies', icon: Film },
    { name: 'Search', href: '/admin/analytics/search', icon: Search },
    { name: 'Activity', href: '/admin/analytics/activity', icon: Activity },
    { name: 'Imports', href: '/admin/analytics/imports', icon: DownloadCloud },
    { name: 'Errors', href: '/admin/analytics/errors', icon: AlertTriangle },
  ];

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Analytics & Monitoring</h1>
      </div>

      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className="group inline-flex items-center border-b-2 border-transparent py-4 px-1 text-sm font-medium text-muted-foreground hover:border-border hover:text-foreground"
              >
                <Icon className="mr-2 h-4 w-4" aria-hidden="true" />
                <span>{tab.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-4">{children}</div>
    </div>
  );
}
