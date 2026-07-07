import {
  loadMatchSetup,
  loadPlayers,
  migratePlayersFromJson,
  saveMatchSetup,
  savePlayers,
} from './storage';
import type { MatchSetup, Player } from './types';

export interface SharedData {
  version: 1;
  updatedAt: string;
  players: Player[];
  matchSetup: MatchSetup;
}

export type SyncStatus = 'idle' | 'loading' | 'saving' | 'saved' | 'error' | 'readonly';

const API_URL = '/api/shared';

export function createSharedData(players: Player[], matchSetup: MatchSetup): SharedData {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    players,
    matchSetup: { ...matchSetup, updatedAt: new Date().toISOString() },
  };
}

export function loadLocalSharedData(): SharedData {
  return createSharedData(loadPlayers(), loadMatchSetup());
}

export function cacheSharedData(data: SharedData): void {
  savePlayers(data.players);
  saveMatchSetup(data.matchSetup);
}

function migrateSharedData(raw: unknown): SharedData | null {
  if (!raw || typeof raw !== 'object') return null;
  const d = raw as Record<string, unknown>;
  if (!Array.isArray(d.players)) return null;

  const local = loadLocalSharedData();
  const players = Array.isArray(d.players) ? migratePlayersFromJson(d.players) : local.players;

  let matchSetup = local.matchSetup;
  if (d.matchSetup && typeof d.matchSetup === 'object') {
    matchSetup = d.matchSetup as MatchSetup;
  }

  return {
    version: 1,
    updatedAt: typeof d.updatedAt === 'string' ? d.updatedAt : new Date().toISOString(),
    players,
    matchSetup,
  };
}

export async function fetchSharedData(): Promise<SharedData> {
  try {
    const res = await fetch(`${API_URL}?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = migrateSharedData(await res.json());
    if (!data) throw new Error('Invalid data');
    return data;
  } catch {
    try {
      const res = await fetch(`/data/shared.json?t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) return loadLocalSharedData();
      const data = migrateSharedData(await res.json());
      return data ?? loadLocalSharedData();
    } catch {
      return loadLocalSharedData();
    }
  }
}

export async function saveSharedData(data: SharedData): Promise<{ ok: boolean; readonly?: boolean; error?: string }> {
  try {
    const payload = createSharedData(data.players, data.matchSetup);
    const res = await fetch(API_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.status === 503) {
      const body = (await res.json()) as { error?: string };
      return { ok: false, readonly: true, error: body.error ?? 'Chế độ chỉ đọc' };
    }

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      return { ok: false, error: body.error ?? `Lỗi lưu (${res.status})` };
    }

    cacheSharedData(payload);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Không thể lưu dữ liệu chung' };
  }
}

export function exportSharedJson(data: SharedData): void {
  const payload = createSharedData(data.players, data.matchSetup);
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bd-football-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importSharedJson(file: File): Promise<SharedData> {
  const text = await file.text();
  const parsed = JSON.parse(text) as unknown;
  const data = migrateSharedData(parsed);
  if (!data) throw new Error('File JSON không hợp lệ');
  return data;
}
