import { getArenaUser } from '../../arena-auth';
import { env } from '@/lib/platform';
import { validRequestOrigin } from '../../../lib/request-origin.mjs';
import { deleteParticipantAccount, openCompetition } from '../../../competition/store.mjs';
import { withCompetition } from '../../../competition/postgres.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type AuthStore = {
  prepare(sql: string): {
    all(...values: unknown[]): Promise<unknown[]> | { id: string; email: string; name: string; phone: string; is_admin: number; disabled: number; created: number }[];
    get<T = unknown>(...values: unknown[]): Promise<T> | T;
    run(...values: unknown[]): Promise<unknown> | unknown;
  };
  close?(): void;
};
type CompetitionStore = { prepare(sql: string): { run(...values: unknown[]): Promise<unknown> | unknown } };
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
const isDocker = (env as unknown as Record<string, unknown>).ARENA_AUTH_PROVIDER === 'docker';
async function withAuthStore<T>(callback: (db: AuthStore) => Promise<T>) {
  if (isDocker) {
    const { openStore } = await import('../../../docker/auth-store.mjs');
    const open = openStore;
    const db = open(process.env.DATA_DIR || '/data') as unknown as AuthStore;
    try { return await callback(db); } finally { db.close?.(); }
  }
  const { database } = await import('../../../lib/postgres.mjs');
  const db = database();
  const adapter: AuthStore = {
    prepare(sql) {
      const statement = db.prepare(sql);
      return {
        all: async (...values) => (await statement.bind(...values).all()).results,
        get: (...values) => statement.bind(...values).first(),
        run: (...values) => statement.bind(...values).run(),
      };
    },
  };
  return callback(adapter);
}
async function competitionWrite<T>(callback: (db: CompetitionStore) => Promise<T>) {
  if (isDocker) {
    const db = openCompetition(process.env.DATA_DIR || '/data');
    try { return await callback(db); } finally { db.close(); }
  }
  return withCompetition(callback, { write: true });
}
async function recordAudit(actor: string, action: string, target: string) {
  await competitionWrite(async db => {
    await db.prepare('INSERT INTO audit(actor,event,action,detail,created) VALUES(?,NULL,?,?,?)').run(actor,action,JSON.stringify({ user:target }),Date.now());
  });
}
async function readBody(request: Request) {
  const raw = await request.text();
  if (raw.length > 8192) throw Object.assign(new Error('Dữ liệu quá lớn.'), { status: 413 });
  try { return JSON.parse(raw) as Record<string, unknown>; }
  catch { throw Object.assign(new Error('JSON không hợp lệ.'), { status: 400 }); }
}
function requireAdmin(user: Awaited<ReturnType<typeof getArenaUser>>) {
  if (!user) throw Object.assign(new Error('Bạn cần đăng nhập.'), { status: 401 });
  if (!user.canBootstrap) throw Object.assign(new Error('Chỉ ban tổ chức được quản lý tài khoản.'), { status: 403 });
  return user;
}
export async function GET() {
  try {
    requireAdmin(await getArenaUser());
    const accounts = await withAuthStore(db => Promise.resolve(db.prepare('SELECT id,email,name,phone,is_admin,disabled,created FROM ' + (isDocker ? 'users' : 'auth_users') + ' ORDER BY created DESC LIMIT 1000').all()));
    return json({ accounts, currentUser:(await getArenaUser())?.userId });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Không tải được tài khoản.' }, (error as { status?: number }).status || 503);
  }
}
export async function PATCH(request: Request) {
  try {
    if (!validRequestOrigin(request)) return json({ error: 'Origin không hợp lệ.' }, 403);
    const user = await getArenaUser();
    if (!user) return json({ error: 'Bạn cần đăng nhập.' },401);
    const body = await readBody(request);
    if (body.action === 'profile') {
      const name = String(body.name || '').trim(), phone = String(body.phone || '').trim();
      if (name.length < 2 || name.length > 60 || phone.length < 7 || phone.length > 30) return json({ error: 'Họ tên cần 2–60 ký tự; số điện thoại cần 7–30 ký tự.' }, 400);
      await withAuthStore(db => Promise.resolve(db.prepare(`UPDATE ${isDocker ? 'users' : 'auth_users'} SET name=?,phone=? WHERE id=?`).run(name, phone, user.userId)));
      await competitionWrite(async db => {
        await db.prepare('UPDATE members SET student=? WHERE user=?').run(name,user.userId);
        await db.prepare('UPDATE team_roster SET name=? WHERE account_id=?').run(name,user.userId);
      });
      return json({ ok: true });
    }
    requireAdmin(user);
    const id = String(body.user || '');
    if (!id || (id === user.userId && body.action !== 'reset')) return json({ error: 'Không thể áp dụng thao tác này cho chính tài khoản đang dùng.' }, 400);
    if (body.action === 'reset') {
      const exists = await withAuthStore(db => Promise.resolve(db.prepare(`SELECT id FROM ${isDocker ? 'users' : 'auth_users'} WHERE id=?`).get(id)));
      if (!exists) return json({ error: 'Không tìm thấy tài khoản.' }, 404);
      const token = isDocker
        ? await (async () => {
          const { openStore, createPasswordReset } = await import('../../../docker/auth-store.mjs');
          const db=openStore(process.env.DATA_DIR || '/data');
          try { return createPasswordReset(db,id); } finally { db.close(); }
        })()
        : await (await import('../../../lib/vercel-auth-store.mjs')).createPasswordReset(id);
      await recordAudit(user.userId,'account-reset',id);
      return json({ token, expiresInMinutes: 30 });
    }
    if (!['disable','enable'].includes(String(body.action))) return json({ error: 'Thao tác không hợp lệ.' }, 400);
    await withAuthStore(async db => {
      const table = isDocker ? 'users' : 'auth_users';
      if (body.action === 'disable') {
        const account = await db.prepare(`SELECT is_admin FROM ${table} WHERE id=?`).get<{ is_admin: number }>(id);
        if (!account) throw Object.assign(new Error('Không tìm thấy tài khoản.'), { status: 404 });
        if (account.is_admin) {
          const admins = await db.prepare(`SELECT COUNT(*) count FROM ${table} WHERE is_admin=1 AND disabled=0 AND id<>?`).get<{ count: number }>(id);
          if (!Number(admins.count)) throw Object.assign(new Error('Không thể vô hiệu hóa tài khoản quản trị cuối cùng.'), { status: 409 });
        }
        await db.prepare(`UPDATE ${table} SET disabled=1 WHERE id=?`).run(id);
        await db.prepare(`DELETE FROM ${isDocker ? 'sessions' : 'auth_sessions'} WHERE user_id=?`).run(id);
      } else await db.prepare(`UPDATE ${table} SET disabled=0 WHERE id=?`).run(id);
    });
    await recordAudit(user.userId,`account-${body.action}`,id);
    return json({ ok: true });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Không thể cập nhật tài khoản.' }, (error as { status?: number }).status || 503);
  }
}
export async function DELETE(request: Request) {
  try {
    if (!validRequestOrigin(request)) return json({ error: 'Origin không hợp lệ.' }, 403);
    const actor = requireAdmin(await getArenaUser()), body = await readBody(request), id = String(body.user || ''), confirm = String(body.confirm || '');
    if (!id || id === actor.userId) return json({ error: 'Không thể xóa tài khoản đang đăng nhập.' }, 400);
    await withAuthStore(async db => {
      const table = isDocker ? 'users' : 'auth_users';
      const account = await db.prepare(`SELECT email,is_admin FROM ${table} WHERE id=?`).get<{ email: string; is_admin: number }>(id);
      if (!account || account.email !== confirm) throw Object.assign(new Error('Tài khoản không tồn tại hoặc email xác nhận không khớp.'), { status: 400 });
      if (account.is_admin) {
        const admins = await db.prepare(`SELECT COUNT(*) count FROM ${table} WHERE is_admin=1 AND disabled=0 AND id<>?`).get<{ count: number }>(id);
        if (!Number(admins.count)) throw Object.assign(new Error('Không thể xóa tài khoản quản trị cuối cùng.'), { status: 409 });
      }
      await competitionWrite(db => deleteParticipantAccount(db, { id: actor.userId, is_admin: actor.canBootstrap ? 1 : 0 }, id));
      await db.prepare(`DELETE FROM ${isDocker ? 'sessions' : 'auth_sessions'} WHERE user_id=?`).run(id);
      await db.prepare(`DELETE FROM ${isDocker ? 'password_resets' : 'auth_password_resets'} WHERE user_id=?`).run(id);
      await db.prepare(`DELETE FROM ${table} WHERE id=?`).run(id);
    });
    return json({ ok: true });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Không thể xóa tài khoản.' }, (error as { status?: number }).status || 503);
  }
}
