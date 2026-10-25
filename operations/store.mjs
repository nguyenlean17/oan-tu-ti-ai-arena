import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { sha, RUNTIME_VERSION, verifyOfficial, fail } from '../competition/store.mjs';
import { ENGINE_VERSION } from '../lib/engine.mjs';
import { PRACTICE_CONFIG, REFERENCE_BOTS, benchmarkSummary } from '../lib/practice-tools.mjs';

const id = () => 'ops-' + randomUUID();
const practiceConfig = PRACTICE_CONFIG;
const payloadFor = source => ({ source, sha: sha(source), engine: ENGINE_VERSION, runtime: RUNTIME_VERSION, config: practiceConfig });
export function sourceOf(value) {
  if (typeof value !== 'string' || !value.trim() || Buffer.byteLength(value, 'utf8') > 65536) fail('Source cần là Python UTF-8, tối đa 64 KiB.');
  return value;
}
function admin(user) { if (!user?.is_admin) fail('Chỉ BTC được truy cập.', 403); }
async function enqueue(db, kind, subject, payload, pair = null) {
  const job = id();
  await db.prepare('INSERT INTO ops_jobs(id,kind,subject,pair_id,payload,created) VALUES(?,?,?,?,?,?)').run(job, kind, subject, pair, JSON.stringify(payload), Date.now());
  return job;
}
export async function submitPractice(db, user, source) {
  sourceOf(source);
  const duplicate = await db.prepare('SELECT id,status FROM ops_bots WHERE user_id=? AND sha=?').get(user.id, sha(source));
  if (duplicate) return duplicate;
  const quota = await db.prepare("SELECT COUNT(*) total,MAX(created) newest,SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) pending FROM ops_bots WHERE user_id=?").get(user.id);
  if (quota.total >= 50 || quota.pending >= 2 || Date.now() - (quota.newest || 0) < 5000) fail('Giới hạn luyện tập: 50 phiên bản, 2 bài chờ, 1 phiên bản/5 giây.', 429);
  const bot = randomUUID();
  await db.prepare("INSERT INTO ops_bots(id,user_id,source,sha,status,created) VALUES(?,?,?,?,'pending',?)").run(bot, user.id, source, sha(source), Date.now());
  await db.prepare('INSERT INTO ops_ratings(user_id) VALUES(?) ON CONFLICT(user_id) DO NOTHING').run(user.id);
  await enqueue(db, 'practice_validate', bot, payloadFor(source));
  return { id: bot, status: 'pending' };
}
export async function practiceView(db, user) {
  const own = await db.prepare('SELECT id,sha,status,verdict,active,created FROM ops_bots WHERE user_id=? ORDER BY created DESC LIMIT 50').all(user.id);
  const ratings = await db.prepare('SELECT r.*,u.name FROM ops_ratings r JOIN public.auth_users u ON u.id=r.user_id ORDER BY r.rating DESC,r.played DESC,r.user_id LIMIT 100').all();
  const matches = await db.prepare("SELECT p.id,p.created,p.completed,j.id game,j.result FROM ops_pairs p JOIN ops_jobs j ON j.pair_id=p.id WHERE (p.a=? OR p.b=?) AND j.status='done' ORDER BY j.completed DESC LIMIT 20").all(user.id, user.id);
  const rows = await db.prepare("SELECT id,kind,status,payload,result,created FROM ops_jobs WHERE subject=? AND kind IN ('student_validate','benchmark_game') ORDER BY created DESC,id DESC LIMIT 100").all(user.id);
  const checks = [], batches = new Map();
  for (const row of rows) {
    const payload = JSON.parse(row.payload), result = row.result ? JSON.parse(row.result) : null;
    if (row.kind === 'student_validate') checks.push({ id: row.id, status: row.status, created: row.created, sha: payload.sha, result });
    else {
      if (!batches.has(payload.benchmarkId)) batches.set(payload.benchmarkId, { id: payload.benchmarkId, created: row.created, opponent: payload.opponent, pairs: payload.pairs, sha: payload.studentSha, games: [] });
      batches.get(payload.benchmarkId).games.push({ id: row.id, status: row.status, studentSide: payload.studentSide, seed: payload.seed, result });
    }
  }
  return { own, ratings, matches: matches.map(m => ({ ...m, result: JSON.parse(m.result) })), references: REFERENCE_BOTS, checks, benchmarks: [...batches.values()].map(b => ({ ...b, summary: benchmarkSummary(b.games, b.pairs * 2) })), config: practiceConfig, policy: 'Elo K=24; ghép khi lệch tối đa 200 điểm; hai ván đổi bên; tối đa 2 cặp/ngày với cùng đối thủ, 20 cặp/người/ngày. Điểm giải chính thức độc lập.' };
}
async function toolQuota(db, user, kind, maximum, requested) {
  const quota = await db.prepare('SELECT SUM(CASE WHEN status IN (\'queued\',\'running\') THEN 1 ELSE 0 END) pending,MAX(created) newest,SUM(CASE WHEN created>=? THEN 1 ELSE 0 END) today FROM ops_jobs WHERE subject=? AND kind=?').get(Date.now() - 86400000, user.id, kind);
  if (quota.pending > 0 || Date.now() - (quota.newest || 0) < 5000 || (quota.today || 0) + requested > maximum) fail('Công cụ đang có bài chờ, vừa được gọi hoặc đã hết hạn mức 24 giờ. Đợi hoàn tất rồi thử lại.', 429);
}
export async function diagnoseStudent(db, user, source) {
  sourceOf(source);
  const pending = await db.prepare("SELECT id,payload FROM ops_jobs WHERE subject=? AND kind='student_validate' AND status IN ('queued','running') LIMIT 1").get(user.id);
  if (pending && JSON.parse(pending.payload).sha === sha(source)) return { id: pending.id };
  await toolQuota(db, user, 'student_validate', 50, 1);
  return { id: await enqueue(db, 'student_validate', user.id, payloadFor(source)) };
}
export async function benchmarkStudent(db, user, source, opponent, pairs = 1) {
  sourceOf(source);
  const reference = REFERENCE_BOTS.find(b => b.id === opponent);
  if (!reference || !Number.isInteger(pairs) || pairs < 1 || pairs > 5) fail('Chọn bot mẫu hợp lệ và từ 1 đến 5 cặp đổi bên.');
  await toolQuota(db, user, 'benchmark_game', 40, pairs * 2);
  const other = readFileSync(new URL(`../public/bots/${reference.id}.py`, import.meta.url), 'utf8'), benchmarkId = randomUUID(), studentSha = sha(source);
  for (let i = 0; i < pairs; i++) for (const studentSide of ['P1','P2']) {
    const own = { source, sha: studentSha }, rival = { source: other, sha: sha(other) };
    await enqueue(db, 'benchmark_game', user.id, { config: practiceConfig, engine: ENGINE_VERSION, runtime: RUNTIME_VERSION, benchmarkId, pairs, opponent: reference.id, studentSha, studentSide, seed: 42 + i, p1: studentSide === 'P1' ? own : rival, p2: studentSide === 'P2' ? own : rival });
  }
  return { id: benchmarkId };
}
async function matchmake(db, now) {
  const day = new Date(now).setUTCHours(0, 0, 0, 0);
  // Practice yields to official jobs. Daily caps bound background compute.
  const candidates = await db.prepare("SELECT r.*,b.source,b.sha FROM ops_ratings r JOIN ops_bots b ON b.user_id=r.user_id AND b.active=1 AND b.status='valid' WHERE NOT EXISTS(SELECT 1 FROM ops_pairs p WHERE p.completed=0 AND (p.a=r.user_id OR p.b=r.user_id)) AND (SELECT COUNT(*) FROM ops_pairs p WHERE p.created>=? AND (p.a=r.user_id OR p.b=r.user_id))<20 ORDER BY r.updated,r.user_id LIMIT 100").all(day);
  for (const a of candidates) {
    const opponents = candidates.filter(b => b.user_id !== a.user_id && Math.abs(b.rating - a.rating) <= 200).sort((x, y) => Math.abs(x.rating - a.rating) - Math.abs(y.rating - a.rating));
    for (const b of opponents) {
      const [low, high] = [a.user_id, b.user_id].sort();
      const count = await db.prepare('SELECT COUNT(*) n FROM ops_pairs WHERE a=? AND b=? AND created>=?').get(low, high, day);
      if (count.n >= 2) continue;
      const pair = randomUUID(), seed = parseInt(sha(pair).slice(0, 7), 16);
      await db.prepare('INSERT INTO ops_pairs(id,a,b,created) VALUES(?,?,?,?)').run(pair, low, high, now);
      for (const [p1, p2] of [[a, b], [b, a]]) await enqueue(db, 'practice_game', p1.user_id, { config: practiceConfig, engine: ENGINE_VERSION, runtime: RUNTIME_VERSION, seed, p1: { source: p1.source, sha: p1.sha }, p2: { source: p2.source, sha: p2.sha } }, pair);
      return;
    }
  }
}
export async function leaseOperation(db, worker, queue, now = Date.now()) {
  await db.prepare("UPDATE ops_jobs SET status='failed' WHERE status='running' AND until<=? AND attempts>=3").run(now);
  const kinds = queue === 'validate' ? ['practice_validate', 'similarity', 'student_validate'] : ['practice_game', 'selftest', 'benchmark_game'];
  let row = await db.prepare("SELECT * FROM ops_jobs WHERE kind IN (?,?,?) AND (status='queued' OR (status='running' AND until<=?)) AND attempts<3 ORDER BY created LIMIT 1").get(...kinds, now);
  if (!row && queue === 'game') { await matchmake(db, now); row = await db.prepare("SELECT * FROM ops_jobs WHERE kind='practice_game' AND status='queued' ORDER BY created LIMIT 1").get(); }
  if (!row) return null;
  const lease = randomUUID();
  await db.prepare("UPDATE ops_jobs SET status='running',lease=?,worker=?,until=?,attempts=attempts+1 WHERE id=?").run(lease, worker, now + 90000, row.id);
  return { ...row, lease, payload: JSON.parse(row.payload), kind: ['practice_validate','student_validate'].includes(row.kind) ? 'validate' : row.kind };
}
export async function heartbeatOperation(db, worker, job, lease) {
  const row = await db.prepare("SELECT id FROM ops_jobs WHERE id=? AND worker=? AND lease=? AND status='running' AND until>?").get(job, worker, lease, Date.now());
  if (!row) fail('Lease không còn hiệu lực.', 409);
  await db.prepare('UPDATE ops_jobs SET until=? WHERE id=?').run(Date.now() + 90000, job);
  return { ok: true };
}
export function elo(a, b, score) {
  const delta = 24 * (score - 1 / (1 + 10 ** ((b - a) / 400)));
  return [Math.round((a + delta) * 10) / 10, Math.round((b - delta) * 10) / 10];
}
export async function finishOperation(db, worker, job, lease, result) {
  const row = await db.prepare('SELECT * FROM ops_jobs WHERE id=?').get(job);
  const digest = sha(JSON.stringify(result));
  if (row?.status === 'done' && row.worker === worker && row.lease === lease && row.result_hash === digest) return { ok: true, duplicate: true };
  if (!row || row.worker !== worker || row.lease !== lease || row.status !== 'running' || row.until <= Date.now()) fail('Lease cũ hoặc sai worker.', 409);
  const payload = JSON.parse(row.payload);
  if (['practice_validate','student_validate'].includes(row.kind)) {
    if (typeof result?.valid !== 'boolean' || result.sha !== payload.sha || result.engine !== payload.engine || result.runtime !== payload.runtime) fail('Validation không khớp source/runtime.');
    if (row.kind === 'practice_validate') {
    const bot = await db.prepare('SELECT * FROM ops_bots WHERE id=?').get(row.subject);
    const newer = await db.prepare("SELECT id FROM ops_bots WHERE user_id=? AND status='valid' AND created>? LIMIT 1").get(bot.user_id, bot.created);
    if (result.valid && !newer) await db.prepare('UPDATE ops_bots SET active=0 WHERE user_id=?').run(bot.user_id);
    await db.prepare('UPDATE ops_bots SET status=?,verdict=?,active=? WHERE id=?').run(result.valid ? 'valid' : 'invalid', String(result.message || '').slice(0, 1000), result.valid && !newer ? 1 : 0, bot.id);
    }
  } else if (row.kind === 'similarity') {
    if (!Array.isArray(result?.pairs) || !Array.isArray(result.templateExempt) || !Array.isArray(result.errors) || result.pairs.length > 100 || result.compared !== payload.submissions.length) fail('Kết quả review không hợp lệ.');
    for (const pair of result.pairs) if (!payload.submissions.some(s => s.id === pair.a) || !payload.submissions.some(s => s.id === pair.b) || !Number.isFinite(pair.score) || pair.score < 0 || pair.score > 100) fail('Cặp review không hợp lệ.');
  } else verifyOfficial(payload, result);
  const storedResult = row.kind === 'similarity' ? { ...result, labels: Object.fromEntries(payload.submissions.map(s => [s.id, s.name])) } : result;
  await db.prepare("UPDATE ops_jobs SET status='done',result=?,result_hash=?,completed=? WHERE id=?").run(JSON.stringify(storedResult), digest, Date.now(), job);
  if (row.pair_id) {
    const games = await db.prepare("SELECT * FROM ops_jobs WHERE pair_id=? AND kind='practice_game'").all(row.pair_id);
    if (games.length === 2 && games.every(g => g.status === 'done')) {
      const pair = await db.prepare('SELECT * FROM ops_pairs WHERE id=?').get(row.pair_id);
      if (!pair.completed) {
        const points = games.reduce((n, g) => { const r = JSON.parse(g.result); return n + (!r.winner ? 0.5 : ((r.winner === 'P1' ? g.subject : (pair.a === g.subject ? pair.b : pair.a)) === pair.a ? 1 : 0)); }, 0) / 2;
        const a = await db.prepare('SELECT * FROM ops_ratings WHERE user_id=?').get(pair.a), b = await db.prepare('SELECT * FROM ops_ratings WHERE user_id=?').get(pair.b);
        const ratings = elo(a.rating, b.rating, points);
        for (const [user, rating, score] of [[pair.a, ratings[0], points], [pair.b, ratings[1], 1 - points]]) await db.prepare('UPDATE ops_ratings SET rating=?,played=played+1,won=won+?,drawn=drawn+?,lost=lost+?,updated=? WHERE user_id=?').run(rating, +(score > 0.5), +(score === 0.5), +(score < 0.5), Date.now(), user);
        await db.prepare('UPDATE ops_pairs SET completed=? WHERE id=?').run(Date.now(), pair.id);
      }
    }
  }
  return { ok: true };
}
export async function failOperation(db, worker, job, lease) {
  await heartbeatOperation(db, worker, job, lease);
  await db.prepare("UPDATE ops_jobs SET status=CASE WHEN attempts>=3 THEN 'failed' ELSE 'queued' END,until=0 WHERE id=?").run(job);
  return { ok: true };
}
export async function selftest(db, user) {
  admin(user);
  const recent = await db.prepare("SELECT id FROM ops_jobs WHERE kind='selftest' AND (status IN ('queued','running') OR created>?) LIMIT 1").get(Date.now() - 60000);
  if (recent) return recent;
  const source = 'def choose_move(state):\n    return state["legal_moves"][0]\n';
  const payload = payloadFor(source);
  return { id: await enqueue(db, 'selftest', user.id, { ...payload, seed: 42, p1: { source, sha: payload.sha }, p2: { source, sha: payload.sha } }) };
}
export async function review(db, user, event) {
  admin(user);
  const pending = await db.prepare("SELECT id FROM ops_jobs WHERE kind='similarity' AND subject=? AND status IN ('queued','running')").get(event);
  if (pending) return pending;
  const rows = await db.prepare("SELECT v.id,v.source,t.name FROM teams t JOIN submissions v ON v.team=t.id WHERE t.event=? AND v.status='valid' AND v.created=(SELECT MAX(s.created) FROM submissions s WHERE s.team=t.id AND s.status='valid') ORDER BY t.id LIMIT 101").all(event);
  let partial = rows.length > 100;
  if (rows.length < 2) fail('Cần ít nhất 2 bài hợp lệ để review.');
  const templates = ['starter_config', 'heuristic_hunter', 'sprinter', 'guardian', 'tactician'].map(name => readFileSync(new URL(`../public/bots/${name}.py`, import.meta.url), 'utf8'));
  const submissions = rows.slice(0, 100);
  while (Buffer.byteLength(JSON.stringify({ submissions, templates })) > 7500000 && submissions.length > 2) { submissions.pop(); partial = true; }
  return { id: await enqueue(db, 'similarity', event, { submissions, templates, partial }), partial };
}
