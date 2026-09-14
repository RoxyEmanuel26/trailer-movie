import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MovieFlix',
    short_name: 'MovieFlix',
    description: 'Discover movies, trailers, cast, crew, and where to watch.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0d0e0c',
    theme_color: '#e65335',
    icons: [
      { src: '/brand/movieflix-mark.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/brand/movieflix-icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/brand/movieflix-icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
