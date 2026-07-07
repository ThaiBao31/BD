export interface PlayerStats {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
}

export interface Player {
  id: string;
  name: string;
  photo?: string;
  stats: PlayerStats;
  leftFoot: number;
  rightFoot: number;
  skillMoves: number;
  createdAt: string;
  updatedAt: string;
}

export type PlayerFormData = Omit<Player, 'id' | 'createdAt' | 'updatedAt'>;

export const DEFAULT_STATS: PlayerStats = {
  pace: 70,
  shooting: 70,
  passing: 70,
  dribbling: 70,
  defending: 70,
  physical: 70,
};

export const STAT_LABELS: Record<keyof PlayerStats, { full: string; short: string }> = {
  pace: { full: 'Tốc độ', short: 'TĐ' },
  shooting: { full: 'Dứt điểm', short: 'DD' },
  passing: { full: 'Chuyền bóng', short: 'CB' },
  dribbling: { full: 'Kỹ thuật', short: 'KT' },
  defending: { full: 'Phòng ngự', short: 'PN' },
  physical: { full: 'Sức mạnh', short: 'SM' },
};

export function createEmptyPlayer(): PlayerFormData {
  return {
    name: '',
    photo: undefined,
    stats: { ...DEFAULT_STATS },
    leftFoot: 3,
    rightFoot: 3,
    skillMoves: 3,
  };
}

export function overallRating(stats: PlayerStats): number {
  const values = Object.values(stats);
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}
