'use client';
import { useEffect, useState } from 'react';
import '../operations/workspace.css';
import Link from 'next/link';
import type { PracticeData, Mutation, Benchmark, BenchmarkGame } from '../../operations/types';
const starter = 'def choose_move(state):\n    return state["legal_moves"][0]\n';
const statuses: Record<string, string> = { queued: 'Đang chờ', running: 'Đang chạy', done: 'Hoàn tất', failed: 'Lỗi hạ tầng; thử lại sau' };
const statusName = (status: string) => statuses[status] || status;
function download(content: string, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type })), a = document.createElement('a');
  a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default function Practice({ userId }: { userId: string }) {
  const [data, setData] = useState<PracticeData | null>(null), [source, setSource] = useState(starter), [error, setError] = useState(''), [busy, setBusy] = useState(''), [notice, setNotice] = useState('');
  const [opponent, setOpponent] = useState('starter_config'), [pairs, setPairs] = useState(1);
  useEffect(() => {
    let active = true, timer: ReturnType<typeof setTimeout>;
    const controller = new AbortController();
    async function refresh() {
      try {
        const r = await fetch('/api/operations?view=practice', { cache: 'no-store', signal: controller.signal });
        const d = await r.json() as PracticeData & { error?: string };
        if (!r.ok) throw new Error(d.error);
        if (active) setData(d);
      } catch (e) { if (active) setError((e as Error).message); }
      if (active) timer = setTimeout(refresh, 5000);
    }
    refresh(); return () => { active = false; controller.abort(); clearTimeout(timer); };
  }, []);
  async function action(kind: 'practice_submit' | 'student_validate' | 'benchmark') {
    setBusy(kind); setError(''); setNotice('');
    try {
      const r = await fetch('/api/operations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: kind, source, ...(kind === 'benchmark' ? { opponent, pairs } : {}) }) });
      const d = await r.json() as Mutation;
      if (!r.ok) throw new Error(d.error);
      setNotice(kind === 'practice_submit' ? `Đã nhận ${d.id}. Bot hợp lệ sẽ tự ghép đối thủ để tính Elo.` : `Đã xếp hàng ${kind === 'benchmark' ? 'benchmark' : 'tự kiểm tra'} ${d.id}. Xem kết quả bên dưới; lượt này không cập nhật Elo hoặc nộp bài thi.`);
    } catch (e) { setError((e as Error).message); } finally { setBusy(''); }
  }
  async function loadReference() {
    setBusy('load'); setError('');
    try {
      if (!data?.references.some(r => r.id === opponent)) throw new Error('Chọn bot mẫu hợp lệ.');
      const r = await fetch(`/bots/${opponent}.py`);
      if (!r.ok) throw new Error('Không tải được bot mẫu.');
      setSource(await r.text()); setNotice('Đã nạp mã bot mẫu vào editor. Bạn có thể sửa trọng số, tự kiểm tra hoặc benchmark.');
    } catch (e) { setError((e as Error).message); } finally { setBusy(''); }
  }
  async function replay(game: BenchmarkGame) {
    try { const { replayHtml } = await import('../../lib/replay-html.mjs'); download(replayHtml({ result: game.result }), `benchmark-${game.id}.html`, 'text/html;charset=utf-8'); }
    catch (e) { setError((e as Error).message); }
  }
  function report(b: Benchmark) { download(JSON.stringify(b, null, 2), `benchmark-${b.id}.json`, 'application/json'); }
  return <main className="op">
    <header className="op-header"><Link href="/competition" className="op-brand">UET <span>Arena · VNU</span></Link><nav><Link href="/competition">Giải đấu</Link><Link href="/">Editor & bot mẫu</Link></nav></header>
    <div className="op-title"><div><h1>Đấu tập & kiểm tra bot</h1><p>Tự kiểm tra bản nháp, đấu bot mẫu, hoặc tham gia Elo tự ghép. Các lượt thử không ảnh hưởng giải chính thức.</p></div></div>
    {error && <p role="alert" className="op-alert">{error}</p>}{notice && <p role="status" className="op-message">{notice}</p>}
    <section className="op-practice op-section">
      <div>
        <h2>Bot của bạn</h2><p>Python UTF-8, tối đa 64 KiB. Kiểm tra và benchmark dùng cùng WASI với bộ chấm. Nộp Elo sẽ kích hoạt bản hợp lệ mới nhất; rating không reset khi đổi source.</p>
        <form onSubmit={e => { e.preventDefault(); action('practice_submit'); }}>
          <label>Tải tệp Python<input type="file" accept=".py" onChange={async e => { const f = e.target.files?.[0]; if (f) { if (f.size > 65536) setError('Source vượt 64 KiB.'); else setSource(await f.text()); } }} /></label>
          <label>choose_move(state)<textarea value={source} spellCheck={false} onChange={e => setSource(e.target.value)} /></label>
          <div className="op-actions"><button type="button" disabled={!!busy} onClick={() => action('student_validate')}>{busy === 'student_validate' ? 'Đang gửi…' : 'Tự kiểm tra bản nháp'}</button><button disabled={!!busy}>{busy === 'practice_submit' ? 'Đang gửi…' : 'Tham gia đấu tập Elo'}</button></div>
        </form>
        <div className="op-section">
          <h2>Đấu với bot mẫu</h2><p>Chọn đối thủ để benchmark hoặc nạp mã mẫu vào editor, chỉnh chiến thuật và so sánh kết quả.</p>
          <label className="op-field">Bot tham chiếu<select value={opponent} onChange={e => setOpponent(e.target.value)}>{data?.references.map(b => <option value={b.id} key={b.id}>{b.name}</option>)}</select></label>
          <p>{data?.references.find(b => b.id === opponent)?.description}</p>
          <label className="op-field">Số cặp, mỗi cặp hai ván đổi bên<select value={pairs} onChange={e => setPairs(Number(e.target.value))}>{[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} cặp / {n * 2} ván</option>)}</select></label>
          <div className="op-actions"><button disabled={!!busy || !data} onClick={loadReference}>Nạp mã bot mẫu</button><button disabled={!!busy || !data} onClick={() => action('benchmark')}>{busy === 'benchmark' ? 'Đang gửi…' : 'Benchmark bản nháp'}</button></div>
          <p className="op-note">Không tính Elo. Giới hạn 40 ván/24 giờ; một lượt benchmark đang chờ mỗi người. Mỗi ván tối đa {data?.config.maxPlies ?? 40} nước, {data?.config.moveMs ?? 1000} ms/nước; mỗi cặp cùng seed và đổi bên. Worker ưu tiên công việc chính thức.</p>
        </div>
        <h2>Phiên bản tham gia Elo</h2>
        {!data?.own.length && <p>Chưa nộp bot vào Elo. Tự kiểm tra và benchmark không tự đăng ký.</p>}
        <table><thead><tr><th>Phiên bản</th><th>Trạng thái</th><th>Phản hồi</th></tr></thead><tbody>{data?.own.map(b => <tr key={b.id}><td title={b.sha}>{b.sha.slice(0, 12)}</td><td>{b.status}{b.active ? ' · đang dùng' : ''}</td><td>{b.verdict || 'Đợi worker sandbox'}</td></tr>)}</tbody></table>
      </div>
      <div>
        <h2>Bảng xếp hạng luyện tập</h2><p>{data?.policy || 'Đang tải chính sách Elo…'}</p>
        <table><thead><tr><th>Hạng</th><th>Người chơi</th><th>Elo</th><th>Cặp</th><th>T/H/B</th></tr></thead><tbody>{data?.ratings.map((r, i) => <tr key={r.user_id} className={r.user_id === userId ? 'my-rating' : ''}><td>{i + 1}</td><td>{r.name}{r.user_id === userId ? ' · bạn' : ''}</td><td>{r.rating.toFixed(1)}</td><td>{r.played}</td><td>{r.won}/{r.drawn}/{r.lost}</td></tr>)}</tbody></table>
        <h2>Ván Elo gần đây của bạn</h2>{!data?.matches.length && <p>Cần đối thủ hợp lệ trong khoảng Elo cho phép và worker rảnh. Bạn vẫn có thể benchmark với bot mẫu bên trái.</p>}{data?.matches.slice(0, 8).map(m => <p key={m.game}>{m.result.winner || 'Hòa'} · {m.result.reason} · {m.result.moves.length} nước</p>)}
        <div className="op-section"><h2>Kết quả tự kiểm tra</h2><p>Kiểm tra cơ bản ở hai phía; đạt kiểm tra chưa đảm bảo mọi trận đều hợp lệ. E01 cú pháp; E02 giao diện; E03 nước sai; E04 timeout; E05 khả năng không hỗ trợ; E06 tài nguyên/output.</p>
          {!data?.checks.length && <p>Chưa có lượt tự kiểm tra bản nháp.</p>}
          {data?.checks.slice(0, 8).map(c => <div className="op-tool-result" key={c.id}><strong>{c.sha.slice(0, 12)} · {statusName(c.status)}{c.result ? c.result.valid ? ' · Đạt' : ' · Chưa đạt' : ''}</strong><p>{c.result?.message || (c.status === 'failed' ? 'Worker không hoàn tất sau số lần thử cho phép; thử lại sau.' : 'Đợi worker WASI.')}</p></div>)}
        </div>
      </div>
    </section>
    <section className="op-section"><h2>Kết quả benchmark</h2><p>Thắng/hòa/thua theo góc nhìn bản nháp của bạn. Thời gian gồm startup và giao tiếp WASI, phụ thuộc máy/tải và không dùng để phân thắng thua. Số liệu nước đi chỉ tính các lần gọi hoàn tất, không gồm lần gọi lỗi/timeout.</p>
      {!data?.benchmarks.length && <p>Chọn bot mẫu và bấm Benchmark bản nháp để tạo lượt thử đầu tiên.</p>}
      {data?.benchmarks.slice(0, 5).map(b => <details key={b.id} className="op-benchmark"><summary>{data.references.find(r => r.id === b.opponent)?.name || b.opponent} · {b.sha.slice(0, 12)} · {b.summary.completed}/{b.summary.expected} ván · {b.summary.wins} thắng / {b.summary.draws} hòa / {b.summary.losses} thua{b.games.some(g => g.status === 'failed') ? ' · Có lỗi hạ tầng' : ''}</summary>
        <p>{b.summary.meanGameMs === null ? 'Chưa có số đo thời gian.' : `Trung bình ${b.summary.meanGameMs} ms/ván trên ${b.summary.measuredGames} ván có số đo.`}</p><button onClick={() => report(b)}>Tải báo cáo JSON</button>
        <table><thead><tr><th>Phía của bạn / seed</th><th>Trạng thái / kết quả</th><th>Thời gian ván</th><th>Nước bot: TB / max</th><th>Replay</th></tr></thead><tbody>{b.games.map(g => { const timing = g.result?.timing?.moves[g.studentSide]; return <tr key={g.id}><td>{g.studentSide} / {g.seed}</td><td>{g.result ? `${!g.result.winner ? 'Hòa' : g.result.winner === g.studentSide ? 'Thắng' : 'Thua'} · ${g.result.reason}` : statusName(g.status)}{g.result?.message && <p>{g.result.message}</p>}</td><td>{g.result?.timing ? `${g.result.timing.wallMs} ms` : 'Chưa đo'}</td><td>{timing?.count ? `${Math.round(timing.totalMs / timing.count)} / ${timing.maxMs} ms` : 'Chưa đo'}</td><td><button disabled={!g.result} onClick={() => replay(g)}>Tải HTML</button></td></tr>; })}</tbody></table>
      </details>)}
    </section>
    <footer>UET - VNU · Luyện tập độc lập với giải chính thức</footer>
  </main>;
}
