import React from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from 'sonner';
import { Navbar } from '@/components/public/Navbar';
import { Footer } from '@/components/public/Footer';
import { AnalyticsTracker } from '@/components/public/AnalyticsTracker';
import { WebVitalsTracker } from '@/components/public/WebVitalsTracker';
import { AnalyticsConsentProvider } from '@/components/public/AnalyticsConsentProvider';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AnalyticsConsentProvider>
        <a href="#main-content" className="skip-link">Skip to content</a>
        <div className="site-shell relative flex min-h-screen flex-col bg-background text-foreground">
          <AnalyticsTracker />
          <WebVitalsTracker />
          <Navbar />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
        <Toaster />
      </AnalyticsConsentProvider>
    </ThemeProvider>
  );
}
