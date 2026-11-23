'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Check,
  Clock,
  ExternalLink,
  Film,
  Heart,
  Link2,
  Loader2,
  Play,
  RefreshCw,
  Share2,
  Shuffle,
  Sparkles,
  Star,
  Users,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  TONIGHT_MOODS,
  TONIGHT_REGIONS,
  TONIGHT_STREAMING_FILTERS,
  normalizeRoomCode,
  type TonightMovieCard,
  type TonightRoomState,
} from '@/lib/tonight-types';
import { moviePath } from '@/lib/public-routes';
import { WatchlistButton } from './WatchlistButton';

interface TonightMatcherProps {
  initialDeck: TonightMovieCard[];
  initialRoomCode: string | null;
  siteUrl: string;
}

const RUNTIME_OPTIONS = [
  { value: '', label: 'Any runtime' },
  { value: '95', label: 'Under 95 min' },
  { value: '120', label: 'Under 2 hours' },
  { value: '150', label: 'Under 2h 30m' },
];

const RATING_OPTIONS = [
  { value: '', label: 'Any rating' },
  { value: '6.5', label: '6.5+ Rated' },
  { value: '7.5', label: '7.5+ Acclaimed' },
];

export function TonightMatcher({
  initialDeck,
  initialRoomCode,
  siteUrl,
}: TonightMatcherProps) {
  // Filter state (Solo + Host room creation)
  const [mood, setMood] = React.useState<string>('any');
  const [region, setRegion] = React.useState<string>('global');
  const [streaming, setStreaming] = React.useState<string>('any');
  const [maxRuntime, setMaxRuntime] = React.useState<string>('');
  const [minRating, setMinRating] = React.useState<string>('');

  // Solo state
  const [deck, setDeck] = React.useState<TonightMovieCard[]>(initialDeck);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [soloLikes, setSoloLikes] = React.useState<TonightMovieCard[]>([]);
  const [loadingDeck, setLoadingDeck] = React.useState(false);

  // Trailer preview inside active card
  const [playingTrailerId, setPlayingTrailerId] = React.useState<string | null>(null);

  // Multiplayer room state
  const [room, setRoom] = React.useState<TonightRoomState | null>(null);
  const [role, setRole] = React.useState<'host' | 'guest'>('host');
  const [matches, setMatches] = React.useState<TonightMovieCard[]>([]);
  const [creatingRoom, setCreatingRoom] = React.useState(false);
  const [joiningRoom, setJoiningRoom] = React.useState(Boolean(initialRoomCode));
  const [joinCodeInput, setJoinCodeInput] = React.useState('');
  const [roomError, setRoomError] = React.useState<string | null>(null);
  const [copiedInvite, setCopiedInvite] = React.useState(false);
  const prevMatchCountRef = React.useRef(0);

  const activeDeck = room ? room.deck : deck;
  const activeMovie = activeDeck[currentIndex] || null;
  const isFinished = activeDeck.length > 0 && currentIndex >= activeDeck.length;

  const getRoomShareUrl = React.useCallback(
    (code: string) => {
      const origin =
        typeof window !== 'undefined' && window.location.origin
          ? window.location.origin
          : siteUrl.replace(/\/+$/, '');
      return `${origin}/tonight?room=${code}`;
    },
    [siteUrl],
  );

  const loadExistingRoom = React.useCallback(async (rawCode: string, silent = false) => {
    const clean = normalizeRoomCode(rawCode);
    if (!clean) {
      if (!silent) setRoomError('Please enter a valid 6-character room code.');
      return;
    }
    if (!silent) {
      setJoiningRoom(true);
      setRoomError(null);
    }
    try {
      const res = await fetch(`/api/tonight/rooms/${clean}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) {
        if (!silent) {
          setRoomError(data.error || 'Room not found or expired.');
          toast.error(data.error || 'Room not found or expired.');
        }
        return;
      }

      const loadedRoom = data.room as TonightRoomState;
      const loadedMatches = (data.matches || []) as TonightMovieCard[];

      let resolvedRole: 'host' | 'guest' = 'guest';
      try {
        if (window.sessionStorage.getItem(`movieflix_tonight_host_${clean}`) === '1') {
          resolvedRole = 'host';
        }
      } catch {
        // ignore storage errors
      }

      setRoom(loadedRoom);
      setRole(resolvedRole);
      setMatches(loadedMatches);

      if (!silent) {
        const alreadySwiped = new Set(
          resolvedRole === 'host'
            ? [...loadedRoom.hostLikes, ...loadedRoom.hostPasses]
            : [...loadedRoom.guestLikes, ...loadedRoom.guestPasses],
        );
        const firstUnswiped = loadedRoom.deck.findIndex((m) => !alreadySwiped.has(m.id));
        setCurrentIndex(firstUnswiped >= 0 ? firstUnswiped : loadedRoom.deck.length);
        setPlayingTrailerId(null);
      }

      if (loadedMatches.length > prevMatchCountRef.current && prevMatchCountRef.current >= 0 && silent) {
        const newest = loadedMatches[loadedMatches.length - 1];
        toast.success(`IT'S A MATCH! You both picked "${newest.title}"!`);
      }
      prevMatchCountRef.current = loadedMatches.length;
    } catch {
      if (!silent) setRoomError('Could not connect to the room. Please try again.');
    } finally {
      if (!silent) setJoiningRoom(false);
    }
  }, []);

  // Auto-join room from URL query param (?room=XXXXXX)
  React.useEffect(() => {
    if (!initialRoomCode) return;
    let cancelled = false;
    const clean = normalizeRoomCode(initialRoomCode);
    if (!clean) return;

    (async () => {
      try {
        const res = await fetch(`/api/tonight/rooms/${clean}`, { cache: 'no-store' });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setRoomError(data.error || 'Room not found or expired.');
          toast.error(data.error || 'Room not found or expired.');
          return;
        }

        const loadedRoom = data.room as TonightRoomState;
        const loadedMatches = (data.matches || []) as TonightMovieCard[];
        let resolvedRole: 'host' | 'guest' = 'guest';
        try {
          if (window.sessionStorage.getItem(`movieflix_tonight_host_${clean}`) === '1') {
            resolvedRole = 'host';
          }
        } catch {
          // ignore storage errors
        }

        const alreadySwiped = new Set(
          resolvedRole === 'host'
            ? [...loadedRoom.hostLikes, ...loadedRoom.hostPasses]
            : [...loadedRoom.guestLikes, ...loadedRoom.guestPasses],
        );
        const firstUnswiped = loadedRoom.deck.findIndex((m) => !alreadySwiped.has(m.id));
        setRoom(loadedRoom);
        setRole(resolvedRole);
        setMatches(loadedMatches);
        prevMatchCountRef.current = loadedMatches.length;
        setCurrentIndex(firstUnswiped >= 0 ? firstUnswiped : loadedRoom.deck.length);
        setPlayingTrailerId(null);
      } catch {
        if (!cancelled) setRoomError('Could not connect to the room. Please try again.');
      } finally {
        if (!cancelled) setJoiningRoom(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialRoomCode]);

  // Live 3-second polling when in a multiplayer room
  React.useEffect(() => {
    if (!room) return;
    const code = room.code;
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void loadExistingRoom(code, true);
      }
    }, 3000);
    return () => window.clearInterval(interval);
  }, [room, loadExistingRoom]);

  const fetchFilteredDeck = async (overrides?: {
    mood?: string;
    region?: string;
    streaming?: string;
    maxRuntime?: string;
    minRating?: string;
  }) => {
    const nextMood = overrides?.mood ?? mood;
    const nextRegion = overrides?.region ?? region;
    const nextStreaming = overrides?.streaming ?? streaming;
    const nextMaxRuntime = overrides?.maxRuntime ?? maxRuntime;
    const nextMinRating = overrides?.minRating ?? minRating;

    setLoadingDeck(true);
    setPlayingTrailerId(null);
    try {
      const params = new URLSearchParams();
      if (nextMood !== 'any') params.set('mood', nextMood);
      if (nextRegion !== 'global') params.set('region', nextRegion);
      if (nextStreaming !== 'any') params.set('streaming', nextStreaming);
      if (nextMaxRuntime) params.set('maxRuntime', nextMaxRuntime);
      if (nextMinRating) params.set('minRating', nextMinRating);

      const res = await fetch(`/api/tonight/deck?${params.toString()}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Could not load movies');
        return;
      }
      setDeck(data.deck || []);
      setCurrentIndex(0);
      setSoloLikes([]);
    } catch {
      toast.error('Network error while refreshing deck');
    } finally {
      setLoadingDeck(false);
    }
  };

  const handleCreateRoom = async () => {
    setCreatingRoom(true);
    setRoomError(null);
    setPlayingTrailerId(null);
    try {
      const res = await fetch('/api/tonight/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mood: mood !== 'any' ? mood : undefined,
          region: region !== 'global' ? region : undefined,
          streaming: streaming !== 'any' ? streaming : undefined,
          maxRuntime: maxRuntime ? Number(maxRuntime) : undefined,
          minRating: minRating ? Number(minRating) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to create room');
        return;
      }

      const createdRoom = data.room as TonightRoomState;
      try {
        window.sessionStorage.setItem(`movieflix_tonight_host_${createdRoom.code}`, '1');
        window.history.replaceState(null, '', `/tonight?room=${createdRoom.code}`);
      } catch {
        // ignore history/storage errors
      }

      setRoom(createdRoom);
      setRole('host');
      setMatches([]);
      prevMatchCountRef.current = 0;
      setCurrentIndex(0);
      toast.success(`Room ${createdRoom.code} created! Send the link to your partner or friend.`);
    } catch {
      toast.error('Network error while creating room');
    } finally {
      setCreatingRoom(false);
    }
  };

  const handleLeaveRoom = () => {
    setRoom(null);
    setMatches([]);
    prevMatchCountRef.current = 0;
    setCurrentIndex(0);
    setPlayingTrailerId(null);
    try {
      window.history.replaceState(null, '', '/tonight');
    } catch {
      // ignore
    }
  };

  const handleDecision = React.useCallback(
    async (decision: 'like' | 'pass') => {
      if (!activeMovie) return;
      const movie = activeMovie;
      setPlayingTrailerId(null);
      setCurrentIndex((prev) => prev + 1);

      if (!room) {
        if (decision === 'like') {
          setSoloLikes((prev) => (prev.some((m) => m.id === movie.id) ? prev : [...prev, movie]));
        }
        return;
      }

      try {
        const res = await fetch(`/api/tonight/rooms/${room.code}/swipe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role,
            movieId: movie.id,
            decision,
          }),
        });
        if (!res.ok) return;
        const data = await res.json();
        const updatedRoom = data.room as TonightRoomState;
        const updatedMatches = (data.matches || []) as TonightMovieCard[];
        setRoom(updatedRoom);
        setMatches(updatedMatches);
        if (updatedMatches.length > prevMatchCountRef.current) {
          toast.success(`IT'S A MATCH! You both picked "${movie.title}"!`);
        }
        prevMatchCountRef.current = updatedMatches.length;
      } catch {
        toast.error('Could not sync your swipe. Please check your connection.');
      }
    },
    [activeMovie, room, role],
  );

  const handleSurpriseMe = () => {
    if (!activeDeck.length) return;
    const randomIdx = Math.floor(Math.random() * activeDeck.length);
    setCurrentIndex(randomIdx);
    setPlayingTrailerId(null);
    toast.success(`Tonight's wildcard pick: ${activeDeck[randomIdx].title}`);
  };

  // Keyboard shortcuts (Left = Pass, Right = Watch Tonight)
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'SELECT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (!activeMovie) return;
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        void handleDecision('pass');
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        void handleDecision('like');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeMovie, handleDecision]);

  const handleCopyInvite = async () => {
    if (!room) return;
    const shareUrl = getRoomShareUrl(room.code);
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedInvite(true);
      toast.success('Room invite link copied!');
      setTimeout(() => setCopiedInvite(false), 2200);
    } catch {
      toast.error('Could not copy link');
    }
  };

  const handleShareMatch = async (movie: TonightMovieCard) => {
    const movieUrl = `${siteUrl.replace(/\/+$/, '')}${moviePath(movie.slug)}`;
    const text = `We matched on ${movie.title}${movie.releaseYear ? ` (${movie.releaseYear})` : ''} for movie night on MovieFlix!`;
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: `Movie Night Match: ${movie.title}`, text, url: movieUrl });
        return;
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(`${text} ${movieUrl}`);
      toast.success('Match result copied to clipboard!');
    } catch {
      toast.error('Could not copy match');
    }
  };

  const roomShareUrl = room ? getRoomShareUrl(room.code) : '';
  const inviteText = room
    ? `Swipe movies with me to pick what we watch tonight! Join my MovieFlix room (${room.code}): ${roomShareUrl}`
    : '';

  const partnerSwipedCount = room
    ? role === 'host'
      ? room.guestLikes.length + room.guestPasses.length
      : room.hostLikes.length + room.hostPasses.length
    : 0;

  return (
    <div className="space-y-8">
      {/* Mode Switcher & Multiplayer Bar */}
      <div className="rounded-2xl border bg-card/70 p-4 sm:p-6">
        {!room ? (
          <div className="space-y-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                  Customize tonight&apos;s deck
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Swipe solo in 30 seconds or launch a synced room to match with a partner or friend on separate phones.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleCreateRoom}
                  disabled={creatingRoom}
                  className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-60"
                >
                  {creatingRoom ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Users className="h-4 w-4" aria-hidden="true" />
                  )}
                  <span>Match with a Partner / Friend</span>
                </button>
                <button
                  type="button"
                  onClick={handleSurpriseMe}
                  disabled={!activeDeck.length}
                  className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border bg-background px-3.5 py-2 text-sm font-semibold text-foreground transition hover:border-primary/50 hover:text-primary disabled:opacity-50"
                >
                  <Shuffle className="h-4 w-4" aria-hidden="true" />
                  <span>Surprise Me</span>
                </button>
              </div>
            </div>

            {/* Filter Controls */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
                <span>Mood &amp; Genre</span>
                <select
                  value={mood}
                  onChange={(e) => {
                    setMood(e.target.value);
                    void fetchFilteredDeck({ mood: e.target.value });
                  }}
                  className="h-10 rounded-xl border bg-background px-3 text-sm font-medium text-foreground focus:border-primary focus:outline-none"
                >
                  {TONIGHT_MOODS.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
                <span>Cinema Region</span>
                <select
                  value={region}
                  onChange={(e) => {
                    setRegion(e.target.value);
                    void fetchFilteredDeck({ region: e.target.value });
                  }}
                  className="h-10 rounded-xl border bg-background px-3 text-sm font-medium text-foreground focus:border-primary focus:outline-none"
                >
                  {TONIGHT_REGIONS.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
                <span>Streaming Platform</span>
                <select
                  value={streaming}
                  onChange={(e) => {
                    setStreaming(e.target.value);
                    void fetchFilteredDeck({ streaming: e.target.value });
                  }}
                  className="h-10 rounded-xl border bg-background px-3 text-sm font-medium text-foreground focus:border-primary focus:outline-none"
                >
                  {TONIGHT_STREAMING_FILTERS.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
                <span>Max Runtime</span>
                <select
                  value={maxRuntime}
                  onChange={(e) => {
                    setMaxRuntime(e.target.value);
                    void fetchFilteredDeck({ maxRuntime: e.target.value });
                  }}
                  className="h-10 rounded-xl border bg-background px-3 text-sm font-medium text-foreground focus:border-primary focus:outline-none"
                >
                  {RUNTIME_OPTIONS.map((item) => (
                    <option key={item.value || 'any'} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
                <span>Minimum Rating</span>
                <select
                  value={minRating}
                  onChange={(e) => {
                    setMinRating(e.target.value);
                    void fetchFilteredDeck({ minRating: e.target.value });
                  }}
                  className="h-10 rounded-xl border bg-background px-3 text-sm font-medium text-foreground focus:border-primary focus:outline-none"
                >
                  {RATING_OPTIONS.map((item) => (
                    <option key={item.value || 'any'} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Join Existing Room Strip */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void loadExistingRoom(joinCodeInput, false);
                }}
                className="flex flex-wrap items-center gap-2"
              >
                <span className="text-xs font-medium text-muted-foreground">Have a room code?</span>
                <input
                  type="text"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  placeholder="e.g. K7M9QP"
                  maxLength={6}
                  aria-label="Enter 6-character room code"
                  className="h-9 w-32 rounded-lg border bg-background px-3 text-xs font-semibold uppercase tracking-widest text-foreground focus:border-primary focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={joiningRoom || joinCodeInput.trim().length < 6}
                  className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border bg-card px-3 text-xs font-semibold text-foreground transition hover:border-primary hover:text-primary disabled:opacity-50"
                >
                  {joiningRoom ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  <span>Join Room</span>
                </button>
              </form>

              <button
                type="button"
                onClick={() => void fetchFilteredDeck()}
                disabled={loadingDeck}
                className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border bg-background px-3 text-xs font-medium text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingDeck ? 'animate-spin' : ''}`} aria-hidden="true" />
                <span>Shuffle New Deck</span>
              </button>
            </div>
            {roomError ? <p className="text-xs font-medium text-destructive">{roomError}</p> : null}
          </div>
        ) : (
          /* Active Multiplayer Room Header */
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-bold tracking-widest text-primary">
                  <Users className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>ROOM {room.code}</span>
                </span>
                <span className="rounded-full border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  You are {role === 'host' ? 'Host' : 'Guest'}
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  {room.guestJoined || role === 'guest'
                    ? `Partner synced · ${partnerSwipedCount}/${room.deck.length} swiped`
                    : 'Waiting for your partner or friend to open the invite link…'}
                </span>
              </div>

              <button
                type="button"
                onClick={handleLeaveRoom}
                className="inline-flex h-9 cursor-pointer items-center gap-1.5 self-start rounded-lg border px-3 text-xs font-medium text-muted-foreground transition hover:border-destructive/50 hover:text-destructive sm:self-auto"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Leave Room</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCopyInvite}
                className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
              >
                {copiedInvite ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
                <span>{copiedInvite ? 'Invite Link Copied!' : 'Copy Invite Link'}</span>
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(inviteText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-9 items-center rounded-lg border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-primary/40 hover:text-primary"
              >
                WhatsApp
              </a>
              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(roomShareUrl)}&text=${encodeURIComponent(`Join my MovieFlix Movie Night room (${room.code}) and swipe to match!`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-9 items-center rounded-lg border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-primary/40 hover:text-primary"
              >
                Telegram
              </a>
              <a
                href={`https://x.com/intent/tweet?text=${encodeURIComponent(`Can't decide what to watch tonight? Swipe with me in room ${room.code}:`)}&url=${encodeURIComponent(roomShareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-9 items-center rounded-lg border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-primary/40 hover:text-primary"
              >
                X / Twitter
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Live IT'S A MATCH Celebration Banner */}
      {room && matches.length > 0 ? (
        <section
          aria-labelledby="tonight-matches-heading"
          className="rounded-2xl border-2 border-primary/60 bg-primary/10 p-5 sm:p-6"
        >
          <div className="mb-4 flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground shadow">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 id="tonight-matches-heading" className="text-lg font-bold tracking-tight sm:text-xl">
                IT&apos;S A MATCH! ({matches.length} {matches.length === 1 ? 'Movie' : 'Movies'})
              </h2>
              <p className="text-xs text-muted-foreground sm:text-sm">
                You and your movie partner both swiped right on {matches.length === 1 ? 'this pick' : 'these picks'}.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {matches.map((match) => (
              <div
                key={`match-${match.id}`}
                className="flex gap-4 rounded-xl border bg-card p-3.5 shadow-sm"
              >
                <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {match.posterUrl ? (
                    <Image src={match.posterUrl} alt={match.title} fill sizes="80px" className="object-cover" />
                  ) : null}
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
                  <div>
                    <h3 className="truncate text-base font-semibold">
                      {match.title}{' '}
                      {match.releaseYear ? (
                        <span className="font-normal text-muted-foreground">({match.releaseYear})</span>
                      ) : null}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {match.voteAverage ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          {match.voteAverage.toFixed(1)}
                        </span>
                      ) : null}
                      {match.runtimeMinutes ? <span>{match.runtimeMinutes}m</span> : null}
                      {match.providers.length ? (
                        <span className="truncate">On {match.providers.slice(0, 2).join(', ')}</span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={moviePath(match.slug)}
                      prefetch={false}
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>Watch Trailer</span>
                    </Link>
                    <WatchlistButton
                      variant="compact"
                      movie={{
                        id: match.id,
                        tmdbId: match.tmdbId,
                        slug: match.slug,
                        title: match.title,
                        posterUrl: match.posterUrl,
                        releaseYear: match.releaseYear,
                        runtimeMinutes: match.runtimeMinutes,
                        voteAverage: match.voteAverage,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => void handleShareMatch(match)}
                      className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground transition hover:border-primary/40 hover:text-primary"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      <span>Share</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Main Swipe Arena + Sidebar Picks */}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        {/* Swipe Card Stage */}
        <div>
          {loadingDeck ? (
            <div className="cinema-panel flex min-h-[30rem] flex-col items-center justify-center rounded-2xl p-8 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="mt-4 text-base font-semibold">Building tonight&apos;s movie deck…</p>
            </div>
          ) : activeMovie ? (
            <article className="overflow-hidden rounded-2xl border bg-card shadow-lg">
              {/* Top Media Preview / Inline Trailer */}
              <div className="relative aspect-video w-full bg-[#080908]">
                {playingTrailerId === activeMovie.id && activeMovie.youtubeTrailerId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${activeMovie.youtubeTrailerId}?autoplay=1&modestbranding=1&rel=0`}
                    className="absolute inset-0 h-full w-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={`${activeMovie.title} official trailer`}
                  />
                ) : (
                  <>
                    {activeMovie.backdropUrl || activeMovie.posterUrl ? (
                      <Image
                        src={activeMovie.backdropUrl || activeMovie.posterUrl || ''}
                        alt={activeMovie.title}
                        fill
                        priority
                        sizes="(max-width: 1024px) 100vw, 65vw"
                        className="object-cover"
                      />
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/25" />

                    {/* Top status pill */}
                    <div className="absolute left-4 top-4 flex items-center gap-2">
                      <span className="rounded-full bg-black/75 px-3 py-1 text-xs font-semibold tabular-nums text-white backdrop-blur-md">
                        Card {Math.min(currentIndex + 1, activeDeck.length)} / {activeDeck.length}
                      </span>
                      {activeMovie.voteAverage ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-black/75 px-2.5 py-1 text-xs font-semibold tabular-nums text-white backdrop-blur-md">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          {activeMovie.voteAverage.toFixed(1)}
                        </span>
                      ) : null}
                    </div>

                    {/* Play trailer overlay button */}
                    {activeMovie.youtubeTrailerId ? (
                      <button
                        type="button"
                        onClick={() => setPlayingTrailerId(activeMovie.id)}
                        className="group absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center gap-2.5 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-2xl transition hover:scale-105"
                      >
                        <Play className="h-5 w-5 fill-current" />
                        <span>Preview Trailer</span>
                      </button>
                    ) : null}
                  </>
                )}
              </div>

              {/* Card Body */}
              <div className="p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
                      {activeMovie.title}{' '}
                      {activeMovie.releaseYear ? (
                        <span className="font-normal text-muted-foreground">({activeMovie.releaseYear})</span>
                      ) : null}
                    </h2>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground sm:text-sm">
                      {activeMovie.runtimeMinutes ? (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {activeMovie.runtimeMinutes} min
                        </span>
                      ) : null}
                      {activeMovie.genres.map((g) => (
                        <span
                          key={g}
                          className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-foreground"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Link
                    href={moviePath(activeMovie.slug)}
                    target="_blank"
                    prefetch={false}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    <span>Full details</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {activeMovie.synopsis ? (
                  <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
                    {activeMovie.synopsis}
                  </p>
                ) : null}

                {activeMovie.providers.length > 0 ? (
                  <div className="mt-4 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">Available on:</span>
                    {activeMovie.providers.map((provider) => (
                      <span
                        key={provider}
                        className="rounded-md border bg-background px-2 py-0.5 font-medium text-foreground"
                      >
                        {provider}
                      </span>
                    ))}
                  </div>
                ) : null}

                {/* Swipe Decision Buttons */}
                <div className="mt-6 grid grid-cols-2 gap-3 border-t pt-5">
                  <button
                    type="button"
                    onClick={() => void handleDecision('pass')}
                    className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition hover:border-destructive/50 hover:text-destructive active:scale-[.98]"
                  >
                    <X className="h-5 w-5" aria-hidden="true" />
                    <span>Skip / Pass</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDecision('like')}
                    className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 active:scale-[.98]"
                  >
                    <Heart className="h-5 w-5 fill-current" aria-hidden="true" />
                    <span>{room ? 'Like to Match' : 'Watch Tonight'}</span>
                  </button>
                </div>
                <p className="mt-2.5 text-center text-[11px] text-muted-foreground">
                  Tip: Use keyboard arrows <kbd className="rounded border px-1.5 py-0.5">←</kbd> Pass or{' '}
                  <kbd className="rounded border px-1.5 py-0.5">→</kbd> Watch Tonight
                </p>
              </div>
            </article>
          ) : (
            <div className="cinema-panel flex min-h-[26rem] flex-col items-center justify-center rounded-2xl p-8 text-center">
              <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-primary">
                <Film className="h-7 w-7" />
              </span>
              <h2 className="text-2xl font-semibold">
                {isFinished ? 'You finished this 15-movie deck!' : 'No matching movies found'}
              </h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                {room
                  ? matches.length > 0
                    ? 'Pick one of your matches above or start a fresh room with new filters.'
                    : 'Waiting for your partner to finish swiping—matches appear automatically above as soon as you both like the same title.'
                  : 'Review your liked picks on the right, save favorites to your Watchlist, or shuffle a fresh deck.'}
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                {room ? (
                  <button
                    type="button"
                    onClick={handleCreateRoom}
                    disabled={creatingRoom}
                    className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Start New Match Room</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void fetchFilteredDeck()}
                    className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Shuffle 15 New Movies</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar: Shortlist / Likes */}
        <aside className="rounded-2xl border bg-card/55 p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold tracking-tight">
              {room ? 'Your Swiped Likes' : 'Tonight\u2019s Shortlist'}
            </h2>
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold tabular-nums text-foreground">
              {room
                ? (role === 'host' ? room.hostLikes.length : room.guestLikes.length)
                : soloLikes.length}
            </span>
          </div>

          {(() => {
            const pickedMovies = room
              ? room.deck.filter((m) =>
                  (role === 'host' ? room.hostLikes : room.guestLikes).includes(m.id),
                )
              : soloLikes;

            if (pickedMovies.length === 0) {
              return (
                <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                  Swipe right on any movie you&apos;d watch tonight to collect your top picks here.
                </div>
              );
            }

            return (
              <ul className="space-y-3">
                {pickedMovies.map((item) => (
                  <li
                    key={`pick-${item.id}`}
                    className="flex items-center gap-3 rounded-xl border bg-background/80 p-2.5"
                  >
                    <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded-md bg-muted">
                      {item.posterUrl ? (
                        <Image src={item.posterUrl} alt={item.title} fill sizes="44px" className="object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={moviePath(item.slug)}
                        prefetch={false}
                        className="block truncate text-sm font-semibold text-foreground hover:text-primary"
                      >
                        {item.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {item.releaseYear || 'TBA'}
                        {item.runtimeMinutes ? ` · ${item.runtimeMinutes}m` : ''}
                        {item.voteAverage ? ` · ★ ${item.voteAverage.toFixed(1)}` : ''}
                      </p>
                      <div className="mt-1.5">
                        <WatchlistButton
                          variant="compact"
                          movie={{
                            id: item.id,
                            tmdbId: item.tmdbId,
                            slug: item.slug,
                            title: item.title,
                            posterUrl: item.posterUrl,
                            releaseYear: item.releaseYear,
                            runtimeMinutes: item.runtimeMinutes,
                            voteAverage: item.voteAverage,
                          }}
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            );
          })()}

          <div className="mt-5 border-t pt-4">
            <Link
              href="/watchlist"
              prefetch={false}
              className="inline-flex w-full items-center justify-center rounded-xl border bg-background px-4 py-2.5 text-xs font-semibold text-foreground transition hover:border-primary/50 hover:text-primary"
            >
              Open Full Watchlist &amp; Share Link →
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
