import assert from 'node:assert/strict';
import { checkMatchmakingAllowance, anonymizeStateForBot } from '../lib/anti-collusion.mjs';

// Test 1: Chặn tự khiêu chiến chính mình
const selfCheck = checkMatchmakingAllowance({ challengerId: 'team1', opponentId: 'team1' });
assert.equal(selfCheck.allowed, false);
assert.equal(selfCheck.reason, 'SELF_CHALLENGE');

// Test 2: Chặn khiêu chiến tự do giữa 2 đội Top 50
const top50Check = checkMatchmakingAllowance({
  challengerId: 'team_top1',
  opponentId: 'team_top2',
  challengerRank: 5,
  opponentRank: 12
});
assert.equal(top50Check.allowed, false);
assert.equal(top50Check.reason, 'TOP_TIER_LOCKED');

// Test 3: Giải đấu chính thức cho phép Top 50 đấu theo lịch BTC
const officialCheck = checkMatchmakingAllowance({
  challengerId: 'team_top1',
  opponentId: 'team_top2',
  challengerRank: 5,
  opponentRank: 12,
  isOfficialTournament: true
});
assert.equal(officialCheck.allowed, true);

// Test 4: Giới hạn tối đa 3 trận/ngày giữa cùng 1 cặp đội
const limitCheck = checkMatchmakingAllowance({
  challengerId: 'team_a',
  opponentId: 'team_b',
  challengerRank: 80,
  opponentRank: 90,
  matchesInLast24h: 3
});
assert.equal(limitCheck.allowed, false);
assert.equal(limitCheck.reason, 'DAILY_LIMIT_EXCEEDED');

// Test 5: Cho phép khi dưới 3 trận/ngày
const validCheck = checkMatchmakingAllowance({
  challengerId: 'team_a',
  opponentId: 'team_b',
  challengerRank: 80,
  opponentRank: 90,
  matchesInLast24h: 2
});
assert.equal(validCheck.allowed, true);

// Test 6: Anonymize State loại bỏ triệt để metadata đối thủ
const rawState = {
  turn: 'P1',
  player: 'P1',
  ply: 14,
  max_plies: 200,
  opponent_team: 'Collusion Partner Team',
  opponent_id: 'secret_partner_99',
  opponent_email: 'colluder@vnu.edu.vn',
  legal_moves: [{ from: 'A8', to: 'A7', capture: false, extra_meta: 'drop_game' }],
  board: [[{ player: 'P2', type: 'ROCK', secret_hash: 'handshake' }, null]]
};

const clean = anonymizeStateForBot(rawState);
assert.equal(clean.opponent_team, undefined);
assert.equal(clean.opponent_id, undefined);
assert.equal(clean.opponent_email, undefined);
assert.equal(clean.legal_moves[0].extra_meta, undefined);
assert.equal(clean.board[0][0].secret_hash, undefined);
assert.equal(clean.board[0][0].player, 'P2');
assert.equal(clean.board[0][0].type, 'ROCK');

console.log('Anti-collusion tests passed: self-check, Top 50 lock, 3-match daily limit, and state anonymization.');
