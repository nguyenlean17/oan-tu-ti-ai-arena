/**
 * 5-Tier Tie-Breaker System for Oan Tu Ti AI Arena
 * In accordance with UET Battlecode Regulations (Section 7.3):
 * 1. Head-to-Head points (Đối đầu trực tiếp)
 * 2. Total Wins (Tổng trận thắng)
 * 3. Piece Differential (Hiệu số quân cờ: Quân ăn - Quân mất)
 * 4. Remaining Pieces (Tổng quân cờ sống sót)
 * 5. Deterministic Hash (Băm SHA-256 kết hợp Seed giải đấu)
 */

import { createHash } from 'node:crypto';

export function deterministicSeedHash(seed, teamId) {
  return createHash('sha256')
    .update(`${seed}:${teamId}`)
    .digest('hex');
}

/**
 * Compare two teams based on the 5-tier tie-breaker criteria.
 * Returns negative if teamA ranks higher, positive if teamB ranks higher, 0 if absolute tie.
 */
export function compareTeams(teamA, teamB, stats, seed = 2026) {
  // Tier 0: Match Points (Standard Standing Points)
  const ptsA = stats[teamA.id]?.points ?? 0;
  const ptsB = stats[teamB.id]?.points ?? 0;
  if (ptsB !== ptsA) return ptsB - ptsA;

  // Tier 1: Head-to-Head Points
  const h2hA = stats[teamA.id]?.h2h?.[teamB.id] ?? 0;
  const h2hB = stats[teamB.id]?.h2h?.[teamA.id] ?? 0;
  if (h2hB !== h2hA) return h2hB - h2hA;

  // Tier 2: Total Wins
  const winsA = stats[teamA.id]?.wins ?? 0;
  const winsB = stats[teamB.id]?.wins ?? 0;
  if (winsB !== winsA) return winsB - winsA;

  // Tier 3: Piece Differential (captures - losses)
  const diffA = (stats[teamA.id]?.captures ?? 0) - (stats[teamA.id]?.losses_pieces ?? 0);
  const diffB = (stats[teamB.id]?.captures ?? 0) - (stats[teamB.id]?.losses_pieces ?? 0);
  if (diffB !== diffA) return diffB - diffA;

  // Tier 4: Total Remaining Pieces
  const piecesA = stats[teamA.id]?.remaining_pieces ?? 0;
  const piecesB = stats[teamB.id]?.remaining_pieces ?? 0;
  if (piecesB !== piecesA) return piecesB - piecesA;

  // Tier 5: Deterministic Seed Hash
  const hashA = deterministicSeedHash(seed, teamA.id);
  const hashB = deterministicSeedHash(seed, teamB.id);
  return hashA.localeCompare(hashB);
}

/**
 * Sort a list of teams using the 5-tier tie-breaker.
 */
export function sortStandings(teams, stats, seed = 2026) {
  return [...teams].sort((a, b) => compareTeams(a, b, stats, seed));
}
