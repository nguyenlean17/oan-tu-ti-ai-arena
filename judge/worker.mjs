import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { RUNTIME_VERSION } from '../competition/store.mjs';
import { runGame, validateBot } from './runner.mjs';

const base = process.env.CONTROL_URL || 'http://app:3000';
const key = (process.env.JUDGE_TOKEN_FILE ? readFileSync(process.env.JUDGE_TOKEN_FILE, 'utf8') : process.env.JUDGE_TOKEN || '').trim();
if (key.length < 32) throw new Error('Create the shared worker secret with npm run competition:init.');
const worker = process.env.WORKER_ID || `judge-${randomUUID()}`;
let stopping = false;
process.on('SIGTERM', () => { stopping = true; });
process.on('SIGINT', () => { stopping = true; });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function call(body) {
  const r = await fetch(base + '/api/judge', { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, worker, runtime: RUNTIME_VERSION }), signal: AbortSignal.timeout(15000) });
  const data = await r.json();
  if (!r.ok) throw Object.assign(new Error(data.error || 'Control unavailable'), { status: r.status });
  return data;
}
console.log(`Judge ${worker}: ${RUNTIME_VERSION}`);
async function work(queue) {
while (!stopping) {
  let job = null, timer;
  try {
    job = await call({ action: 'lease', queue });
    if (!job) { await sleep(1500); continue; }
    let leaseLost = false;
    timer = setInterval(() => { call({ action: 'heartbeat', job: job.id, lease: job.lease }).catch(error => { if (error.status === 409) leaseLost = true; }); }, 20000);
    const result = await (job.kind === 'validate' ? validateBot(job.payload) : runGame(job.payload));
    if (leaseLost) throw new Error('Lease expired');
    // Retrying the exact result is safe: the control commits once by lease + hash.
    for (let attempt = 0; ; attempt++) {
      try { await call({ action: 'finish', job: job.id, lease: job.lease, result }); break; }
      catch (error) { if (attempt >= 2 || error.status === 409 || error.status === 400) throw error; await sleep(1000); }
    }
    console.log(`Completed ${job.kind} ${job.id}`);
  } catch (error) {
    console.error(`Judge request failed (${error.status || 'runtime/network'}). No source or secrets logged.`);
    if (job) await call({ action: 'fail', job: job.id, lease: job.lease }).catch(() => {});
    await sleep(3000);
  } finally { clearInterval(timer); }
}
}
// One reserved validation slot keeps long games from blocking submission feedback.
// Each replica adds one game slot and one validation slot; no in-memory job queue.
await Promise.all([work('validate'), work('game')]);
