'use client';
import {useEffect,useState} from 'react';
import {ChevronLeft,ChevronRight,Play,Pause,Hexagon,Hand,Scissors,Flag,Download} from 'lucide-react';
import {createInitialBoard,applyMove} from '../../lib/engine.mjs';
import {gameReason} from '../../lib/student-feedback.mjs';
export type Replay = { result: { moves: { from: string; to: string; player: string }[]; reason: string; winner: string | null; message?: string; engine: string; runtime: string; p1sha: string; p2sha: string } };
function save(value: string, name: string, type = 'application/json') { const url = URL.createObjectURL(new Blob([value], { type })); const link = document.createElement('a'); link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
export default function ReplayView({ replay }: { replay: Replay }) {
  const [step, setStep] = useState(0), [playing, setPlaying] = useState(false);
  const [exportError, setExportError] = useState('');
  async function exportOffline() {
    setExportError('');
    try { const { replayHtml } = await import('../../lib/replay-html.mjs'); save(replayHtml(replay), 'replay.html', 'text/html;charset=utf-8'); }
    catch (error) { setExportError((error as Error).message); }
  }
  useEffect(() => { if (!playing) return; const timer = setInterval(() => setStep(s => { if (s >= replay.result.moves.length) { setPlaying(false); return s; } return s + 1; }), 300); return () => clearInterval(timer); }, [playing, replay]);
  const board = createInitialBoard();
  for (let i = 0; i < step; i++) applyMove(board, replay.result.moves[i], i % 2 ? 'P2' : 'P1');
  return <div className="tc-replay"><div className="tc-board" role="img" aria-label={`Replay sau ${step} nước đi`}>{board.flatMap((row: ({ type: string; player: string } | null)[], y: number) => row.map((p, x) => {
    const coord = String.fromCharCode(65 + x) + (y + 1), Icon = p?.type === 'ROCK' ? Hexagon : p?.type === 'PAPER' ? Hand : Scissors;
    return <div className={`tc-cell ${(x + y) % 2 ? 'shade' : ''} ${p?.player || ''}`} key={coord} title={`${coord} ${p?.type || ''}`}><small>{coord}</small>{p ? <Icon size={20} /> : ['A9', 'I1'].includes(coord) ? <Flag size={18} /> : null}</div>;
  }))}</div><div className="tc-replay-info"><h3>Kết quả: {replay.result.winner || 'Hòa'}</h3><p>{gameReason(replay.result.reason)} · {replay.result.moves.length} nước</p>{replay.result.message && <p>{replay.result.message}</p>}<div className="tc-actions"><button aria-label="Nước trước" onClick={() => { setPlaying(false); setStep(Math.max(0, step - 1)); }}><ChevronLeft size={18} /></button><button onClick={() => { if (step === replay.result.moves.length) setStep(0); setPlaying(!playing); }}>{playing ? <Pause size={16} /> : <Play size={16} />}{playing ? 'Dừng' : 'Phát'}</button><button aria-label="Nước tiếp" onClick={() => { setPlaying(false); setStep(Math.min(replay.result.moves.length, step + 1)); }}><ChevronRight size={18} /></button><span>{step}/{replay.result.moves.length}</span></div><input aria-label="Chọn nước đi" type="range" min="0" max={replay.result.moves.length} value={step} onChange={e => { setPlaying(false); setStep(+e.target.value); }} /><p className="tc-mono">{replay.result.engine}<br />{replay.result.runtime}<br/>Bot P1: {replay.result.p1sha?.slice(0,12)}<br/>Bot P2: {replay.result.p2sha?.slice(0,12)}</p><button onClick={() => save(JSON.stringify(replay, null, 2), 'replay.json')}><Download size={16} />Tải replay</button><button onClick={exportOffline}><Download size={16} />Tải HTML ngoại tuyến</button>{exportError && <p role="alert">{exportError}</p>}</div></div>;
}
