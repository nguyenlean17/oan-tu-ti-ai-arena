// Internal fixture seeder. Stdout is private and captured by load-demo.mjs.
import pg from 'pg';
import { readFileSync } from 'node:fs';
import { randomBytes, createHash, scryptSync } from 'node:crypto';
if (process.env.ARENA_LOAD_DEMO !== '1') throw new Error('Fixture seeding requires the isolated load profile');
const url = readFileSync(process.env.DATABASE_URL_FILE, 'utf8').trim();
if (new URL(url).hostname !== 'db') throw new Error('Only the isolated Docker database is allowed');
const total = Number(process.env.LOAD_TOTAL || 4000);
if (!Number.isInteger(total) || total < 64 || total > 4000) throw new Error('LOAD_TOTAL must be between 64 and 4000');
const db = new pg.Client({ connectionString: url }); await db.connect();
const run = randomBytes(6).toString('hex'), event = `load-${run}`, tournament = `match-${run}`;
const salt = randomBytes(16).toString('hex'), password = randomBytes(24).toString('base64url');
const passwordHash = scryptSync(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }).toString('hex');
const hash = s => createHash('sha256').update(s).digest('hex');
const now = Date.now(), users = [];
try {
  await db.query('BEGIN');
  await db.query("UPDATE arena_competition.ops_bots SET active=0 WHERE user_id LIKE 'load-%'");
  const admin = { id: `load-admin-${run}`, email: `btc-load-${run}@vnu.edu.vn`, password, name: 'BTC thử tải' };
  await db.query('INSERT INTO public.auth_users(id,email,name,salt,password_hash,created,is_admin) VALUES($1,$2,$3,$4,$5,$6,1)', [admin.id, admin.email, admin.name, salt, passwordHash, now]);
  const config = { groupCount: 128, qualifiers: 2, deadline: new Date(now + 86400000).toISOString(), seed: 2026, maxPlies: 20, moveMs: 1000, startupMs: 8000, memoryMB: 128, extraSets: 0 };
  await db.query("INSERT INTO arena_competition.events(id,name,status,config,created) VALUES($1,$2,'open',$3,$4),($5,$6,'open',$7,$4)", [event, `LOAD · ${total} bot tổng hợp · ${run}`, JSON.stringify(config), now, tournament, `DEMO · 32 đội dưới tải · ${run}`, JSON.stringify({ ...config, groupCount: 8, qualifiers: 2 })]);
  for (let start = 0; start < total; start += 100) {
    const batch = [];
    for (let i = start; i < Math.min(total, start + 100); i++) {
      const user = { id: `load-${run}-${i}`, email: `load-${run}-${i}@vnu.edu.vn`, token: randomBytes(32).toString('hex'), team: `team-${run}-${i}` };
      users.push(user); batch.push(user);
    }
    const tuples = (values, params) => values.map(row => '(' + row.map(v => { params.push(v); return '$' + params.length; }).join(',') + ')').join(',');
    let params = [];
    await db.query('INSERT INTO public.auth_users(id,email,name,salt,password_hash,created,is_admin) VALUES ' + tuples(batch.map((u, i) => [u.id, u.email, `Sinh viên LOAD ${start + i + 1}`, salt, passwordHash, now, 0]), params), params);
    params = [];
    await db.query('INSERT INTO public.auth_sessions(token_hash,user_id,expires,created) VALUES ' + tuples(batch.map(u => [hash(u.token), u.id, now + 86400000, now]), params), params);
    params = [];
    await db.query('INSERT INTO arena_competition.teams(id,event,name,seed) VALUES ' + tuples(batch.map((u, i) => [u.team, event, `LOAD ${start + i + 1}`, start + i + 1]), params), params);
    params = [];
    await db.query('INSERT INTO arena_competition.members(event,"user",team,student) VALUES ' + tuples(batch.map((u, i) => [event, u.id, u.team, `LOAD-${run}-${start + i}`]), params), params);
  }
  for (const [i, u] of users.slice(0, 32).entries()) {
    await db.query('INSERT INTO arena_competition.teams(id,event,name,seed) VALUES($1,$2,$3,$4)', ['demo-' + u.team, tournament, `DEMO ${i + 1}`, i + 1]);
    await db.query('INSERT INTO arena_competition.members(event,"user",team,student) VALUES($1,$2,$3,$4)', [tournament, u.id, 'demo-' + u.team, `DEMO-${run}-${i}`]);
  }
  await db.query('COMMIT');
  console.log(JSON.stringify({ run, event, tournament, total, admin, users, config }));
} catch (error) { await db.query('ROLLBACK'); throw error; }
finally { await db.end(); }
