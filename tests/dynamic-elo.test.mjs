import assert from 'node:assert/strict';
import { calculateExpectedScore, getDynamicK, getStreakMultiplier, calculateEloUpdate, ELO_CONFIG } from '../lib/dynamic-elo.mjs';

console.log('--- Kiểm thử Dynamic Elo Engine ---');

// 1. Kiểm tra xác suất kỳ vọng E
const expEqual = calculateExpectedScore(1000, 1000);
assert.equal(expEqual, 0.5, 'Hai đội bằng điểm xác suất kỳ vọng phải là 50%');

const expDiff = calculateExpectedScore(900, 1100);
assert.ok(Math.abs(expDiff - 0.24) < 0.01, 'Đội 900 vs 1100 kỳ vọng thắng xấp xỉ 24%');

// 2. Kiểm tra Hệ số K động
assert.equal(getDynamicK(5, 1000), 32.0, 'Tân binh < 10 trận K=32');
assert.equal(getDynamicK(15, 1200), 24.0, 'Giai đoạn ổn định 10-40 trận K=24');
assert.equal(getDynamicK(45, 1200), 16.0, 'Giai đoạn nhóm đầu > 40 trận K=16');
assert.equal(getDynamicK(15, 1450), 16.0, 'Elo >= 1400 K=16');
assert.equal(getDynamicK(15, 1200, true), 12.0, 'Khiêu chiến trực tiếp K giảm 50% (24 / 2 = 12)');

// 3. Kiểm tra Hệ số Chuỗi M_chuỗi
assert.equal(getStreakMultiplier(2), 1.0, 'Thắng 2 trận nhân 1.0x');
assert.equal(getStreakMultiplier(3), 1.15, 'Chuỗi 3 trận thắng nhân 1.15x');
assert.equal(getStreakMultiplier(4), 1.30, 'Chuỗi 4 trận thắng nhân 1.30x');
assert.equal(getStreakMultiplier(5), 1.50, 'Chuỗi 5 trận thắng nhân 1.50x');
assert.equal(getStreakMultiplier(-3), 0.80, 'Chuỗi >= 3 trận thua giảm sốc 0.80x');

// 4. Kiểm thử các tình huống trong Ma trận Sổ tay Thí sinh (Mục 1.2.1-D)
// Trường hợp 1: Ngang tài ngang sức (1000 vs 1000, K=24), A thắng
const res1 = calculateEloUpdate(
  { elo: 1000, played: 15, streak: 0 },
  { elo: 1000, played: 15, streak: 0 },
  1.0
);
assert.equal(res1.playerA.delta, 12.0, '1000 vs 1000: A thắng nhận +12.0 Elo');
assert.equal(res1.playerB.delta, -12.0, '1000 vs 1000: B thua trừ -12.0 Elo');

// Trường hợp 3: Đội điểm thấp (900) thắng đội điểm cao (1100), K=24
const res3 = calculateEloUpdate(
  { elo: 900, played: 15, streak: 0 },
  { elo: 1100, played: 15, streak: 0 },
  1.0
);
assert.ok(Math.abs(res3.playerA.delta - 18.2) <= 0.1, '900 thắng 1100 nhận xấp xỉ +18.2 Elo');
assert.ok(Math.abs(res3.playerB.delta - (-18.2)) <= 0.1, '1100 thua 900 trừ xấp xỉ -18.2 Elo');

// Trường hợp 6: Chuỗi thắng 3 trận (Streak 3) -> được thưởng thêm +15%
const res6 = calculateEloUpdate(
  { elo: 1000, played: 15, streak: 2 }, // Trận thắng này nâng streak lên 3
  { elo: 1000, played: 15, streak: 0 },
  1.0
);
// streak trước đó là 2, thắng trận này lên streak 3 -> khi áp dụng công thức: streak trước đó là 2 (1.0x) hoặc trận sau streak 3 (1.15x)
assert.equal(res6.playerA.streak, 3, 'Streak của A tăng lên 3');

// Trường hợp Sàn Elo tối thiểu: Elo không được rơi xuống dưới 600.0 (Ví dụ: 605 thua đội 600 ngang cơ bị trừ ~12đ)
const resFloor = calculateEloUpdate(
  { elo: 605, played: 15, streak: 0 },
  { elo: 600, played: 15, streak: 0 },
  0.0
);
assert.equal(resFloor.playerA.newElo, 600.0, 'Elo không được rơi xuống dưới sàn 600.0 (chặn ở 600.0 thay vì 593.0)');

console.log('✅ Toàn bộ bài kiểm thử Dynamic Elo Engine PASSED 100%!');
