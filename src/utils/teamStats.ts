import type { Player } from '../types';
import { overallRating } from '../types';
import type { TeamSide } from '../types';

export function totalTeamOvr(players: Player[], assignments: (string | null)[]): number {
  const playerMap = new Map(players.map((p) => [p.id, p]));
  return assignments.reduce((sum, id) => {
    if (!id) return sum;
    const player = playerMap.get(id);
    return player ? sum + overallRating(player.stats) : sum;
  }, 0);
}

export function countAssigned(assignments: (string | null)[]): number {
  return assignments.filter((id) => id !== null).length;
}

export interface BalanceStatus {
  ovrA: number;
  ovrB: number;
  diff: number;
  isComplete: boolean;
  isBalanced: boolean;
  strongerSide: TeamSide | null;
}

export function getBalanceStatus(
  ovrA: number,
  ovrB: number,
  assignedA: number,
  assignedB: number,
  threshold = 10,
): BalanceStatus {
  const isComplete = assignedA === 7 && assignedB === 7;
  const diff = Math.abs(ovrA - ovrB);
  const isBalanced = !isComplete || diff <= threshold;

  let strongerSide: TeamSide | null = null;
  if (isComplete && diff > threshold) {
    strongerSide = ovrA > ovrB ? 'teamA' : 'teamB';
  }

  return { ovrA, ovrB, diff, isComplete, isBalanced, strongerSide };
}

export function getAllAssignedIds(
  teamA: (string | null)[],
  teamB: (string | null)[],
): Set<string> {
  const ids = new Set<string>();
  for (const id of [...teamA, ...teamB]) {
    if (id) ids.add(id);
  }
  return ids;
}

export function removePlayerFromSetup(
  assignments: (string | null)[],
  playerId: string,
): (string | null)[] {
  return assignments.map((id) => (id === playerId ? null : id));
}
