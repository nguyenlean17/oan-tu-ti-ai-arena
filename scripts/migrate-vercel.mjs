import { readFile } from 'node:fs/promises';
import { neon } from '@neondatabase/serverless';
if (!process.env.DATABASE_URL) throw new Error('Connect the Neon database to this Vercel environment before building (DATABASE_URL is required).');
const sql = neon(process.env.DATABASE_URL);
const statements = (await readFile(new URL('../deploy/vercel-schema.sql', import.meta.url),'utf8')).split(';').map(s=>s.trim()).filter(Boolean);
await sql.transaction(statements.map(text=>sql.query(text)));
console.log('Vercel database schema is ready. Existing accounts and records preserved.');
