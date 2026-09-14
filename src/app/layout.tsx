import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { siteConfig } from '@/lib/site-config';

// Force dynamic to allow Next.js build to succeed in CI environments without a live database.


const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: 'MovieFlix — Discover movies, trailers and where to watch',
    template: '%s | MovieFlix',
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/brand/movieflix-mark.svg', type: 'image/svg+xml' },
    ],
    apple: [{ url: '/brand/movieflix-apple-touch-icon.png', sizes: '180x180' }],
  },
  robots: {
    index: siteConfig.indexingEnabled,
    follow: siteConfig.indexingEnabled,
  },
  verification: siteConfig.googleVerification
    ? { google: siteConfig.googleVerification }
    : undefined,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
