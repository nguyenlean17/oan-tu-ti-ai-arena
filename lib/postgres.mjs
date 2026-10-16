import { neon } from '@neondatabase/serverless';

export function sqlForPostgres(input) {
  let index = 0;
  let text = input.replace(/('[^']*(?:''[^']*)*'|"[^"]*"|\?)/g, token => token === '?' ? `$${++index}` : token);
  if (/^INSERT OR IGNORE /i.test(text)) text = text.replace(/^INSERT OR IGNORE /i, 'INSERT ') + ' ON CONFLICT DO NOTHING';
  return text;
}
export function database(url = process.env.DATABASE_URL) {
  if (!url) throw new Error('DATABASE_URL is not configured.');
  const sql = neon(url);
  const query = (text, values = []) => sql.query(sqlForPostgres(text), values, { fullResults: true });
  return {
    query,
    prepare(text) {
      const statement = values => ({
        bind(...next) { return statement(next); },
        async first() { return (await query(text, values)).rows[0] || null; },
        async all() { return { results: (await query(text, values)).rows }; },
        async run() { return { meta: { changes: (await query(text, values)).rowCount || 0 } }; },
      });
      return statement([]);
    },
  };
}
