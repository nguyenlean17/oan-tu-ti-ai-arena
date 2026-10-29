/**
 * Extinction Win Rule Module for Oan Tu Ti AI Arena
 * In accordance with UET Battlecode Regulations:
 * A player immediately LOSES (Extinction Loss) if ALL pieces of ANY single type
 * (Rock, Paper, or Scissors) are eliminated by the opponent.
 * The opponent wins with reason 'EXTINCTION_WIN'.
 */

export const TYPE_MAP = {
  ROCK: 'R',
  PAPER: 'P',
  SCISSORS: 'S',
  R: 'R',
  P: 'P',
  S: 'S'
};

export const PIECE_TYPES = ['R', 'P', 'S'];

export function countPieces(board) {
  const counts = {
    P1: { R: 0, P: 0, S: 0, total: 0 },
    P2: { R: 0, P: 0, S: 0, total: 0 }
  };

  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < board[y].length; x++) {
      const piece = board[y][x];
      if (piece && (piece.player === 'P1' || piece.player === 'P2')) {
        const rawType = String(piece.type || '').toUpperCase();
        const normalized = TYPE_MAP[rawType];
        if (normalized && PIECE_TYPES.includes(normalized)) {
          counts[piece.player][normalized]++;
          counts[piece.player].total++;
        }
      }
    }
  }

  return counts;
}

export function checkExtinction(board) {
  const counts = countPieces(board);

  // Check if Player 1 lost all pieces of any type
  const p1ExtinctType = PIECE_TYPES.find(type => counts.P1[type] === 0);
  // Check if Player 2 lost all pieces of any type
  const p2ExtinctType = PIECE_TYPES.find(type => counts.P2[type] === 0);

  if (p1ExtinctType && p2ExtinctType) {
    if (counts.P1.total > counts.P2.total) {
      return { hasWinner: true, winner: 'P1', extinctType: p2ExtinctType, reason: 'EXTINCTION_WIN', counts };
    } else if (counts.P2.total > counts.P1.total) {
      return { hasWinner: true, winner: 'P2', extinctType: p1ExtinctType, reason: 'EXTINCTION_WIN', counts };
    }
    return { hasWinner: false, winner: null, isDraw: true, reason: 'SIMULTANEOUS_EXTINCTION', counts };
  }

  if (p1ExtinctType) {
    return {
      hasWinner: true,
      winner: 'P2',
      loser: 'P1',
      extinctType: p1ExtinctType,
      reason: 'EXTINCTION_WIN',
      details: `Player 1 đã bị tiêu diệt toàn bộ quân ${p1ExtinctType}! Player 2 chiến thắng tuyệt đối.`,
      counts
    };
  }

  if (p2ExtinctType) {
    return {
      hasWinner: true,
      winner: 'P1',
      loser: 'P2',
      extinctType: p2ExtinctType,
      reason: 'EXTINCTION_WIN',
      details: `Player 2 đã bị tiêu diệt toàn bộ quân ${p2ExtinctType}! Player 1 chiến thắng tuyệt đối.`,
      counts
    };
  }

  return { hasWinner: false, winner: null, counts };
}
