/**
 * Anti-Collusion & Fair-Play Module for Oan Tu Ti AI Arena
 * Enforces tournament integrity:
 * 1. Restricts friendly rated matches between Top 50 teams (prevents collusion/point pumping)
 * 2. Daily match limit: maximum 3 rated games per pair of teams per 24 hours
 * 3. State Anonymization: sanitizes game state sent to bots to prevent handshake signals
 */

export const TOP_TIER_CUTOFF = 50;
export const MAX_DAILY_RATED_MATCHES = 3;

export function checkMatchmakingAllowance({
  challengerId,
  opponentId,
  challengerRank = 999,
  opponentRank = 999,
  matchesInLast24h = 0,
  isOfficialTournament = false
}) {
  if (challengerId === opponentId) {
    return { allowed: false, reason: 'SELF_CHALLENGE', message: 'Không thể tự khiêu chiến chính mình.' };
  }

  // Official tournament matches scheduled by organizers are always allowed
  if (isOfficialTournament) {
    return { allowed: true };
  }

  // Anti-collusion for Top 50
  if (challengerRank <= TOP_TIER_CUTOFF && opponentRank <= TOP_TIER_CUTOFF) {
    return {
      allowed: false,
      reason: 'TOP_TIER_LOCKED',
      message: 'Các đội trong Top 50 chỉ thi đấu theo lịch xếp cặp chính thức từ Ban Tổ chức.'
    };
  }

  // Daily limit between pairs
  if (matchesInLast24h >= MAX_DAILY_RATED_MATCHES) {
    return {
      allowed: false,
      reason: 'DAILY_LIMIT_EXCEEDED',
      message: `Hai đội đã đạt giới hạn tối đa ${MAX_DAILY_RATED_MATCHES} trận tính điểm trong 24 giờ.`
    };
  }

  return { allowed: true };
}

/**
 * Strips all identifiable metadata from state before passing to student bot.
 * Only keeps clean board representation, legal moves, and turn information.
 */
export function anonymizeStateForBot(rawState) {
  if (!rawState || typeof rawState !== 'object') return rawState;

  const sanitized = {
    turn: rawState.turn,
    my_side: rawState.my_side || rawState.player || rawState.turn,
    ply: rawState.ply ?? 0,
    max_plies: rawState.max_plies ?? 200,
    legal_moves: Array.isArray(rawState.legal_moves)
      ? rawState.legal_moves.map(m => ({ from: m.from, to: m.to }))
      : [],
    board: Array.isArray(rawState.board)
      ? rawState.board.map(row =>
          row.map(cell =>
            cell
              ? {
                  player: cell.player,
                  type: cell.type
                }
              : null
          )
        )
      : []
  };

  return sanitized;
}
