import type { Metadata } from 'next';
import { PublicNotFound } from '@/components/public/PublicNotFound';

export const metadata: Metadata = {
  title: 'Person Not Found',
  robots: { index: false, follow: false },
};

export default function PersonNotFoundPage() {
  return <PublicNotFound />;
}
