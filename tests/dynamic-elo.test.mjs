import assert from 'node:assert/strict';
import { calculateDynamicElo, getKFactor, getStreakMultiplier, ELO_FLOOR } from '../lib/dynamic-elo.mjs';

// Test 1: K-factor theo số trận
assert.equal(getKFactor(0), 40);
assert.equal(getKFactor(9), 40);
assert.equal(getKFactor(10), 24);
assert.equal(getKFactor(30), 24);
assert.equal(getKFactor(31), 16);

// Test 2: Streak multiplier
assert.equal(getStreakMultiplier(0), 1.0);
assert.equal(getStreakMultiplier(2), 1.0);
assert.equal(getStreakMultiplier(3), 1.15);
assert.equal(getStreakMultiplier(4), 1.15);
assert.equal(getStreakMultiplier(5), 1.25);
assert.equal(getStreakMultiplier(10), 1.25);

// Test 3: Tân sinh viên đấu nhau (K=40), không có streak
const match1 = calculateDynamicElo(1200, 1200, 1, 0, 0, 0, 0);
assert.equal(match1.kA, 40);
assert.equal(match1.kB, 40);
assert.equal(match1.deltaA, 20); // 40 * (1 - 0.5) = 20
assert.equal(match1.deltaB, -20);
assert.equal(match1.ratingA, 1220);
assert.equal(match1.ratingB, 1180);

// Test 4: Thắng khi đang có chuỗi 3 trận thắng (+15% bonus)
const matchStreak = calculateDynamicElo(1200, 1200, 1, 0, 0, 3, 0);
assert.equal(matchStreak.deltaA, 23); // 20 * 1.15 = 23
assert.equal(matchStreak.ratingA, 1223);

// Test 5: Sàn Elo bảo vệ 600 điểm (khi 610 thua đối thủ 610, delta = -20, kết quả phải được chặn ở 600)
const matchFloor = calculateDynamicElo(610, 610, 0, 0, 0, 0, 0);
assert.ok(matchFloor.ratingA >= ELO_FLOOR, 'Rating không thể thấp hơn 600');
assert.equal(matchFloor.ratingA, 600);

console.log('Dynamic Elo tests passed: adaptive K, streak multiplier, and Elo floor protection.');
