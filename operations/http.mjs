import { readdirSync, statSync, readFileSync } from 'node:fs';
import { sessionUser } from '../lib/vercel-auth-store.mjs';
import { withCompetition } from '../competition/postgres.mjs';
import { fail, RUNTIME_VERSION } from '../competition/store.mjs';
import { practiceView, submitPractice, diagnoseStudent, benchmarkStudent, selftest, review } from './store.mjs';

let lastLoad = null;
function localEvidence() {
  let backup = null, restore = null, load = null;
  try {
    const files = readdirSync('/run/arena-backups').filter(f => /^arena-[\w.:-]+\.dump$/.test(f));
    backup = files.map(name => ({ name, ...statSync('/run/arena-backups/' + name) })).sort((a, b) => b.mtimeMs - a.mtimeMs)[0];
    if (backup) backup = { name: backup.name, bytes: backup.size, at: backup.mtimeMs };
    restore = JSON.parse(readFileSync('/run/arena-backups/restore-verified.json', 'utf8'));
  } catch { /* No evidence is an unknown state, never an invented success. */ }
  if (process.env.ARENA_LOAD_DEMO === '1') {
    try { lastLoad = JSON.parse(readFileSync('/run/arena-operations/load-state.json', 'utf8')); } catch { /* Keep the last complete snapshot during a concurrent write. */ }
    load = lastLoad;
  }
  return { backup, restore, load };
}
async function metrics(db) {
  const stamp = Date.now();
  const { backup, restore, load } = localEvidence();
  const scope = Array.isArray(load?.eventIds) && load.eventIds.length === 2 && load.eventIds.every(x => typeof x === 'string') ? load.eventIds : [];
  const jobs = await db.prepare('SELECT kind,status,COUNT(*) count,MIN(created) oldest FROM jobs' + (scope.length ? ' WHERE event IN (?,?)' : '') + ' GROUP BY kind,status').all(...scope);
  const operations = await db.prepare('SELECT kind,status,COUNT(*) count,MIN(created) oldest FROM ops_jobs GROUP BY kind,status').all();
  const submissions = await db.prepare('SELECT status,COUNT(*) count FROM submissions' + (scope.length ? ' WHERE team IN (SELECT id FROM teams WHERE event IN (?,?))' : '') + ' GROUP BY status').all(...scope);
  const workers = await db.prepare('SELECT id,seen,runtime FROM workers ORDER BY seen DESC LIMIT 50').all();
  const checks = await db.prepare("SELECT id,completed,result FROM ops_jobs WHERE kind='selftest' AND status='done' ORDER BY completed DESC LIMIT 1").get();
  const reviews = await db.prepare("SELECT id,subject,status,created,completed,result FROM ops_jobs WHERE kind='similarity' ORDER BY created DESC LIMIT 5").all();
  const errors = await db.prepare("SELECT id,kind,attempts,status,created FROM jobs WHERE status='failed' ORDER BY created DESC LIMIT 10").all();
  return { at: stamp, jobs, operations, submissions, workers, errors, selftest: checks ? { id: checks.id, at: checks.completed, passed: !['timeout', 'bot_error', 'output_limit', 'invalid_move'].includes(JSON.parse(checks.result).reason) } : null, reviews: reviews.map(r => ({ ...r, result: r.result ? JSON.parse(r.result) : null })), backup, restore, load, deployment: process.env.ARENA_DEPLOYMENT || 'postgres', readiness: { database: true, worker: workers.some(w => stamp - w.seen < 120000 && w.runtime === RUNTIME_VERSION), backup: !!backup && stamp - backup.at < 86400000, restore: !!restore?.restoredToSeparateDatabase, publicHttpsConfigured: (process.env.PUBLIC_ORIGIN || '').startsWith('https:') } };
}
async function queue(db, user, event) {
  const rows = await db.prepare("SELECT v.id,v.sha,v.status,v.verdict,v.created,j.status job_status,(SELECT COUNT(*) FROM jobs q WHERE q.kind='validate' AND q.status='queued' AND q.created<=j.created) position FROM members m JOIN submissions v ON v.team=m.team LEFT JOIN jobs j ON j.subject=v.id AND j.kind='validate' WHERE m.user=? AND m.event=? ORDER BY v.created DESC,v.id DESC LIMIT 10").all(user.id, event);
  return { at: Date.now(), submissions: rows.map(r => ({ ...r, ageMs: Date.now() - r.created, position: r.job_status === 'queued' ? r.position : null })) };
}
export async function operationsRequest(request) {
  const send = (status, data) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
  try {
    const url = new URL(request.url);
    // This read-only view exists only on the explicitly isolated demo profile,
    // whose published port binds loopback. It grants no mutation/admin rights.
    if (request.method === 'GET' && url.searchParams.get('view') === 'demo' && process.env.ARENA_LOAD_DEMO === '1') return send(200, await withCompetition(metrics));
    const token = (request.headers.get('cookie') || '').split(';').map(s => s.trim()).find(s => s.startsWith('arena_session='))?.slice(14);
    const user = await sessionUser(token);
    if (!user) fail('Bạn cần đăng nhập.', 401);
    if (request.method === 'GET') {
      const view = url.searchParams.get('view') || 'metrics';
      if (view === 'practice') return send(200, await withCompetition(db => practiceView(db, user)));
      if (view === 'queue') return send(200, await withCompetition(db => queue(db, user, url.searchParams.get('event'))));
      if (!user.is_admin) fail('Chỉ BTC được truy cập.', 403);
      if (view !== 'metrics') fail('View không hợp lệ.');
      return send(200, await withCompetition(metrics));
    }
    if (request.method !== 'POST') fail('Method not allowed', 405);
    if (request.headers.get('origin') !== (process.env.PUBLIC_ORIGIN || url.origin) || request.headers.get('sec-fetch-site') === 'cross-site') fail('Origin không hợp lệ.', 403);
    if (!(request.headers.get('content-type') || '').startsWith('application/json')) fail('Cần JSON.', 415);
    const reader = request.body?.getReader(); let bytes = 0, parts = [];
    if (reader) for (;;) { const { done, value } = await reader.read(); if (done) break; bytes += value.length; if (bytes > 100000) { await reader.cancel(); fail('Request quá lớn.', 413); } parts.push(value); }
    let body; try { body = JSON.parse(Buffer.concat(parts).toString('utf8')); } catch { fail('JSON không hợp lệ.'); }
    if (!body || typeof body !== 'object') fail('JSON không hợp lệ.');
    if (body.action === 'practice_submit') return send(200, await withCompetition(db => submitPractice(db, user, body.source), { write: true }));
    if (body.action === 'student_validate') return send(200, await withCompetition(db => diagnoseStudent(db, user, body.source), { write: true }));
    if (body.action === 'benchmark') return send(200, await withCompetition(db => benchmarkStudent(db, user, body.source, body.opponent, body.pairs), { write: true }));
    if (!user.is_admin) fail('Chỉ BTC được thực hiện.', 403);
    if (body.action === 'selftest') return send(200, await withCompetition(db => selftest(db, user), { write: true }));
    if (body.action === 'review' && typeof body.event === 'string' && body.event.length <= 100) return send(200, await withCompetition(db => review(db, user, body.event), { write: true }));
    fail('Thao tác không hợp lệ.');
  } catch (error) { return send(error.status || 503, { error: error.status ? error.message : 'Hệ thống vận hành chưa sẵn sàng. Kiểm tra migration PostgreSQL và worker.' }); }
}
