/**
 * 5-Layer Tie-Breaker Engine — Oẳn Tù Tì 2.0 (UET BattleCode 2026)
 * Trích xuất từ Sổ Tay Thí Sinh v2.0 (Mục 3.5-D) & Sổ Tay Vận Hành BTC.
 *
 * Dùng để phân định thắng thua một cách khoa học khi trận đấu đạt ngưỡng 200 lượt (Hòa):
 * 1. Tầng 1: Tổng số quân cờ còn sống trên bàn (Bên nào nhiều quân hơn thắng).
 * 2. Tầng 2: Điểm Khắc Chế (Predator Score: R_mình*S_địch + S_mình*P_địch + P_mình*R_địch).
 * 3. Tầng 3: Tổng khoảng cách Chebyshev tới đích của toàn bộ quân sống (Áp sát hơn thắng).
 * 4. Tầng 4: Tổng thời gian CPU tiêu tốn (Bên nào thuật toán chạy nhanh hơn thắng).
 * 5. Tầng 5 (Vòng Play-off): Điểm Komi +0.5 dành cho bên đi sau (P2).
 */

import { countPlayerPieces, coordToPos } from './rules/gameRules.js';

export function evaluateTieBreaker(board, p1CpuSeconds = 0, p2CpuSeconds = 0, isPlayoff = true) {
  const counts = countPlayerPieces(board);

  // 1. TẦNG 1: TỔNG QUÂN SỐ CÒN SỐNG
  const p1Total = counts.P1.total;
  const p2Total = counts.P2.total;
  if (p1Total !== p2Total) {
    const winner = p1Total > p2Total ? 'P1' : 'P2';
    return {
      winner,
      tier: 1,
      reason: 'piece_count',
      details: `Thắng Tầng 1 (Quân số): P1 còn ${p1Total} quân vs P2 còn ${p2Total} quân`
    };
  }

  // 2. TẦNG 2: ĐIỂM KHẮC CHẾ (PREDATOR SCORE)
  // R ăn S, S ăn P, P ăn R
  const r1 = counts.P1.ROCK, p1 = counts.P1.PAPER, s1 = counts.P1.SCISSORS;
  const r2 = counts.P2.ROCK, p2 = counts.P2.PAPER, s2 = counts.P2.SCISSORS;

  const p1Predator = r1 * s2 + s1 * p2 + p1 * r2;
  const p2Predator = r2 * s1 + s2 * p1 + p2 * r1;

  if (p1Predator !== p2Predator) {
    const winner = p1Predator > p2Predator ? 'P1' : 'P2';
    return {
      winner,
      tier: 2,
      reason: 'predator_score',
      details: `Thắng Tầng 2 (Điểm Khắc Chế): P1 (${p1Predator}đ) vs P2 (${p2Predator}đ)`
    };
  }

  // 3. TẦNG 3: TỔNG KHOẢNG CÁCH CHEBYSHEV TỚI ĐÍCH
  // Đích P1 là I1 (8, 0); Đích P2 là A9 (0, 8)
  const g1 = { x: 8, y: 0 };
  const g2 = { x: 0, y: 8 };

  let p1SumDist = 0;
  let p2SumDist = 0;

  for (let y = 0; y < 9; y++) {
    for (let x = 0; x < 9; x++) {
      const piece = board[y][x];
      if (piece) {
        if (piece.player === 'P1') {
          p1SumDist += Math.max(Math.abs(x - g1.x), Math.abs(y - g1.y));
        } else {
          p2SumDist += Math.max(Math.abs(x - g2.x), Math.abs(y - g2.y));
        }
      }
    }
  }

  if (p1SumDist !== p2SumDist) {
    // Tổng khoảng cách nhỏ hơn = áp sát đích hơn = thắng
    const winner = p1SumDist < p2SumDist ? 'P1' : 'P2';
    return {
      winner,
      tier: 3,
      reason: 'chebyshev_distance',
      details: `Thắng Tầng 3 (Cự ly tiếp cận): P1 tổng cự ly ${p1SumDist} vs P2 ${p2SumDist}`
    };
  }

  // 4. TẦNG 4: THỜI GIAN CPU TÍCH LŨY
  if (Math.abs(p1CpuSeconds - p2CpuSeconds) > 0.001) {
    const winner = p1CpuSeconds < p2CpuSeconds ? 'P1' : 'P2';
    return {
      winner,
      tier: 4,
      reason: 'cpu_time',
      details: `Thắng Tầng 4 (Tối ưu CPU): P1 tiêu tốn ${(p1CpuSeconds*1000).toFixed(1)}ms vs P2 ${(p2CpuSeconds*1000).toFixed(1)}ms`
    };
  }

  // 5. TẦNG 5: LỢI THẾ KOMI VÒNG PLAY-OFF
  if (isPlayoff) {
    return {
      winner: 'P2',
      tier: 5,
      reason: 'komi_playoff',
      details: `Thắng Tầng 5 (Komi Play-off): P2 (bên đi sau) nhận +0.5 điểm Komi`
    };
  }

  return {
    winner: null,
    tier: 0,
    reason: 'draw',
    details: 'Hòa tuyệt đối cả 5 tầng'
  };
}
