import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import { startGateway } from './gateway.mjs';

const data = process.env.DATA_DIR || '/data';
mkdirSync(data, { recursive: true });
const configPath = 'dist/server/docker.wrangler.json';
const config = JSON.parse(readFileSync('dist/server/wrangler.json', 'utf8'));
config.vars = { ...config.vars, ARENA_AUTH_PROVIDER: 'docker' };
for (const db of config.d1_databases) db.migrations_dir = '../../drizzle';
writeFileSync(configPath, JSON.stringify(config));
const cli = ['--import', './scripts/sites-env.mjs', './node_modules/wrangler/bin/wrangler.js'];
const shared = ['--config', configPath, '--local', '--persist-to', path.join(data, 'arena')];
const migrated = spawnSync(process.execPath, [...cli, 'd1', 'migrations', 'apply', 'DB', ...shared], { stdio: 'inherit' });
if (migrated.status !== 0) process.exit(migrated.status || 1);
const worker = spawn(process.execPath, [...cli, 'dev', ...shared, '--ip', '127.0.0.1', '--port', '8787', '--inspector-port', '0', '--log-level', 'warn'], { stdio: 'inherit' });
let stopping = false;
worker.on('exit', code => { if (!stopping) process.exit(code || 1); });
let ready = false;
for (let i = 0; i < 100; i++) {
  try { const r = await fetch('http://127.0.0.1:8787/favicon.svg'); await r.arrayBuffer(); if (r.ok) { ready = true; break; } } catch {}
  await new Promise(resolve => setTimeout(resolve, 300));
}
if (!ready) { worker.kill('SIGTERM'); throw new Error('Arena Worker did not become ready.'); }
const gateway = await startGateway();
function stop() { stopping = true; gateway.close(); worker.kill('SIGTERM'); setTimeout(() => process.exit(0), 1500).unref(); }
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
console.log(`Arena ready: ${process.env.PUBLIC_ORIGIN || 'http://localhost:3000'}`);
