/**
 * Dynamic Elo Engine — Oẳn Tù Tì 2.0 (UET BattleCode 2026)
 * Trích xuất từ Sổ Tay Thí Sinh v2.0 (Mục 1.2.1) & Sổ Tay Vận Hành BTC (Mục 7.3).
 *
 * Công thức: ΔElo = K_động × M_chuỗi × (S - E)
 * - K_động: 32.0 (<10 trận), 24.0 (10-40 trận), 16.0 (>40 trận hoặc Elo >= 1400)
 * - M_chuỗi: Win streak acceleration (1.15x, 1.30x, 1.50x), Loss streak protection (0.80x)
 * - Sàn Elo tối thiểu: 600.0 điểm
 */

export const ELO_CONFIG = {
  DEFAULT_ELO: 1000.0,
  FLOOR_ELO: 600.0,
  K_ROOKIE: 32.0,    // < 10 trận
  K_STABLE: 24.0,    // 10 - 40 trận
  K_VETERAN: 16.0,   // > 40 trận hoặc Elo >= 1400
  CHALLENGE_K_RATIO: 0.5, // Khiêu chiến trực tiếp K giảm 50%
};

/**
 * Tính xác suất kỳ vọng chiến thắng E_A
 */
export function calculateExpectedScore(ratingA, ratingB) {
  return 1.0 / (1.0 + Math.pow(10.0, (ratingB - ratingA) / 400.0));
}

/**
 * Xác định hệ số K động dựa trên số trận đã đấu và mức Elo hiện tại
 */
export function getDynamicK(matchesPlayed, currentElo, isChallenge = false) {
  let k;
  if (matchesPlayed < 10) {
    k = ELO_CONFIG.K_ROOKIE;
  } else if (matchesPlayed <= 40 && currentElo < 1400.0) {
    k = ELO_CONFIG.K_STABLE;
  } else {
    k = ELO_CONFIG.K_VETERAN;
  }

  if (isChallenge) {
    k *= ELO_CONFIG.CHALLENGE_K_RATIO;
  }
  return k;
}

/**
 * Xác định hệ số gia tốc chuỗi thắng / giảm sốc chuỗi thua (M_chuỗi)
 * streak > 0: chuỗi thắng, streak < 0: chuỗi thua, streak = 0: hòa hoặc mới bắt đầu
 */
export function getStreakMultiplier(streak) {
  if (streak >= 5) return 1.50; // Chuỗi >= 5 trận thắng: +50%
  if (streak === 4) return 1.30; // Chuỗi 4 trận thắng: +30%
  if (streak === 3) return 1.15; // Chuỗi 3 trận thắng: +15%
  if (streak <= -3) return 0.80; // Chuỗi >= 3 trận thua: Giảm sốc trừ 80%
  return 1.0; // Bình thường
}

/**
 * Cập nhật điểm Elo sau 1 cặp trận (hoặc 1 trận đấu)
 * @param {Object} playerA - { elo, played, streak }
 * @param {Object} playerB - { elo, played, streak }
 * @param {number} actualScoreA - 1.0 (Thắng), 0.5 (Hòa), 0.0 (Thua)
 * @param {boolean} isChallenge - Trận khiêu chiến trực tiếp hay ghép cặp tự động
 */
export function calculateEloUpdate(playerA, playerB, actualScoreA, isChallenge = false) {
  const actualScoreB = 1.0 - actualScoreA;

  const expectedA = calculateExpectedScore(playerA.elo, playerB.elo);
  const expectedB = 1.0 - expectedA;

  const kA = getDynamicK(playerA.played, playerA.elo, isChallenge);
  const kB = getDynamicK(playerB.played, playerB.elo, isChallenge);

  const streakMultA = getStreakMultiplier(playerA.streak);
  const streakMultB = getStreakMultiplier(playerB.streak);

  const deltaA = kA * streakMultA * (actualScoreA - expectedA);
  const deltaB = kB * streakMultB * (actualScoreB - expectedB);

  const newEloA = Math.max(ELO_CONFIG.FLOOR_ELO, Math.round((playerA.elo + deltaA) * 10) / 10);
  const newEloB = Math.max(ELO_CONFIG.FLOOR_ELO, Math.round((playerB.elo + deltaB) * 10) / 10);

  // Cập nhật chuỗi (streak) mới
  let newStreakA = 0;
  if (actualScoreA === 1.0) newStreakA = playerA.streak > 0 ? playerA.streak + 1 : 1;
  else if (actualScoreA === 0.0) newStreakA = playerA.streak < 0 ? playerA.streak - 1 : -1;

  let newStreakB = 0;
  if (actualScoreB === 1.0) newStreakB = playerB.streak > 0 ? playerB.streak + 1 : 1;
  else if (actualScoreB === 0.0) newStreakB = playerB.streak < 0 ? playerB.streak - 1 : -1;

  return {
    playerA: {
      oldElo: playerA.elo,
      newElo: newEloA,
      delta: Math.round(deltaA * 10) / 10,
      streak: newStreakA,
      played: playerA.played + 1
    },
    playerB: {
      oldElo: playerB.elo,
      newElo: newEloB,
      delta: Math.round(deltaB * 10) / 10,
      streak: newStreakB,
      played: playerB.played + 1
    }
  };
}
