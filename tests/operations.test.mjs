import assert from 'node:assert/strict';
import { botDiagnostic } from '../lib/bot-diagnostics.mjs';
import { elo, sourceOf } from '../operations/store.mjs';
import { benchmarkSummary } from '../lib/practice-tools.mjs';
assert.equal(botDiagnostic('bot_error', 'SyntaxError').code, 'E01');
assert.equal(botDiagnostic('bot_error', 'Thiếu hàm choose_move').code, 'E02');
assert.equal(botDiagnostic('invalid_move', '').code, 'E03');
assert.equal(botDiagnostic('invalid_move', 'choose_move trả về nước đi không hợp lệ.').code, 'E03');
assert.equal(botDiagnostic('bot_error', "ModuleNotFoundError: No module named 'requests'").code, 'E05');
assert.equal(botDiagnostic('timeout', '').code, 'E04');
assert.equal(botDiagnostic('bot_error', 'PermissionError').code, 'E05');
assert.equal(botDiagnostic('output_limit', '').code, 'E06');
assert.deepEqual(elo(1000, 1000, 1), [1012, 988]);
assert.deepEqual(elo(1000, 1000, .5), [1000, 1000]);
for (const score of [0, .25, .5, .75, 1]) { const [a, b] = elo(900, 1100, score); assert.equal(Math.round((a + b) * 10), 20000); }
assert.throws(() => sourceOf(null));
assert.throws(() => sourceOf('á'.repeat(40000)));
assert.equal(sourceOf('def choose_move(state):\n    pass'), 'def choose_move(state):\n    pass');
console.log('Diagnostics follow sandbox outcomes; practice Elo is symmetric; source limits count UTF-8 bytes.');
const summary = benchmarkSummary([
 { status: 'done', studentSide: 'P1', result: { winner: 'P1', timing: { wallMs: 100 } } },
 { status: 'done', studentSide: 'P2', result: { winner: 'P1', timing: { wallMs: 300 } } },
 { status: 'done', studentSide: 'P2', result: { winner: null } },
 { status: 'queued', studentSide: 'P1', result: null },
], 4);
assert.deepEqual(summary, { expected: 4, completed: 3, wins: 1, draws: 1, losses: 1, measuredGames: 2, meanGameMs: 200 });
assert.equal(benchmarkSummary([], 2).meanGameMs, null, 'Missing timing is not zero latency');
