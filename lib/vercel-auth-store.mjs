import { randomBytes, randomUUID, createHash, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { database } from './postgres.mjs';
import { accountAllowed, normalizeEmail, requireValidEmail } from './account-policy.mjs';

const derive = promisify(scrypt);
export const digest = value => createHash('sha256').update(value).digest('hex');
let hashing = 0;
async function hash(password, salt) {
  if (hashing >= 4) throw Object.assign(new Error('Hệ thống đang bận. Hãy thử lại.'), { status: 503 });
  hashing++;
  try { return await derive(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }); }
  finally { hashing--; }
}
export async function sessionUser(token) {
  if (!/^[a-f0-9]{64}$/.test(token || '')) return null;
  const user = await database().prepare('SELECT u.id,u.email,u.name,u.phone,u.is_admin,u.disabled FROM auth_sessions s JOIN auth_users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires>?').bind(digest(token), Date.now()).first();
  return accountAllowed(user) ? user : null;
}
export async function register({ email, name, password, phone = '' }) {
  email = requireValidEmail(email);
  const salt = randomBytes(16).toString('hex'), passwordHash = (await hash(password, salt)).toString('hex');
  const id = `vercel_${randomUUID()}`, db = database();
  try { await db.prepare('INSERT INTO auth_users(id,email,name,phone,salt,password_hash,created) VALUES(?,?,?,?,?,?,?)').bind(id, email, name, phone, salt, passwordHash, Date.now()).run(); }
  catch (e) { if (e.code === '23505') throw Object.assign(new Error('Không thể tạo tài khoản này. Thử đăng nhập hoặc dùng email khác.'), { status: 409 }); throw e; }
  return { id, email, name, phone };
}
export async function removeUnlinkedAccount(userId) {
  await database().prepare('DELETE FROM auth_users WHERE id=?').bind(userId).run();
}
export async function createPasswordReset(userId) {
  const token=randomBytes(32).toString('hex'),stamp=Date.now(),db=database();
  await db.prepare('DELETE FROM auth_password_resets WHERE user_id=?').bind(userId).run();
  await db.prepare('INSERT INTO auth_password_resets(id,user_id,token_hash,expires,created) VALUES(?,?,?,?,?)').bind(randomUUID(),userId,digest(token),stamp+30*60*1000,stamp).run();
  return token;
}
export async function resetPassword(token,password) {
  if(!/^[a-f0-9]{64}$/.test(token||'')||typeof password!=='string'||password.length<12||password.length>128)throw Object.assign(new Error('Liên kết đặt lại không hợp lệ hoặc mật khẩu chưa đạt yêu cầu.'),{status:400});
  const salt=randomBytes(16).toString('hex'),passwordHash=(await hash(password,salt)).toString('hex');
  const row=await database().prepare(`WITH redeemed AS (
    UPDATE auth_password_resets SET used=1 WHERE token_hash=? AND used=0 AND expires>? RETURNING user_id
  ) UPDATE auth_users SET salt=?,password_hash=? WHERE id=(SELECT user_id FROM redeemed) RETURNING id`).bind(digest(token),Date.now(),salt,passwordHash).first();
  if(!row)throw Object.assign(new Error('Liên kết đặt lại đã hết hạn hoặc đã được sử dụng.'),{status:400});
  await database().prepare('DELETE FROM auth_sessions WHERE user_id=?').bind(row.id).run();
}
export async function authenticate(email, password) {
  email = normalizeEmail(email);
  const user = await database().prepare('SELECT * FROM auth_users WHERE email=?').bind(email).first();
  const candidate = await hash(password, user?.salt || 'unregistered-account-dummy-salt');
  return timingSafeEqual(candidate, user ? Buffer.from(user.password_hash, 'hex') : Buffer.alloc(64)) && accountAllowed(user) ? user : null;
}
export async function newSession(userId) {
  const token = randomBytes(32).toString('hex'), stamp = Date.now();
  const db = database();
  await db.prepare('DELETE FROM auth_sessions WHERE expires<=?').bind(stamp).run();
  await db.prepare('INSERT INTO auth_sessions(token_hash,user_id,expires,created) VALUES(?,?,?,?)').bind(digest(token), userId, stamp + 604800000, stamp).run();
  await db.prepare('DELETE FROM auth_sessions WHERE user_id=? AND token_hash NOT IN (SELECT token_hash FROM auth_sessions WHERE user_id=? ORDER BY created DESC LIMIT 10)').bind(userId,userId).run();
  return token;
}
export async function revokeSession(token) {
  if (/^[a-f0-9]{64}$/.test(token || '')) await database().prepare('DELETE FROM auth_sessions WHERE token_hash=?').bind(digest(token)).run();
}
export async function consumeAttempt(ip, email) {
  const db = database(), stamp = Date.now();
  // Each increment is atomic in Postgres, including simultaneous requests from
  // separate Vercel instances. A process-local counter cannot enforce this.
  // Shared university NATs must not lock out an entire class after 30 logins.
  for (const [key, limit] of [[`ip:${ip}`, 10000], [`email:${email}`, 10]]) {
    const row = await db.prepare('INSERT INTO auth_attempts(key,count,expires) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN auth_attempts.expires<=? THEN 1 ELSE auth_attempts.count+1 END,expires=CASE WHEN auth_attempts.expires<=? THEN excluded.expires ELSE auth_attempts.expires END RETURNING count').bind(digest(key), stamp + 900000, stamp, stamp).first();
    if (row.count > limit) return false;
  }
  return true;
}
