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
    icons: [{ src: '/favicon.ico', sizes: 'any', type: 'image/x-icon' }],
  };
}
