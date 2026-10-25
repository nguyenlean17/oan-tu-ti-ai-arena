'use client';
import { useEffect, useState } from 'react';
import type { QueueData } from '../../operations/types';
export default function SubmissionQueue({ event }: { event: string }) {
  const [data, setData] = useState<QueueData | null>(null), [error, setError] = useState('');
  useEffect(() => { let active = true; async function poll() { try { const r = await fetch('/api/operations?view=queue&event=' + encodeURIComponent(event), { cache: 'no-store' }); const d = await r.json() as QueueData & { error?: string }; if (!r.ok) throw new Error(d.error); if (active) { setData(d); setError(''); } } catch (e) { if (active) setError((e as Error).message); } } poll(); const timer = setInterval(poll, 3000); return () => { active = false; clearInterval(timer); }; }, [event]);
  return <div className="tc-queue-status" aria-live="polite"><h3>Tiến độ kiểm tra bài của đội</h3>{error ? <p>{error}</p> : !data?.submissions?.length ? <p>Chưa có bài nộp để theo dõi.</p> : data.submissions.slice(0, 3).map((s) => <p key={s.id}><code>{s.id.slice(0, 8)}</code> · {s.job_status === 'queued' ? `Vị trí hàng đợi: ${s.position} · đã chờ ${Math.round(s.ageMs / 1000)} giây` : s.job_status === 'running' ? 'Sandbox đang kiểm tra' : s.status === 'valid' ? 'Hợp lệ' : s.verdict || s.status}</p>)}<p>Thứ tự có thể thay đổi khi retry; vị trí không phải thời gian chờ dự đoán.</p></div>;
}
