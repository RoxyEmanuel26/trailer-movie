import Link from 'next/link';
import { Film } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t bg-muted/40 py-12">
      <div className="container mx-auto px-4 grid gap-8 grid-cols-1 md:grid-cols-4">
        <div className="flex flex-col gap-4">
          <Link href="/" className="flex items-center space-x-2">
            <Film className="h-6 w-6" />
            <span className="font-bold text-lg">TrailerTube</span>
          </Link>
          <p className="text-sm text-muted-foreground">
            The ultimate destination for premium movie trailers, exclusive sneak peeks, and cinematic experiences.
          </p>
        </div>
        
        <div>
          <h3 className="font-semibold mb-4 text-sm">Discover</h3>
          <ul className="flex flex-col space-y-2 text-sm text-muted-foreground">
            <li><Link href="/search?status=PUBLISHED" className="hover:text-foreground">All Movies</Link></li>
            <li><Link href="/genre/action" className="hover:text-foreground">Action Movies</Link></li>
            <li><Link href="/genre/sci-fi" className="hover:text-foreground">Sci-Fi</Link></li>
            <li><Link href="/search" className="hover:text-foreground">Advanced Search</Link></li>
          </ul>
        </div>
        
        <div>
          <h3 className="font-semibold mb-4 text-sm">Legal</h3>
          <ul className="flex flex-col space-y-2 text-sm text-muted-foreground">
            <li><Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:text-foreground">Terms of Service</Link></li>
            <li><Link href="/dmca" className="hover:text-foreground">DMCA</Link></li>
          </ul>
        </div>
        
        <div>
          <h3 className="font-semibold mb-4 text-sm">Connect</h3>
          <ul className="flex flex-col space-y-2 text-sm text-muted-foreground">
            <li><Link href="/contact" className="hover:text-foreground">Contact Us</Link></li>
            <li><a href="/feed.xml" target="_blank" className="hover:text-foreground">RSS Feed</a></li>
            <li><Link href="/sitemap.xml" className="hover:text-foreground">Sitemap</Link></li>
          </ul>
        </div>
      </div>
      
      <div className="container mx-auto px-4 mt-12 pt-8 border-t flex flex-col md:flex-row items-center justify-between text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} TrailerTube. All rights reserved.</p>
        <p className="mt-2 md:mt-0">Data provided by TMDB.</p>
      </div>
    </footer>
  );
}
