import assert from 'node:assert/strict';
import { compareTeams, sortStandings, deterministicSeedHash } from '../lib/tie-breaker.mjs';

const seed = 2026;
const teamA = { id: 'team_A', name: 'Alpha' };
const teamB = { id: 'team_B', name: 'Beta' };
const teamC = { id: 'team_C', name: 'Gamma' };

// Scenario 1: Tier 0 - Điểm trận khác nhau
const statsTier0 = {
  team_A: { points: 6 },
  team_B: { points: 3 }
};
assert.ok(compareTeams(teamA, teamB, statsTier0, seed) < 0, 'Team A có nhiều điểm hơn phải xếp trước');

// Scenario 2: Tier 1 - Bằng điểm, phân định bằng Đối đầu trực tiếp (H2H)
const statsTier1 = {
  team_A: { points: 3, h2h: { team_B: 3 } }, // A thắng B
  team_B: { points: 3, h2h: { team_A: 0 } }
};
assert.ok(compareTeams(teamA, teamB, statsTier1, seed) < 0, 'Team A thắng H2H phải xếp trước');

// Scenario 3: Tier 2 - Bằng điểm, hòa H2H, phân định bằng Tổng trận thắng
const statsTier2 = {
  team_A: { points: 4, h2h: { team_B: 1 }, wins: 1 },
  team_B: { points: 4, h2h: { team_A: 1 }, wins: 2 } // B có 2 trận thắng
};
assert.ok(compareTeams(teamA, teamB, statsTier2, seed) > 0, 'Team B có nhiều trận thắng hơn phải xếp trước');

// Scenario 4: Tier 3 - Bằng điểm, bằng H2H, bằng wins, phân định bằng Hiệu số quân
const statsTier3 = {
  team_A: { points: 4, h2h: { team_B: 1 }, wins: 1, captures: 12, losses_pieces: 4 }, // Diff = +8
  team_B: { points: 4, h2h: { team_A: 1 }, wins: 1, captures: 10, losses_pieces: 5 }  // Diff = +5
};
assert.ok(compareTeams(teamA, teamB, statsTier3, seed) < 0, 'Team A có hiệu số quân tốt hơn (+8 vs +5) phải xếp trước');

// Scenario 5: Tier 4 - Bằng cả hiệu số, phân định bằng Tổng quân sống sót
const statsTier4 = {
  team_A: { points: 4, h2h: { team_B: 1 }, wins: 1, captures: 10, losses_pieces: 5, remaining_pieces: 25 },
  team_B: { points: 4, h2h: { team_A: 1 }, wins: 1, captures: 10, losses_pieces: 5, remaining_pieces: 28 } // B còn 28 quân
};
assert.ok(compareTeams(teamA, teamB, statsTier4, seed) > 0, 'Team B có nhiều quân sống sót hơn phải xếp trước');

// Scenario 6: Tier 5 - Bằng tất cả, phân định bằng Băm SHA-256 ngẫu nhiên xác định
const statsTier5 = {
  team_A: { points: 4, h2h: { team_B: 1 }, wins: 1, captures: 10, losses_pieces: 5, remaining_pieces: 25 },
  team_B: { points: 4, h2h: { team_A: 1 }, wins: 1, captures: 10, losses_pieces: 5, remaining_pieces: 25 }
};
const cmp5 = compareTeams(teamA, teamB, statsTier5, seed);
const expectedCmp = deterministicSeedHash(seed, teamA.id).localeCompare(deterministicSeedHash(seed, teamB.id));
assert.equal(cmp5, expectedCmp, 'Tier 5 phải khớp với SHA-256 seed hash');

// Test sortStandings
const sorted = sortStandings([teamB, teamA], statsTier0, seed);
assert.equal(sorted[0].id, 'team_A');
assert.equal(sorted[1].id, 'team_B');

console.log('5-tier Tie-Breaker tests passed across all tiers.');
