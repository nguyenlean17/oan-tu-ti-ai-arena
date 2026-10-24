import assert from 'node:assert/strict';
import { createEmptyBoard } from '../lib/rules/gameRules.js';
import { evaluateTieBreaker } from '../lib/tie-breaker.mjs';

console.log('--- Kiểm thử 5-Layer Tie-Breaker Engine ---');

// Test Tầng 1: Số lượng quân khác nhau
const b1 = createEmptyBoard();
b1[0][0] = { player: 'P1', type: 'ROCK' };
b1[0][1] = { player: 'P1', type: 'PAPER' };
b1[8][8] = { player: 'P2', type: 'SCISSORS' }; // P1 có 2 quân, P2 có 1 quân
const r1 = evaluateTieBreaker(b1);
assert.equal(r1.winner, 'P1');
assert.equal(r1.tier, 1);

// Test Tầng 2: Quân số bằng nhau nhưng Điểm Khắc Chế (Predator Score) khác nhau
// P1 có 1 Rock. P2 có 1 Scissors.
// R ăn S => P1 có điểm khắc chế = 1*1 = 1. P2 = 0.
const b2 = createEmptyBoard();
b2[0][0] = { player: 'P1', type: 'ROCK' };
b2[8][8] = { player: 'P2', type: 'SCISSORS' };
const r2 = evaluateTieBreaker(b2);
assert.equal(r2.winner, 'P1');
assert.equal(r2.tier, 2);

// Test Tầng 3: Điểm khắc chế bằng nhau nhưng Khoảng cách Chebyshev tới đích khác nhau
// P1 đích là I1 (8, 0). Đặt quân P1 tại (7, 0) -> khoảng cách = 1
// P2 đích là A9 (0, 8). Đặt quân P2 tại (5, 5) -> khoảng cách = 5
const b3 = createEmptyBoard();
b3[0][7] = { player: 'P1', type: 'ROCK' };
b3[5][5] = { player: 'P2', type: 'ROCK' };
const r3 = evaluateTieBreaker(b3);
assert.equal(r3.winner, 'P1');
assert.equal(r3.tier, 3);

// Test Tầng 5: Komi Play-off (Tất cả đối xứng hoàn toàn)
// Đặt P1 ở (0,0) (cách I1 dist 8) và P2 ở (8,8) (cách A9 dist 8)
const b5 = createEmptyBoard();
b5[0][0] = { player: 'P1', type: 'ROCK' };
b5[8][8] = { player: 'P2', type: 'ROCK' };
const r5 = evaluateTieBreaker(b5, 0.05, 0.05, true);
assert.equal(r5.winner, 'P2', 'Komi Play-off trao chiến thắng cho P2 (bên đi sau)');
assert.equal(r5.tier, 5);

console.log('✅ Toàn bộ bài kiểm thử 5-Layer Tie-Breaker PASSED 100%!');
