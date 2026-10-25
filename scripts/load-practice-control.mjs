// Internal test-harness control, never exposed by the application API.
import pg from 'pg';
import { readFileSync } from 'node:fs';
if (process.env.ARENA_LOAD_DEMO !== '1') throw new Error('Isolated load profile required');
const db = new pg.Client({ connectionString: readFileSync(process.env.DATABASE_URL_FILE, 'utf8').trim() });
await db.connect();
try {
  await db.query('BEGIN');
  if (process.argv[2] === 'pause') {
    const rows = await db.query("UPDATE arena_competition.ops_bots SET active=0 WHERE active=1 AND user_id LIKE 'load-%' RETURNING id");
    console.log(JSON.stringify(rows.rows.map(r => r.id)));
  } else if (process.argv[2] === 'resume') {
    const ids = JSON.parse(process.argv[3]);
    if (!Array.isArray(ids) || ids.length > 100 || ids.some(s => !/^[a-f0-9-]{36}$/.test(s))) throw new Error('Invalid fixture identifiers');
    await db.query("UPDATE arena_competition.ops_bots SET active=1 WHERE id=ANY($1::text[]) AND user_id LIKE 'load-%' AND status='valid'", [ids]);
  } else throw new Error('Expected pause or resume');
  await db.query('COMMIT');
} catch (error) { await db.query('ROLLBACK'); throw error; }
finally { await db.end(); }
