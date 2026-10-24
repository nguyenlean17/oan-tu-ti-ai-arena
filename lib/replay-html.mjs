import { createInitialBoard, applyMove, ENGINE_VERSION, MAX_PLIES } from './engine.mjs';

// A portable viewing copy, never an input to official scoring or a bot runner.
export function replayHtml(replay) {
  const result = replay?.result;
  if (!result || result.engine !== ENGINE_VERSION || !Array.isArray(result.moves) || result.moves.length > MAX_PLIES || ![null, 'P1', 'P2'].includes(result.winner)) throw new Error('Replay không hợp lệ hoặc khác phiên bản engine.');
  const board = createInitialBoard(), frames = [structuredClone(board)], moves = [];
  let winner = null;
  for (const [i, move] of result.moves.entries()) {
    if (winner || move?.player !== (i % 2 ? 'P2' : 'P1')) throw new Error('Replay sai thứ tự nước đi.');
    const step = applyMove(board, move, move.player);
    winner = step.winner;
    moves.push({ from: step.from, to: step.to, player: step.player });
    frames.push(structuredClone(board));
  }
  if (winner && (result.winner !== winner || result.reason !== 'goal')) throw new Error('Kết quả không khớp nước đi.');
  const metadata = Object.fromEntries(['reason', 'engine', 'runtime', 'p1sha', 'p2sha'].map(key => [key, String(result[key] ?? '').slice(0, 200)]));
  const data = JSON.stringify({ frames, moves, winner: result.winner, ...metadata }).replace(/[<>&\u2028\u2029]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
  const nonce = Array.from(crypto.getRandomValues(new Uint8Array(16)), value => value.toString(16).padStart(2, '0')).join('');
  return `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; connect-src 'none'; base-uri 'none'; form-action 'none'">
<title>UET Arena - Replay ngoại tuyến</title><style>
*{box-sizing:border-box}body{margin:0;padding:24px;font:16px system-ui,sans-serif;color:#162d43;background:#f3f6fa}main{max-width:850px;margin:auto}h1{color:#034ea1}section{display:flex;gap:24px;align-items:start;flex-wrap:wrap}.board{display:grid;grid-template-columns:repeat(9,1fr);width:min(100%,480px);border:2px solid #034ea1}.cell{aspect-ratio:1;display:grid;place-items:center;position:relative;background:#fff}.shade{background:#dce7f2}.cell small{position:absolute;top:1px;left:2px;font-size:9px;color:#41566b}.piece{font-size:clamp(13px,3.4vw,24px);font-weight:bold}.P1{color:#034ea1}.P2{color:#b62a35}.last{outline:2px solid #bd8800;outline-offset:-2px}.goal{box-shadow:inset 0 0 0 2px #7598be}aside{flex:1;min-width:220px}button{padding:10px;margin:3px;border:1px solid #9db2c7;background:white;border-radius:5px;cursor:pointer}input{width:100%;margin:14px 0}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px}p{line-height:1.5}.note{font-size:13px;color:#52687d}
</style></head><body><main><h1>UET Arena · Replay ngoại tuyến</h1><p>P1: xanh · P2: đỏ · R: Búa · P: Bao · S: Kéo</p><section><div class="board" id="board" role="img" aria-label="Bàn cờ replay"></div><aside><p id="status" aria-live="polite"></p><p id="result"></p><button id="prev" aria-label="Nước trước">← Trước</button><button id="play">Phát</button><button id="next" aria-label="Nước tiếp">Tiếp →</button><input id="step" aria-label="Chọn nước đi" type="range" min="0" value="0"><pre id="metadata"></pre></aside></section><p class="note">Bản sao để xem ngoại tuyến. Quyết định xử thua và kết quả chính thức thuộc hồ sơ giải trên hệ thống; tệp HTML có thể bị chỉnh sửa sau khi tải.</p></main>
<script id="replay-data" type="application/json">${data}</script><script nonce="${nonce}">
const d=JSON.parse(document.getElementById('replay-data').textContent),board=document.getElementById('board'),slider=document.getElementById('step'),play=document.getElementById('play');
let index=0,timer=null;slider.max=d.moves.length;
function stop(){clearInterval(timer);timer=null;play.textContent='Phát';}
function render(){board.replaceChildren();const last=d.moves[index-1];for(let y=0;y<9;y++)for(let x=0;x<9;x++){const coord=String.fromCharCode(65+x)+(y+1),cell=document.createElement('div'),label=document.createElement('small'),piece=d.frames[index][y][x];cell.className='cell'+((x+y)%2?' shade':'')+(['I1','A9'].includes(coord)?' goal':'')+(last&&(last.from===coord||last.to===coord)?' last':'');label.textContent=coord;cell.append(label);if(piece){const token=document.createElement('span');token.className='piece '+piece.player;token.textContent={ROCK:'R',PAPER:'P',SCISSORS:'S'}[piece.type];cell.append(token);}board.append(cell);}slider.value=index;document.getElementById('status').textContent='Nước '+index+' / '+d.moves.length;document.getElementById('result').textContent='Kết quả: '+(d.winner||'Hòa')+' · '+d.reason;}
document.getElementById('metadata').textContent='Engine: '+d.engine+'\\nRuntime: '+d.runtime+'\\nP1 SHA-256: '+d.p1sha+'\\nP2 SHA-256: '+d.p2sha;
document.getElementById('prev').addEventListener('click',()=>{stop();index=Math.max(0,index-1);render();});document.getElementById('next').addEventListener('click',()=>{stop();index=Math.min(d.moves.length,index+1);render();});slider.addEventListener('input',()=>{stop();index=Number(slider.value);render();});play.addEventListener('click',()=>{if(timer){stop();return;}if(index===d.moves.length)index=0;render();play.textContent='Dừng';timer=setInterval(()=>{if(index<d.moves.length){index++;render();}if(index===d.moves.length)stop();},500);});render();
</script></body></html>`;
}
