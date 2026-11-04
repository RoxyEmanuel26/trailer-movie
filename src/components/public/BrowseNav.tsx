'use client';

import * as React from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { ORIGIN_CATALOG, POPULAR_CATALOG } from '@/lib/public-catalog';
import { STREAMING_CATALOG } from '@/lib/streaming-catalog';

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
  onOpen: (menu: string) => void;
  onToggle: (menu: string) => void;
  onClose: (delay?: number) => void;
  children: React.ReactNode;
}

function NavDropdown({
  menu,
  label,
  active,
  openMenu,
  panelClassName,
  onOpen,
  onToggle,
  onClose,
  children,
}: NavDropdownProps) {
  const isOpen = openMenu === menu;
  const panelId = `browse-${menu}-menu`;

  const closeOnEscape = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Escape') return;
    onClose(0);
    event.currentTarget.querySelector<HTMLElement>(':focus')?.blur();
  };

  return (
    <div
      className="nav-dropdown relative"
      onKeyDown={closeOnEscape}
      onPointerEnter={(e) => {
        if (e.pointerType !== 'touch') onOpen(menu);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType !== 'touch') onClose(180);
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
      <div
        id={panelId}
        className={`nav-dropdown-panel ${panelClassName}`}
        aria-hidden={!isOpen}
      >
        {children}
      </div>
    </div>
  );
}

export function BrowseNav({ genres, years }: BrowseNavProps) {
  const pathname = usePathname();
  const navRef = React.useRef<HTMLElement>(null);
  const [openMenu, setOpenMenu] = React.useState<string | null>(null);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const clearTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleOpen = (menu: string) => {
    clearTimer();
    setOpenMenu(menu);
  };

  const handleClose = (delay = 180) => {
    clearTimer();
    if (delay === 0) {
      setOpenMenu(null);
    } else {
      timeoutRef.current = setTimeout(() => {
        setOpenMenu(null);
      }, delay);
    }
  };

  const handleToggle = (menu: string) => {
    clearTimer();
    setOpenMenu((current) => (current === menu ? null : menu));
  };

  // Close immediately on page navigation without useEffect setState
  const [prevPathname, setPrevPathname] = React.useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setOpenMenu(null);
  }

  // Close when clicking outside nav
  React.useEffect(() => {
    const closeFromOutside = (event: PointerEvent) => {
      if (!navRef.current?.contains(event.target as Node)) {
        clearTimer();
        setOpenMenu(null);
      }
    };
    document.addEventListener('pointerdown', closeFromOutside);
    return () => {
      document.removeEventListener('pointerdown', closeFromOutside);
      clearTimer();
    };
  }, []);

  return (
    <nav
      ref={navRef}
      className="hidden items-center gap-0.5 lg:flex"
      aria-label="Primary navigation"
      onPointerLeave={() => handleClose(180)}
    >
      <Link
        href="/movies"
        prefetch={false}
        className="nav-link"
        aria-current={pathname === '/movies' ? 'page' : undefined}
        onPointerEnter={() => handleClose(0)}
      >
        Movies
      </Link>

      <NavDropdown
        menu="genres"
        label="Genres"
        active={isPathActive(pathname, ['/genres', '/genre'])}
        openMenu={openMenu}
        panelClassName="left-0 w-[34rem]"
        onOpen={handleOpen}
        onToggle={handleToggle}
        onClose={handleClose}
      >
        <div className="nav-dropdown-surface">
          <div className="flex items-center justify-between px-3 pb-2 pt-1">
            <p className="nav-dropdown-label">Browse every genre</p>
            <Link
              href="/genres"
              prefetch={false}
              onClick={() => handleClose(0)}
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
                prefetch={false}
                onClick={() => handleClose(0)}
                className="nav-dropdown-item"
              >
                {genre.name}
              </Link>
            ))}
          </div>
        </div>
      </NavDropdown>

      <NavDropdown
        menu="streaming"
        label="Streaming"
        active={isPathActive(pathname, ['/streaming'])}
        openMenu={openMenu}
        panelClassName="left-0 w-[30rem]"
        onOpen={handleOpen}
        onToggle={handleToggle}
        onClose={handleClose}
      >
        <div className="nav-dropdown-surface">
          <div className="flex items-center justify-between px-3 pb-2 pt-1">
            <p className="nav-dropdown-label">Where to watch</p>
            <Link
              href="/streaming"
              prefetch={false}
              onClick={() => handleClose(0)}
              className="text-xs font-semibold text-primary hover:underline"
            >
              All services
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-1">
            {STREAMING_CATALOG.map((item) => (
              <Link
                key={item.slug}
                href={`/streaming/${item.slug}`}
                prefetch={false}
                onClick={() => handleClose(0)}
                className="nav-dropdown-item"
              >
                {item.label}
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
        onOpen={handleOpen}
        onToggle={handleToggle}
        onClose={handleClose}
      >
        <div className="nav-dropdown-surface p-2">
          <div className="flex items-center justify-between px-3 pb-2 pt-1">
            <p className="nav-dropdown-label">Choose a ranking</p>
            <Link
              href="/popular"
              prefetch={false}
              onClick={() => handleClose(0)}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Overview
            </Link>
          </div>
          {POPULAR_CATALOG.map((item) => (
            <Link
              key={item.slug}
              href={`/popular/${item.slug}`}
              prefetch={false}
              onClick={() => handleClose(0)}
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
        onOpen={handleOpen}
        onToggle={handleToggle}
        onClose={handleClose}
      >
        <div className="nav-dropdown-surface">
          <div className="flex items-center justify-between px-3 pb-2 pt-1">
            <p className="nav-dropdown-label">Production country or spoken language</p>
            <Link
              href="/countries"
              prefetch={false}
              onClick={() => handleClose(0)}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Overview
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-1">
            {ORIGIN_CATALOG.map((item) => (
              <Link
                key={item.slug}
                href={`/origin/${item.slug}`}
                prefetch={false}
                onClick={() => handleClose(0)}
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
        onOpen={handleOpen}
        onToggle={handleToggle}
        onClose={handleClose}
      >
        <div className="nav-dropdown-surface">
          <div className="flex items-center justify-between px-3 pb-2 pt-1">
            <p className="nav-dropdown-label">Browse by release year</p>
            <Link
              href="/years"
              prefetch={false}
              onClick={() => handleClose(0)}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Overview
            </Link>
          </div>
          <div className="grid max-h-[22rem] grid-cols-4 gap-1 overflow-y-auto overscroll-contain pr-1">
            {years.map((year) => (
              <Link
                key={year}
                href={`/year/${year}`}
                prefetch={false}
                onClick={() => handleClose(0)}
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
