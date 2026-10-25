import assert from 'node:assert/strict';
import { botDiagnostic } from '../lib/bot-diagnostics.mjs';
import { elo, sourceOf } from '../operations/store.mjs';
assert.equal(botDiagnostic('bot_error', 'SyntaxError').code, 'E01');
assert.equal(botDiagnostic('bot_error', 'Thiếu hàm choose_move').code, 'E02');
assert.equal(botDiagnostic('invalid_move', '').code, 'E03');
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
