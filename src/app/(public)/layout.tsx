import React from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from 'sonner';
import { Navbar } from '@/components/public/Navbar';
import { Footer } from '@/components/public/Footer';

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
      <div className="relative flex min-h-screen flex-col bg-background text-foreground">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </div>
      <Toaster />
    </ThemeProvider>
  );
}
