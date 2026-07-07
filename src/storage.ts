import type { Player } from './types';
import { DEFAULT_STATS } from './types';

const STORAGE_KEY = 'bd-football-players';

function migrateFootRatings(p: Record<string, unknown>): { leftFoot: number; rightFoot: number } {
  if (typeof p.leftFoot === 'number' && typeof p.rightFoot === 'number') {
    return { leftFoot: p.leftFoot, rightFoot: p.rightFoot };
  }

  const weakFoot = typeof p.weakFoot === 'number' ? p.weakFoot : 3;
  const preferredFoot = p.preferredFoot === 'L' ? 'L' : 'R';

  if (preferredFoot === 'L') {
    return { leftFoot: 5, rightFoot: weakFoot };
  }
  return { leftFoot: weakFoot, rightFoot: 5 };
}

function migratePlayer(raw: unknown): Player | null {
  if (!raw || typeof raw !== 'object') return null;
  const p = raw as Record<string, unknown>;
  if (typeof p.name !== 'string' || !p.name.trim()) return null;

  const stats = p.stats as Player['stats'] | undefined;
  const feet = migrateFootRatings(p);

  return {
    id: typeof p.id === 'string' ? p.id : crypto.randomUUID(),
    name: p.name.trim(),
    photo: typeof p.photo === 'string' ? p.photo : undefined,
    stats: stats ?? { ...DEFAULT_STATS },
    leftFoot: feet.leftFoot,
    rightFoot: feet.rightFoot,
    skillMoves: typeof p.skillMoves === 'number' ? p.skillMoves : 3,
    createdAt: typeof p.createdAt === 'string' ? p.createdAt : new Date().toISOString(),
    updatedAt: typeof p.updatedAt === 'string' ? p.updatedAt : new Date().toISOString(),
  };
}

export function loadPlayers(): Player[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map(migratePlayer).filter((p): p is Player => p !== null);
  } catch {
    return [];
  }
}

export function savePlayers(players: Player[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
}
