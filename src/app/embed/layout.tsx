import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0d0e0c] text-[#f8f4ec]">
      {children}
    </div>
  );
}
