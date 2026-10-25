import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { CloudClient } from './cloud-client.mjs';
import { replayHtml } from '../lib/replay-html.mjs';
if (process.env.ARENA_ALLOW_LOAD_TEST !== '1') throw new Error('Opt in to the isolated localhost:3002 test');
const base = 'http://localhost:3002', student = new CloudClient(base), other = new CloudClient(base);
const fixtures = JSON.parse(readFileSync('.secrets/load-fixtures.json', 'utf8'));
other.jar.set('arena_session', fixtures.users.at(-1).token);
const suffix = randomBytes(6).toString('hex'), name = 'QA student tools ' + suffix;
await student.register(`arena-tools-${suffix}@vnu.edu.vn`, name, randomBytes(24).toString('base64url'));
const page = await student.call('/practice');
assert.ok(page.includes('Tự kiểm tra bản nháp') && page.includes('Benchmark bản nháp'), 'Signed-in students must reach the practice tools page');
const view = () => student.call('/api/operations?view=practice');
const initial = await view(); assert.equal(initial.references.length, 5); assert.equal(initial.own.length, 0);
for (const reference of initial.references) {
  const r = await fetch(`${base}/bots/${reference.id}.py`); assert.equal(r.status, 200); assert.ok((await r.text()).includes('choose_move'));
}
await student.call('/api/operations', { action: 'benchmark', source: 'x', opponent: '../../secret', pairs: 1 }, 400);
await student.call('/api/operations', { action: 'benchmark', source: 'x', opponent: 'sprinter', pairs: 6 }, 400);
const check = await student.call('/api/operations', { action: 'student_validate', source: 'def choose_move(:\n' });
const benchmark = await student.call('/api/operations', { action: 'benchmark', source: 'def choose_move(state):\n    return state["legal_moves"][0]\n', opponent: 'sprinter', pairs: 1 });
let result;
const deadline = Date.now() + 180000;
while (Date.now() < deadline) {
  result = await view();
  const c = result.checks.find(c => c.id === check.id), b = result.benchmarks.find(b => b.id === benchmark.id);
  if (c?.status === 'failed' || b?.games.some(g => g.status === 'failed')) throw new Error('Student tool infrastructure failed');
  if (c?.result && b?.summary.completed === 2) break;
  await new Promise(resolve => setTimeout(resolve, 1500));
}
const diagnostic = result.checks.find(c => c.id === check.id), report = result.benchmarks.find(b => b.id === benchmark.id);
assert.equal(diagnostic?.result?.valid, false); assert.match(diagnostic.result.message, /^\[E01\]/);
assert.equal(report?.summary.completed, 2); assert.equal(report.summary.measuredGames, 2);
assert.deepEqual(report.games.map(g => g.studentSide).sort(), ['P1','P2']);
assert.equal(report.games[0].seed, report.games[1].seed);
for (const game of report.games) { assert.ok(game.result.timing.wallMs > 0); assert.ok(replayHtml({ result: game.result }).startsWith('<!doctype html>')); }
assert.equal(result.own.length, 0, 'Tools must not enroll a bot into Elo');
assert.ok(!result.ratings.some(r => r.name === name));
const hasSourceField = value => value && typeof value === 'object' && (Object.hasOwn(value, 'source') || Object.hasOwn(value, 'payload') || Object.values(value).some(hasSourceField));
assert.ok(!hasSourceField(result), 'Never expose raw job payload/source fields; own diagnostic errors may quote a source line');
const isolated = await other.call('/api/operations?view=practice');
assert.ok(!isolated.checks.some(c => c.id === check.id)); assert.ok(!isolated.benchmarks.some(b => b.id === benchmark.id));
const proof = { at: new Date().toISOString(), practicePageVerified: true, references: initial.references.map(r => r.id), diagnostic: 'E01', benchmark: report.summary, sameSeed: true, sideSwapped: true, replaysVerified: 2, noEloEnrollment: true, ownerIsolation: true, noSourceFields: true };
mkdirSync('output/operations', { recursive: true }); writeFileSync('output/operations/student-tools-check.json', JSON.stringify(proof, null, 2));
console.log(JSON.stringify(proof, null, 2));
