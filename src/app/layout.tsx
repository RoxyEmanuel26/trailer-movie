import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { siteConfig } from '@/lib/site-config';

// Force dynamic to allow Next.js build to succeed in CI environments without a live database.
export const dynamic = 'force-dynamic';


const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const indexingEnabled = siteConfig.indexingEnabled;
  const googleVerification = siteConfig.googleVerification;
  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: `${siteConfig.name} — Discover movies, trailers and where to watch`,
      template: `%s | ${siteConfig.name}`,
    },
    description: siteConfig.description,
    applicationName: siteConfig.name,
    manifest: '/manifest.webmanifest',
    alternates: {
      types: {
        'application/rss+xml': [
          { url: '/feed.xml', title: `${siteConfig.name} Latest Movies & Trailers RSS` },
        ],
      },
    },
    icons: {
      icon: [
        { url: '/favicon.ico', sizes: 'any' },
        { url: '/brand/movieflix-mark.svg', type: 'image/svg+xml' },
      ],
      apple: [{ url: '/brand/movieflix-apple-touch-icon.png', sizes: '180x180' }],
    },
    robots: {
      index: indexingEnabled,
      follow: indexingEnabled,
      googleBot: {
        index: indexingEnabled,
        follow: indexingEnabled,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    verification: googleVerification ? { google: googleVerification } : undefined,
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <link rel="preconnect" href="https://image.tmdb.org" />
        <link rel="dns-prefetch" href="https://image.tmdb.org" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
