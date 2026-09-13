'use client';

import * as React from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { ORIGIN_CATALOG, POPULAR_CATALOG } from '@/lib/public-catalog';

interface BrowseNavProps {
  genres: Array<{ id: string; name: string; slug: string }>;
  years: number[];
}

function isPathActive(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

interface NavDropdownProps {
  menu: string;
  label: string;
  active: boolean;
  openMenu: string | null;
  panelClassName: string;
  onToggle: (menu: string) => void;
  onClose: () => void;
  children: React.ReactNode;
}

function NavDropdown({
  menu,
  label,
  active,
  openMenu,
  panelClassName,
  onToggle,
  onClose,
  children,
}: NavDropdownProps) {
  const isOpen = openMenu === menu;
  const panelId = `browse-${menu}-menu`;

  const closeOnEscape = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Escape') return;
    onClose();
    event.currentTarget.querySelector<HTMLElement>(':focus')?.blur();
  };

  return (
    <div
      className="nav-dropdown relative"
      onKeyDown={closeOnEscape}
      onPointerLeave={(event) => {
        if (event.pointerType === 'mouse') onClose();
      }}
      data-active={active}
      data-state={isOpen ? 'open' : 'closed'}
    >
      <button
        type="button"
        className="nav-link inline-flex items-center gap-1"
        aria-haspopup="true"
        aria-controls={panelId}
        aria-expanded={isOpen}
        onClick={() => onToggle(menu)}
      >
        {label} <ChevronDown className="nav-dropdown-chevron h-3.5 w-3.5" />
      </button>
      <div id={panelId} className={`nav-dropdown-panel ${panelClassName}`}>
        {children}
      </div>
    </div>
  );
}

export function BrowseNav({ genres, years }: BrowseNavProps) {
  const pathname = usePathname();
  const navRef = React.useRef<HTMLElement>(null);
  const [openMenu, setOpenMenu] = React.useState<string | null>(null);

  React.useEffect(() => {
    const closeFromOutside = (event: PointerEvent) => {
      if (!navRef.current?.contains(event.target as Node)) setOpenMenu(null);
    };
    document.addEventListener('pointerdown', closeFromOutside);
    return () => document.removeEventListener('pointerdown', closeFromOutside);
  }, []);

  const toggleMenu = (menu: string) => {
    setOpenMenu((current) => (current === menu ? null : menu));
  };

  return (
    <nav
      ref={navRef}
      className="hidden items-center gap-0.5 lg:flex"
      aria-label="Primary navigation"
    >
      <Link
        href="/search"
        className="nav-link"
        aria-current={pathname === '/search' ? 'page' : undefined}
      >
        Movies
      </Link>

      <NavDropdown
        menu="genres"
        label="Genres"
        active={isPathActive(pathname, ['/genres', '/genre'])}
        openMenu={openMenu}
        panelClassName="left-0 w-[34rem]"
        onToggle={toggleMenu}
        onClose={() => setOpenMenu(null)}
      >
        <div className="nav-dropdown-surface">
          <div className="flex items-center justify-between px-3 pb-2 pt-1">
            <p className="nav-dropdown-label">Browse every genre</p>
            <Link
              href="/genres"
              onClick={() => setOpenMenu(null)}
              className="text-xs font-semibold text-primary hover:underline"
            >
              All genres
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {genres.map((genre) => (
              <Link
                key={genre.id}
                href={`/genre/${genre.slug}`}
                onClick={() => setOpenMenu(null)}
                className="nav-dropdown-item"
              >
                {genre.name}
              </Link>
            ))}
          </div>
        </div>
      </NavDropdown>

      <NavDropdown
        menu="popular"
        label="Popular"
        active={isPathActive(pathname, ['/popular'])}
        openMenu={openMenu}
        panelClassName="left-0 w-[17rem]"
        onToggle={toggleMenu}
        onClose={() => setOpenMenu(null)}
      >
        <div className="nav-dropdown-surface p-2">
          <p className="nav-dropdown-label px-3 pb-2 pt-1">Choose a ranking</p>
          {POPULAR_CATALOG.map((item) => (
            <Link
              key={item.slug}
              href={`/popular/${item.slug}`}
              onClick={() => setOpenMenu(null)}
              className="nav-dropdown-item block"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </NavDropdown>

      <NavDropdown
        menu="countries"
        label="Countries"
        active={isPathActive(pathname, ['/origin'])}
        openMenu={openMenu}
        panelClassName="left-1/2 w-[38rem] -translate-x-1/2"
        onToggle={toggleMenu}
        onClose={() => setOpenMenu(null)}
      >
        <div className="nav-dropdown-surface">
          <p className="nav-dropdown-label px-3 pb-2 pt-1">
            Production country or spoken language
          </p>
          <div className="grid grid-cols-2 gap-1">
            {ORIGIN_CATALOG.map((item) => (
              <Link
                key={item.slug}
                href={`/origin/${item.slug}`}
                onClick={() => setOpenMenu(null)}
                className="nav-dropdown-item"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </NavDropdown>

      <NavDropdown
        menu="years"
        label="Years"
        active={isPathActive(pathname, ['/year'])}
        openMenu={openMenu}
        panelClassName="right-0 w-[24rem]"
        onToggle={toggleMenu}
        onClose={() => setOpenMenu(null)}
      >
        <div className="nav-dropdown-surface">
          <p className="nav-dropdown-label px-3 pb-2 pt-1">Browse by release year</p>
          <div className="grid max-h-[22rem] grid-cols-4 gap-1 overflow-y-auto overscroll-contain pr-1">
            {years.map((year) => (
              <Link
                key={year}
                href={`/year/${year}`}
                onClick={() => setOpenMenu(null)}
                className="nav-dropdown-item text-center tabular-nums"
              >
                {year}
              </Link>
            ))}
          </div>
        </div>
      </NavDropdown>
    </nav>
  );
}
