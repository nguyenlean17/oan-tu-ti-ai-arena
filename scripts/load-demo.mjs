import { spawn } from 'node:child_process';
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { CloudClient } from '../tests/cloud-client.mjs';
import { verifyExport } from './verify-tournament-export.mjs';

const base = 'http://localhost:3002', compose = ['compose', '-f', 'compose.load.yaml'];
const total = Number(process.env.LOAD_TOTAL || 4000), workers = Math.min(2, Math.max(1, Number(process.env.LOAD_WORKERS || 2)));
const state = { name: 'LOAD UET Arena', scope: 'HTTP local và sandbox thật; session fixture tạo trước.', startedAt: Date.now(), phase: 'Chuẩn bị', total, sent: 0, accepted: 0, errors: 0, retries: 0, concurrency: 0, samples: [], events: [], resources: [], statuses: {}, completed: false };
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const run = (command, args, env = {}) => new Promise((resolve, reject) => {
  const p = spawn(command, args, { shell: false, windowsHide: true, env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] }); let out = '', err = '';
  p.stdout.on('data', d => { out += d; }); p.stderr.on('data', d => { err = (err + d).slice(-6000); }); p.on('error', reject);
  p.on('close', code => code === 0 ? resolve(out.trim()) : reject(new Error(`Local test step failed (${code}): ${err.slice(-600)}`)));
});
mkdirSync('output/operations', { recursive: true }); mkdirSync('.secrets', { recursive: true });
function save() {
  state.updatedAt = Date.now();
  // Windows/WSL bind mounts can hold the destination open and refuse rename.
  // This is ephemeral telemetry; readers retain their last complete snapshot.
  try { writeFileSync('output/operations/load-state.json', JSON.stringify(state)); }
  catch { state.telemetryWriteErrors = (state.telemetryWriteErrors || 0) + 1; }
}
function event(message) { state.events.push({ at: Date.now(), message }); save(); console.log(message); }
const admin = new CloudClient(base); let fixtures, pollTimer, resourceTimer, faulted = null, recovery, pausedPractice = null;
const practiceControl = (...args) => run('docker', [...compose, 'run', '--rm', '--no-deps', '-v', process.cwd() + ':/workspace', '-w', '/workspace', 'app', 'node', 'scripts/load-practice-control.mjs', ...args]);
let windowLatencies = [], windowAccepted = 0, lastSample = Date.now(), lastMetrics;
async function sample() {
  try {
    lastMetrics = await admin.call('/api/operations');
    const now = Date.now(), sorted = windowLatencies.sort((a, b) => a - b), queue = lastMetrics.jobs.filter(j => j.status === 'queued').reduce((n, j) => n + j.count, 0), done = lastMetrics.jobs.filter(j => j.status === 'done').reduce((n, j) => n + j.count, 0);
    state.samples.push({ at: now, rps: Math.round(windowAccepted * 10000 / Math.max(1, now - lastSample)) / 10, p95: sorted.length ? Math.round(sorted[Math.ceil(sorted.length * .95) - 1]) : 0, queued: queue, running: lastMetrics.jobs.filter(j => j.status === 'running').reduce((n, j) => n + j.count, 0), done, accepted: state.accepted });
    state.samples = state.samples.slice(-1800); windowLatencies = []; windowAccepted = 0; lastSample = now;
    state.validation = lastMetrics.submissions; state.jobs = lastMetrics.jobs; state.operationJobs = lastMetrics.operations;
    save();
  } catch { state.telemetryErrors = (state.telemetryErrors || 0) + 1; save(); }
}
async function resources() {
  try {
    const ids = (await run('docker', ['ps', '-q', '--filter', 'label=com.docker.compose.project=uet-arena-load'])).split(/\s+/).filter(Boolean);
    if (!ids.length) return;
    const out = await run('docker', ['stats', '--no-stream', '--format', '{{json .}}', ...ids]);
    state.resources = out.split('\n').filter(Boolean).map(line => JSON.parse(line)).map(r => ({ name: r.Name, cpu: r.CPUPerc, memory: r.MemUsage })); save();
  } catch { /* Missing resource samples do not become fabricated zeroes. */ }
}
async function request(user, eventId, source, measured = false) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const started = performance.now();
    if (measured) state.sent++;
    let response, data;
    try {
      response = await fetch(base + '/api/competition', { method: 'POST', headers: { Cookie: `arena_session=${user.token}`, Origin: base, 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'submit', event: eventId, source }), signal: AbortSignal.timeout(45000) });
      data = await response.json();
    } catch (error) {
      if (measured) { state.errors++; state.statuses.NETWORK = (state.statuses.NETWORK || 0) + 1; windowLatencies.push(performance.now() - started); }
      if (attempt >= 4) throw error;
      if (measured) state.retries++;
      await sleep(1500); continue;
    }
    if (measured) { state.statuses[response.status] = (state.statuses[response.status] || 0) + 1; windowLatencies.push(performance.now() - started); }
    if (response.ok) { if (measured) { state.accepted++; windowAccepted++; } return data; }
    if (measured) state.errors++;
    if (![429, 503].includes(response.status) || attempt >= 4) throw new Error(`Submission returned ${response.status}`);
    if (measured) state.retries++;
    await sleep(Math.max(1000, Number(response.headers.get('retry-after')) * 1000 || 3000));
  }
}
async function parallel(items, concurrency, fn) { let index = 0; await Promise.all(Array.from({ length: concurrency }, async () => { for (;;) { const i = index++; if (i >= items.length) return; await fn(items[i], i); } })); }
async function until(fn, label, timeout = 1200000) { const start = Date.now(); for (;;) { if (await fn()) return; if (Date.now() - start > timeout) throw new Error('Timed out: ' + label); await sleep(1500); } }
try {
  await run(process.execPath, ['scripts/load-init.mjs']);
  event('Chuẩn bị Docker project uet-arena-load; database riêng, cổng 3002.');
  await run('docker', [...compose, 'up', '-d', '--scale', 'judge=' + workers, '--wait']);
  const raw = await run('docker', [...compose, 'run', '--rm', '--no-deps', '-e', 'LOAD_TOTAL=' + total, '-v', process.cwd() + ':/workspace', '-w', '/workspace', 'app', 'node', 'scripts/load-fixtures.mjs']);
  fixtures = JSON.parse(raw.split('\n').at(-1));
  writeFileSync('.secrets/load-fixtures.json', JSON.stringify(fixtures), { mode: 0o600 });
  writeFileSync('.secrets/load-admin.json', JSON.stringify({ email: fixtures.admin.email, password: fixtures.admin.password, origin: base }), { mode: 0o600 });
  state.run = fixtures.run; state.eventIds = [fixtures.event, fixtures.tournament]; state.tournament = fixtures.tournament;
  state.scope = `HTTP trên stack Docker riêng; ${total} session fixture đã tạo trước; concurrency tối đa 64, không phải ${total} người đồng thời. Không đo chi phí đăng nhập hàng loạt.`;
  await admin.login(fixtures.admin.email, fixtures.admin.password);
  event(`Đã tạo ${total} tài khoản/đội fixture; dashboard ${base}/operations.`);
  pollTimer = setInterval(() => { if (!sample.busy) { sample.busy = true; sample().finally(() => { sample.busy = false; }); } }, 1000);
  resourceTimer = setInterval(() => { if (!resources.busy) { resources.busy = true; resources().finally(() => { resources.busy = false; }); } }, 5000);
  await sample(); await resources();
  state.phase = 'Kiểm tra chức năng'; save();
  const student = new CloudClient(base); await student.register(`load-register-${fixtures.run}@vnu.edu.vn`, 'Đăng ký thử tải', randomBytes(24).toString('base64url')); event('Đăng ký VNU qua HTTP thành công; tài khoản này không dùng làm thước đo throughput.');
  const source = 'def choose_move(state):\n    return state["legal_moves"][0]\n';
  await parallel(fixtures.users.slice(0, 32), 8, user => request(user, fixtures.tournament, source));
  await admin.call('/api/operations', { action: 'selftest' });
  for (const [i, name] of ['starter_config', 'heuristic_hunter'].entries()) {
    const c = new CloudClient(base); c.jar.set('arena_session', fixtures.users[i].token);
    await c.call('/api/operations', { action: 'practice_submit', source: readFileSync(`public/bots/${name}.py`, 'utf8') });
  }
  await until(async () => { const d = await admin.call('/api/competition?event=' + fixtures.tournament); return !d.jobs.some(j => j.kind === 'validate' && ['queued', 'running'].includes(j.status)); }, '32 demo validations');
  await admin.call('/api/operations', { action: 'review', event: fixtures.tournament });
  await run(process.execPath, ['tests/local-backup.test.mjs'], { ARENA_COMPOSE_FILE: 'compose.load.yaml', ARENA_BACKUP_DIRECTORY: 'backups/load' });
  event('Backup đã được restore vào database riêng và đối chiếu số bản ghi thành công.');
  await admin.post({ action: 'config', event: fixtures.tournament, config: { ...fixtures.config, groupCount: 8, qualifiers: 2, deadline: new Date(Date.now() - 1000).toISOString() } });
  await admin.post({ action: 'freeze', event: fixtures.tournament });
  event('Giải 32 đội đã khóa: chấm 126 ván chính thức tối thiểu đồng thời với burst nhận bài.');
  const stages = [1, 8, 16, 32, 64], weights = [.025, .075, .15, .25, .5]; let offset = 0;
  for (let stage = 0; stage < stages.length; stage++) {
    const end = stage === stages.length - 1 ? total : offset + Math.floor(total * weights[stage]);
    state.phase = 'Phát tải HTTP'; state.concurrency = stages[stage]; event(`Tăng tải: concurrency ${stages[stage]}, đội ${offset + 1}–${end}.`);
    if (stage === 3 && workers > 1 && process.env.LOAD_CHAOS !== '0') {
      const ids = (await run('docker', [...compose, 'ps', '-q', 'judge'])).split(/\s+/).filter(Boolean);
      if (ids[0]) {
        const labels = JSON.parse(await run('docker', ['inspect', '--format', '{{json .Config.Labels}}', ids[0]]));
        if (labels['com.docker.compose.project'] !== 'uet-arena-load') throw new Error('Refusing to stop a non-test worker');
        faulted = ids[0]; await run('docker', ['stop', '--time', '2', faulted]); event('CHAOS: đã dừng một worker của riêng phiên load; lease đang chạy sẽ hết hạn và cấp lại.');
        recovery = sleep(8000).then(async () => { await run('docker', ['start', faulted]); faulted = null; event('CHAOS: worker đã bật lại; kiểm tra queue tiếp tục và lease cũ được thu hồi.'); });
      }
    }
    const batch = fixtures.users.slice(offset, end); const startIndex = offset;
    await parallel(batch, stages[stage], (user, i) => {
      const index = startIndex + i;
      let code = source + `\n# LOAD fixture ${index}\n`;
      if (index >= total - 8) code = index % 2 ? 'print("x"*100000)\n' + code : 'def choose_move(state):\n    return {"from":"A1","to":"I9"}\n';
      return request(user, fixtures.event, code, true);
    });
    offset = end; await sleep(1500);
  }
  await recovery;
  state.phase = 'Xả backlog và xác minh'; event(`Đã nhận ${state.accepted}/${total} bài qua HTTP; chờ sandbox xử lý hết, không coi HTTP 200 là chấm xong.`);
  await until(async () => { const d = await admin.call('/api/competition?event=' + fixtures.event); return !d.jobs.some(j => ['queued', 'running'].includes(j.status)); }, 'load queue drain');
  const loadEvent = await admin.call('/api/competition?event=' + fixtures.event);
  if (loadEvent.failed.length) throw new Error('Infrastructure jobs remain failed');
  await until(async () => { const d = await admin.call('/api/competition?event=' + fixtures.tournament); return d.event.status === 'review'; }, '32 team tournament');
  await admin.post({ action: 'publish', event: fixtures.tournament });
  const exported = await admin.call('/api/competition?event=' + fixtures.tournament + '&export=1');
  state.tournamentVerification = verifyExport(exported);
  const trainee = new CloudClient(base); trainee.jar.set('arena_session', fixtures.users[0].token);
  await until(async () => {
    const p = await trainee.call('/api/operations?view=practice');
    const m = await admin.call('/api/operations');
    return p.ratings.length >= 2 && p.ratings.every(r => r.played >= 2) && m.selftest?.passed && m.reviews.some(r => r.subject === fixtures.tournament && r.status === 'done');
  }, 'practice ladder, selftest and advisory review');
  pausedPractice = JSON.parse((await practiceControl('pause')).split('\n').at(-1));
  await until(async () => { const m = await admin.call('/api/operations'); return !m.operations.some(j => j.kind === 'practice_game' && ['queued', 'running'].includes(j.status)); }, 'quiescent practice snapshot');
  const beforeRestart = await trainee.call('/api/operations?view=practice');
  event('Đã chấm xong đấu tập Elo và review AST; kiểm tra dữ liệu bền vững qua restart app.');
  await run('docker', [...compose, 'restart', 'app']);
  await until(async () => { try { return (await fetch(base + '/health', { signal: AbortSignal.timeout(3000) })).ok; } catch { return false; } }, 'app restart', 90000);
  const afterRestart = await trainee.call('/api/operations?view=practice');
  if (JSON.stringify(beforeRestart.ratings) !== JSON.stringify(afterRestart.ratings)) throw new Error('Practice ratings changed across restart');
  state.practicePersistence = { verified: true, ratings: afterRestart.ratings.map(({ name, rating, played, won, drawn, lost }) => ({ name, rating, played, won, drawn, lost })) };
  await practiceControl('resume', JSON.stringify(pausedPractice)); pausedPractice = null;
  await sample();
  state.phase = 'Hoàn tất'; state.completed = true; state.finishedAt = Date.now();
  event(`Đã xác minh ${state.tournamentVerification.verifiedReplays} replay, kết quả commit duy nhất; backlog chính thức đã xử lý hết.`);
} catch (error) {
  state.phase = 'Cần kiểm tra'; state.failure = error.message; event('Phiên thử dừng có kiểm soát: ' + error.message); process.exitCode = 1;
} finally {
  clearInterval(pollTimer); clearInterval(resourceTimer);
  if (faulted) await run('docker', ['start', faulted]).catch(() => {});
  await recovery?.catch(() => {});
  if (pausedPractice) await practiceControl('resume', JSON.stringify(pausedPractice)).catch(() => {});
  save();
  if (fixtures) writeFileSync(`output/operations/report-${fixtures.run}.json`, JSON.stringify(state, null, 2));
  console.log('Dashboard: ' + base + '/operations');
}
