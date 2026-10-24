import { env } from '@/lib/platform';
import { validRequestOrigin } from '../../../lib/request-origin.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    if (!validRequestOrigin(request)) return Response.json({ error: 'Origin không hợp lệ.' }, { status: 403 });
    if (Number(request.headers.get('content-length') || 0) > 4096) return Response.json({ error: 'Dữ liệu quá lớn.' }, { status: 413 });
    const input = await request.json() as { token?: string; password?: string; confirm?: string };
    if (!input.token || input.password !== input.confirm) return Response.json({ error: 'Liên kết không hợp lệ hoặc hai lần nhập mật khẩu không khớp.' }, { status: 400 });
    if ((env as unknown as Record<string, unknown>).ARENA_AUTH_PROVIDER === 'docker') {
      const { openStore, resetPassword } = await import('../../../docker/auth-store.mjs');
      const db = openStore(process.env.DATA_DIR || '/data');
      try { await resetPassword(db, input.token, input.password); } finally { db.close(); }
    } else {
      const { resetPassword } = await import('../../../lib/vercel-auth-store.mjs');
      await resetPassword(input.token, input.password);
    }
    return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const status = (error as { status?: number }).status || 503;
    return Response.json({ error: error instanceof Error ? error.message : 'Không thể đặt lại mật khẩu.' }, { status, headers: { 'Cache-Control': 'no-store' } });
  }
}
