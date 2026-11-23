import { randomBytes } from 'node:crypto';
import { Redis } from '@upstash/redis';
import {
  computeRoomMatches,
  normalizeRoomCode,
  type TonightMovieCard,
  type TonightRoomState,
} from './tonight-types';

export {
  TONIGHT_MOODS,
  TONIGHT_REGIONS,
  TONIGHT_STREAMING_FILTERS,
  computeRoomMatches,
  normalizeRoomCode,
  type TonightMovieCard,
  type TonightRegionOption,
  type TonightRegionPreset,
  type TonightRoomState,
} from './tonight-types';

const ROOM_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ROOM_TTL_SECONDS = 24 * 3600;
const ROOM_TTL_MS = ROOM_TTL_SECONDS * 1000;
const MAX_LOCAL_ROOMS = 1000;
const REDIS_PREFIX = 'movieflix:tonight:room:';

export function generateRoomCode(length = 6): string {
  const bytes = randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += ROOM_ALPHABET[bytes[i] % ROOM_ALPHABET.length];
  }
  return out;
}

// Upstash Redis client (shared across serverless/multi-instance if configured) with
// bounded in-memory LRU fallback for single-container NuraHost / local dev / tests.
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const redisClient = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

const GLOBAL_ROOMS_KEY = '__movieflixTonightRooms';

function getLocalRoomMap(): Map<string, TonightRoomState> {
  const g = globalThis as typeof globalThis & {
    [GLOBAL_ROOMS_KEY]?: Map<string, TonightRoomState>;
  };
  if (!g[GLOBAL_ROOMS_KEY]) {
    g[GLOBAL_ROOMS_KEY] = new Map();
  }
  return g[GLOBAL_ROOMS_KEY];
}

function setLocalRoom(room: TonightRoomState) {
  const store = getLocalRoomMap();
  if (store.has(room.code)) {
    store.delete(room.code);
  } else if (store.size >= MAX_LOCAL_ROOMS) {
    const oldest = store.keys().next().value;
    if (oldest !== undefined) store.delete(oldest);
  }
  store.set(room.code, room);
}

function getLocalRoom(code: string): TonightRoomState | null {
  const store = getLocalRoomMap();
  const room = store.get(code);
  if (!room) return null;
  if (Date.now() - room.createdAt > ROOM_TTL_MS) {
    store.delete(code);
    return null;
  }
  return room;
}

export const TonightRoomStore = {
  async create(deck: TonightMovieCard[]): Promise<TonightRoomState> {
    let code = generateRoomCode(6);
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const existing = await this.get(code);
      if (!existing) break;
      code = generateRoomCode(6);
    }

    const room: TonightRoomState = {
      code,
      createdAt: Date.now(),
      deck: deck.slice(0, 20),
      hostLikes: [],
      hostPasses: [],
      guestLikes: [],
      guestPasses: [],
      guestJoined: false,
    };

    await this.save(room);
    return room;
  },

  async get(rawCode: string): Promise<TonightRoomState | null> {
    const code = normalizeRoomCode(rawCode);
    if (!code) return null;

    if (redisClient) {
      try {
        const stored = await redisClient.get<TonightRoomState>(`${REDIS_PREFIX}${code}`);
        if (stored && typeof stored === 'object' && Array.isArray(stored.deck)) {
          return stored;
        }
      } catch {
        // Fall through to local store if Redis is momentarily unreachable
      }
    }

    return getLocalRoom(code);
  },

  async save(room: TonightRoomState): Promise<void> {
    setLocalRoom(room);
    if (redisClient) {
      try {
        await redisClient.set(`${REDIS_PREFIX}${room.code}`, room, { ex: ROOM_TTL_SECONDS });
      } catch {
        // Local store still holds the state for single-node setups
      }
    }
  },

  async recordSwipe(input: {
    code: string;
    role: 'host' | 'guest';
    movieId: string;
    decision: 'like' | 'pass';
  }): Promise<{ room: TonightRoomState; matches: TonightMovieCard[] } | null> {
    const room = await this.get(input.code);
    if (!room) return null;

    const inDeck = room.deck.some((m) => m.id === input.movieId);
    if (!inDeck) {
      return { room, matches: computeRoomMatches(room) };
    }

    if (input.role === 'guest') {
      room.guestJoined = true;
    }

    const likes = input.role === 'host' ? room.hostLikes : room.guestLikes;
    const passes = input.role === 'host' ? room.hostPasses : room.guestPasses;

    if (input.decision === 'like') {
      if (!likes.includes(input.movieId)) likes.push(input.movieId);
      const passIdx = passes.indexOf(input.movieId);
      if (passIdx >= 0) passes.splice(passIdx, 1);
    } else {
      if (!passes.includes(input.movieId)) passes.push(input.movieId);
      const likeIdx = likes.indexOf(input.movieId);
      if (likeIdx >= 0) likes.splice(likeIdx, 1);
    }

    await this.save(room);
    return { room, matches: computeRoomMatches(room) };
  },
};
