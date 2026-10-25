import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import pg from 'pg';
import { connectionString } from '../lib/postgres.mjs';
import { withCompetition } from '../competition/postgres.mjs';
import { submitPractice, leaseOperation, finishOperation, heartbeatOperation, selftest } from '../operations/store.mjs';
import { createInitialBoard, applyMove, referenceMove } from '../lib/engine.mjs';
if (process.env.ARENA_LOAD_DEMO !== '1' && process.env.ARENA_ALLOW_OPERATIONS_TEST !== '1') throw new Error('Explicit operations-test opt-in required; use a disposable local test database');
const schema = 'ops_test_' + randomBytes(8).toString('hex'), client = new pg.Client({ connectionString: connectionString() });
const run = fn => withCompetition(fn, { schema, write: true });
const code = 'def choose_move(state):\n    return state["legal_moves"][0]\n';
await client.connect();
try {
  await client.query('BEGIN');
  await client.query(readFileSync('deploy/competition-schema.sql', 'utf8').replaceAll('arena_competition', schema));
  await client.query('COMMIT');
  const first = await run(db => submitPractice(db, { id: 'a' }, code));
  assert.equal((await run(db => submitPractice(db, { id: 'a' }, code))).id, first.id);
  await run(db => submitPractice(db, { id: 'b' }, code + '\n# b'));
  for (let i = 0; i < 2; i++) {
    const job = await run(db => leaseOperation(db, 'test-worker', 'validate'));
    const result = { valid: true, message: 'fixture', sha: job.payload.sha, engine: job.payload.engine, runtime: job.payload.runtime };
    await assert.rejects(run(db => finishOperation(db, 'wrong-worker', job.id, job.lease, result)), e => e.status === 409);
    await run(db => finishOperation(db, 'test-worker', job.id, job.lease, result));
    assert.equal((await run(db => finishOperation(db, 'test-worker', job.id, job.lease, result))).duplicate, true);
  }
  function resultFor(p) {
    const board = createInitialBoard(), moves = []; let winner = null, reason = 'max_plies';
    for (let i = 0; i < p.config.maxPlies; i++) {
      const side = i % 2 ? 'P2' : 'P1', move = referenceMove(board, side, 'greedy', i + 42);
      if (!move) { winner = side === 'P1' ? 'P2' : 'P1'; reason = 'no_moves'; break; }
      const step = applyMove(board, move, side); moves.push(step); if (step.winner) { winner = step.winner; reason = 'goal'; break; }
    }
    return { moves, winner, reason, seed: p.seed, engine: p.engine, runtime: p.runtime, p1sha: p.p1.sha, p2sha: p.p2.sha };
  }
  for (let i = 0; i < 4; i++) {
    const job = await run(db => leaseOperation(db, 'test-worker', 'game'));
    assert.equal(job.kind, 'practice_game');
    const result = resultFor(job.payload);
    await assert.rejects(run(db => finishOperation(db, 'test-worker', job.id, job.lease, { ...result, seed: -1 })), e => e.status === 400);
    await run(db => heartbeatOperation(db, 'test-worker', job.id, job.lease));
    await run(db => finishOperation(db, 'test-worker', job.id, job.lease, result));
    await run(db => finishOperation(db, 'test-worker', job.id, job.lease, result));
  }
  assert.equal(await run(db => leaseOperation(db, 'test-worker', 'game')), null, 'Daily pair cap must stop background compute');
  const ratings = await run(db => db.prepare('SELECT * FROM ops_ratings ORDER BY user_id').all());
  assert.ok(ratings.every(r => r.played === 2));
  assert.equal(Math.round(ratings.reduce((n, r) => n + r.rating, 0) * 10), 20000);
  assert.equal((await run(db => db.prepare('SELECT COUNT(*) n FROM games').get())).n, 0, 'Practice must not create official games');
  await run(db => selftest(db, { id: 'admin', is_admin: 1 }));
  const probe = await run(db => leaseOperation(db, 'test-worker', 'game'));
  await run(db => db.prepare('UPDATE ops_jobs SET until=0,attempts=3 WHERE id=?').run(probe.id));
  await assert.rejects(run(db => finishOperation(db, 'test-worker', probe.id, probe.lease, resultFor(probe.payload))), e => e.status === 409);
  await run(db => leaseOperation(db, 'test-worker', 'game'));
  assert.equal((await run(db => db.prepare('SELECT status FROM ops_jobs WHERE id=?').get(probe.id))).status, 'failed');
  console.log('PostgreSQL operations passed: duplicate submission/result, stale lease, payload integrity, exactly-once ratings, daily caps and official/practice isolation.');
} finally { await client.query('ROLLBACK').catch(() => {}); await client.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`); await client.end(); }
