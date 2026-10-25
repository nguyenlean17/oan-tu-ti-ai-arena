import { mkdirSync, existsSync, writeFileSync, readFileSync, chownSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
for (const dir of ['.secrets', 'backups/load', 'output/operations']) mkdirSync(dir, { recursive: true });
const password = '.secrets/load-postgres-password', url = '.secrets/load-postgres-url', token = '.secrets/load-judge-token';
if (!existsSync(password)) writeFileSync(password, randomBytes(32).toString('hex'), { mode: 0o600 });
if (!existsSync(url)) writeFileSync(url, `postgresql://arena:${readFileSync(password, 'utf8').trim()}@db:5432/arena`, { mode: 0o600 });
if (!existsSync(token)) writeFileSync(token, randomBytes(48).toString('base64url'), { mode: 0o600 });
if (process.platform === 'linux' && process.getuid?.() === 0) for (const file of [url, token]) chownSync(file, 1000, 1000);
console.log('Isolated load-test secrets prepared; normal local/cloud credentials are untouched.');
