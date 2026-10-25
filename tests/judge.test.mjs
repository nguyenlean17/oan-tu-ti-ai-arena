import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mkdtempSync, writeFileSync, unlinkSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { validateBot, runGame } from '../judge/runner.mjs';
import { sha, verifyOfficial, RUNTIME_VERSION } from '../competition/store.mjs';
import { ENGINE_VERSION } from '../lib/engine.mjs';
const config = { memoryMB: 128, startupMs: 10000, moveMs: 2000, maxPlies: 40 };
const source = 'def choose_move(state):\n    return state["legal_moves"][0]\n';
const payload = code => ({ source: code, sha: sha(code), config, engine: ENGINE_VERSION, runtime: RUNTIME_VERSION });
for (const file of ['sprinter', 'guardian', 'tactician', 'starter_config', 'heuristic_hunter']) {
  const r = await validateBot(payload(readFileSync(`public/bots/${file}.py`, 'utf8')));
  assert.equal(r.valid, true, `${file}: ${r.message}`);
}
const blocked = [
  'open("/etc/passwd").read()\n' + source,
  'open("/lib/escape.py","w").write("harmful")\n' + source,
  'import os\nos.system("echo escaped")\n' + source,
  'import socket\nsocket.socket().connect(("1.1.1.1",80))\n' + source,
  'import os\nassert os.environ.get("JUDGE_TOKEN") is not None\n' + source,
  'while True: pass\n' + source,
  'x=bytearray(512*1024*1024)\n' + source,
  'print("X"*100000)\n' + source,
  'def choose_move(state):\n    return {"from":"A1","to":"I9"}\n',
];
for (const code of blocked) { const r = await validateBot(payload(code)); assert.equal(r.valid, false, 'Harmful/invalid sample must not validate'); assert.deepEqual(Object.keys(r).sort(), ['engine', 'message', 'runtime', 'sha', 'valid'], 'Validation must retain the strict control-plane contract'); assert.match(r.message, /^\[E0[1-6]\]/); }
const p = { config, seed: 42, engine: ENGINE_VERSION, runtime: RUNTIME_VERSION, p1: { source, sha: sha(source) }, p2: { source, sha: sha(source) } };
const game = await runGame(p); verifyOfficial(p, game);
assert.equal(game.timing, undefined, 'Official results must not acquire benchmark-only metadata');
const measured = await runGame(p, { measure: true }); verifyOfficial(p, measured);
assert.ok(measured.timing.wallMs > 0);
assert.equal(measured.timing.moves.P1.count + measured.timing.moves.P2.count, measured.moves.length);
const illegal = await validateBot(payload('def choose_move(state):\n    return {"from":"A1","to":"I9"}\n'));
assert.match(illegal.message, /^\[E03\]/);
for (const file of ['starter_config', 'heuristic_hunter']) {
  const sample = readFileSync(`public/bots/${file}.py`, 'utf8');
  for (const side of ['p1', 'p2']) {
    const match = { ...p, [side]: { source: sample, sha: sha(sample) } };
    const result = await runGame(match);
    assert.ok(['goal', 'max_plies', 'no_moves'].includes(result.reason), `${file}/${side}: ${result.reason}`);
    verifyOfficial(match, result);
  }
}
const bad = 'def choose_move(state):\n    while True: pass\n';
const timeoutPayload = { ...p, config: { ...config, moveMs: 200 }, p2: { source: bad, sha: sha(bad) } };
const timed = await runGame(timeoutPayload); assert.equal(timed.winner, 'P1'); assert.equal(timed.reason, 'timeout'); verifyOfficial(timeoutPayload, timed);
const directory = mkdtempSync(join(tmpdir(), 'arena-cli-')), ownFile = join(directory, 'own.py'), badFile = join(directory, 'bad.py');
try {
  writeFileSync(ownFile, source); writeFileSync(badFile, 'def choose_move(state):\n    return {"from":"A1","to":"I9"}\n');
  const cli = args => JSON.parse(execFileSync(process.execPath, args, { encoding: 'utf8', maxBuffer: 1024 * 1024, timeout: 120000, windowsHide: true }));
  assert.equal(cli(['scripts/diagnose-bot.mjs', ownFile]).valid, true);
  try { cli(['scripts/diagnose-bot.mjs', badFile]); assert.fail('Invalid CLI bot must fail'); }
  catch (error) { assert.equal(error.status, 1); assert.match(JSON.parse(String(error.stdout)).message, /^\[E03\]/); }
  const benchmark = cli(['scripts/benchmark-arena.mjs', ownFile, ownFile, '1']);
  assert.equal(benchmark.summary.completed, 2); assert.equal(benchmark.summary.measuredGames, 2);
  assert.deepEqual(benchmark.games.map(g => g.studentSide), ['P1','P2']);
  assert.equal(benchmark.games[0].result.seed, benchmark.games[1].result.seed);
  assert.ok(!JSON.stringify(benchmark).includes('def choose_move'));
} finally { unlinkSync(ownFile); unlinkSync(badFile); rmdirSync(directory); }
console.log('Real WASI judge passed: all sample bots, full game, timeout forfeit, no host files, read-only stdlib, no subprocess/network/secrets, bounded memory and output.');
