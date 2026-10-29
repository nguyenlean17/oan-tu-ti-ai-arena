/**
 * Dynamic Elo Rating System for Oan Tu Ti AI Arena
 * In accordance with UET Battlecode Regulations (Section 7.4):
 * - Adaptive K-factor based on experience:
 *   * Provisional (games < 10): K = 40
 *   * Intermediate (10 <= games <= 30): K = 24
 *   * Established (games > 30): K = 16
 * - Win Streak Multiplier:
 *   * streak >= 5: +25% rating gain
 *   * streak >= 3: +15% rating gain
 * - Elo Floor:
 *   * Rating cannot drop below 600 points
 */

export const ELO_FLOOR = 600;
export const DEFAULT_RATING = 1200;

export function getKFactor(gamesPlayed) {
  if (gamesPlayed < 10) return 40;
  if (gamesPlayed <= 30) return 24;
  return 16;
}

export function getStreakMultiplier(winStreak) {
  if (winStreak >= 5) return 1.25;
  if (winStreak >= 3) return 1.15;
  return 1.0;
}

/**
 * Calculates new ratings for player A and player B.
 * @param {number} ratingA - Current Elo of Player A
 * @param {number} ratingB - Current Elo of Player B
 * @param {number} actualScoreA - 1 for A win, 0.5 for draw, 0 for B win
 * @param {number} gamesA - Total games played by Player A before this match
 * @param {number} gamesB - Total games played by Player B before this match
 * @param {number} streakA - Consecutive win streak of Player A before this match
 * @param {number} streakB - Consecutive win streak of Player B before this match
 */
export function calculateDynamicElo(ratingA, ratingB, actualScoreA, gamesA = 0, gamesB = 0, streakA = 0, streakB = 0) {
  const actualScoreB = 1 - actualScoreA;

  // Expected scores based on standard logistic curve
  const expectedA = 1 / (1 + 10 ** ((ratingB - ratingA) / 400));
  const expectedB = 1 - expectedA;

  const kA = getKFactor(gamesA);
  const kB = getKFactor(gamesB);

  // Apply streak multiplier for winner
  let deltaA = kA * (actualScoreA - expectedA);
  if (actualScoreA === 1) {
    deltaA *= getStreakMultiplier(streakA);
  }

  let deltaB = kB * (actualScoreB - expectedB);
  if (actualScoreB === 1) {
    deltaB *= getStreakMultiplier(streakB);
  }

  const newRatingA = Math.max(ELO_FLOOR, Math.round(ratingA + deltaA));
  const newRatingB = Math.max(ELO_FLOOR, Math.round(ratingB + deltaB));

  return {
    ratingA: newRatingA,
    ratingB: newRatingB,
    deltaA: newRatingA - ratingA,
    deltaB: newRatingB - ratingB,
    kA,
    kB
  };
}
