#!/usr/bin/env node
/**
 * Công cụ Xuất Replay Ngoại Tuyến (Offline Match Visualizer)
 * Trích xuất từ Sổ Tay Vận Hành BTC UET BattleCode 2026 (Mục 1 & 9).
 *
 * Chạy 1 trận đấu giữa 2 bot bất kỳ và tạo ra 1 file HTML duy nhất (Self-Contained),
 * không cần kết nối mạng hay máy chủ backend, dùng để chiếu máy chiếu Hội trường Chung kết.
 */

import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { writeFileSync } from 'node:fs';
import { createInitialBoard, legalMoves, applyMove, verifyReplay } from '../lib/engine.mjs';

const PY_HARNESS = `import sys,json,runpy
bot_func = runpy.run_path(sys.argv[1])['choose_move']
for line in sys.stdin:
    state = json.loads(line)
    move = bot_func(state)
    print(json.dumps({'move': move}), flush=True)
`;

function createBotRunner(botPath) {
  const child = spawn(process.env.OTT_PYTHON || 'python3', ['-u', '-c', PY_HARNESS, botPath], {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  const lines = createInterface({ input: child.stdout });
  let pending = null;
  lines.on('line', line => {
    if (pending) {
      const res = pending;
      pending = null;
      res(JSON.parse(line));
    }
  });

  return {
    choose: state => new Promise((resolve, reject) => {
      pending = resolve;
      child.stdin.write(JSON.stringify(state) + '\n');
      setTimeout(() => {
        if (pending) {
          pending = null;
          child.kill();
          reject(new Error(`Timeout: ${botPath} exceeded 2000ms`));
        }
      }, 2500);
    }),
    close: () => {
      child.stdin.end();
      lines.close();
      child.kill();
    }
  };
}

async function simulateMatch(bot1Path, bot2Path) {
  const r1 = createBotRunner(bot1Path);
  const r2 = createBotRunner(bot2Path);
  const board = createInitialBoard();
  const history = [];
  const frames = [JSON.parse(JSON.stringify(board))];
  let winner = null;
  let reason = 'max_plies';

  try {
    for (let ply = 0; ply < 200; ply++) {
      const player = ply % 2 === 0 ? 'P1' : 'P2';
      const options = legalMoves(board, player);
      if (!options.length) {
        winner = player === 'P1' ? 'P2' : 'P1';
        reason = 'no_moves';
        break;
      }
      const runner = player === 'P1' ? r1 : r2;
      const res = await runner.choose({ board, player, legal_moves: options, history, turn: ply });
      if (!res.move) {
        winner = player === 'P1' ? 'P2' : 'P1';
        reason = 'invalid_move';
        break;
      }
      const step = applyMove(board, res.move, player);
      history.push(step);
      frames.push(JSON.parse(JSON.stringify(board)));
      if (step.winner) {
        winner = step.winner;
        reason = 'goal';
        break;
      }
    }
  } finally {
    r1.close();
    r2.close();
  }

  verifyReplay({ moves: history, winner, reason });
  return { history, frames, winner, reason };
}

function generateHtml(bot1Name, bot2Name, matchData) {
  const { history, frames, winner, reason } = matchData;
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>UET BattleCode 2026 — Replay Trận Đấu</title>
  <style>
    :root {
      --bg: #0b1329;
      --card: #152238;
      --accent: #2563eb;
      --text: #f8fafc;
      --p1: #38bdf8;
      --p2: #f43f5e;
      --gold: #fbbf24;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
    body { background: var(--bg); color: var(--text); display: flex; flex-direction: column; align-items: center; min-height: 100vh; padding: 20px; }
    header { text-align: center; margin-bottom: 20px; }
    header h1 { font-size: 24px; color: var(--gold); letter-spacing: 1px; }
    header p { color: #94a3b8; font-size: 14px; margin-top: 4px; }
    .arena { display: flex; gap: 24px; max-width: 1000px; width: 100%; flex-wrap: wrap; justify-content: center; }
    .board-container { background: var(--card); padding: 16px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    .board { display: grid; grid-template-columns: repeat(9, 52px); grid-template-rows: repeat(9, 52px); gap: 2px; background: #334155; border: 3px solid #475569; border-radius: 8px; }
    .cell { width: 52px; height: 52px; display: flex; align-items: center; justify-content: center; font-size: 24px; position: relative; user-select: none; }
    .cell.white { background: #1e293b; }
    .cell.black { background: #0f172a; }
    .cell.goal-p1 { border: 2px dashed var(--p1); background: rgba(56, 189, 248, 0.15); }
    .cell.goal-p2 { border: 2px dashed var(--p2); background: rgba(244, 63, 94, 0.15); }
    .cell.last-move { background: rgba(251, 191, 36, 0.25) !important; }
    .piece { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.3); transition: all 0.2s; }
    .piece.P1 { background: linear-gradient(135deg, #0284c7, #38bdf8); color: white; border: 2px solid #bae6fd; }
    .piece.P2 { background: linear-gradient(135deg, #9f1239, #f43f5e); color: white; border: 2px solid #fecdd3; }
    .panel { flex: 1; min-width: 300px; background: var(--card); border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 16px; }
    .matchup { display: flex; justify-content: space-between; align-items: center; background: #0f172a; padding: 12px 16px; border-radius: 8px; border: 1px solid #1e293b; }
    .side { text-align: center; }
    .side.p1 .name { color: var(--p1); font-weight: bold; }
    .side.p2 .name { color: var(--p2); font-weight: bold; }
    .controls { display: flex; gap: 8px; justify-content: center; align-items: center; }
    button { background: var(--accent); color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; }
    button:hover { background: #1d4ed8; }
    .status { font-size: 14px; color: #94a3b8; text-align: center; }
    .moves-log { max-height: 240px; overflow-y: auto; background: #0f172a; border-radius: 6px; padding: 10px; font-family: monospace; font-size: 13px; }
    .log-row { padding: 4px 0; border-bottom: 1px solid #1e293b; }
    .log-row.active { color: var(--gold); font-weight: bold; }
  </style>
</head>
<body>
  <header>
    <h1>UET BATTLECODE 2026 — REPLAY VISUALIZER</h1>
    <p>Trực quan hóa diễn biến ván đấu ngoại tuyến cho Hội trường Chung kết</p>
  </header>

  <div class="arena">
    <div class="board-container">
      <div id="board" class="board"></div>
    </div>

    <div class="panel">
      <div class="matchup">
        <div class="side p1">
          <div class="name">${bot1Name}</div>
          <small>Player 1 (Trắng) ➔ Đích I1</small>
        </div>
        <div style="font-weight: 800; color: #64748b;">VS</div>
        <div class="side p2">
          <div class="name">${bot2Name}</div>
          <small>Player 2 (Đen) ➔ Đích A9</small>
        </div>
      </div>

      <div class="controls">
        <button id="btnPrev">◀ Nước trước</button>
        <button id="btnPlay">▶ Tự động phát</button>
        <button id="btnNext">Nước sau ▶</button>
      </div>

      <div class="status" id="statusText">Lượt: 0 / ${frames.length - 1}</div>

      <div class="moves-log" id="movesLog"></div>
    </div>
  </div>

  <script>
    const frames = ${JSON.stringify(frames)};
    const history = ${JSON.stringify(history)};
    const winner = ${JSON.stringify(winner)};
    const reason = ${JSON.stringify(reason)};

    const SYMBOLS = { ROCK: '✊', PAPER: '✋', SCISSORS: '✌️' };
    const COLS = ['A','B','C','D','E','F','G','H','I'];
    let currentPly = 0;
    let timer = null;

    function renderBoard(ply) {
      const boardEl = document.getElementById('board');
      boardEl.innerHTML = '';
      const state = frames[ply];
      const lastMove = ply > 0 ? history[ply - 1] : null;

      for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 9; x++) {
          const cell = document.createElement('div');
          const isWhite = (x + y) % 2 === 0;
          cell.className = 'cell ' + (isWhite ? 'white' : 'black');
          if (x === 8 && y === 0) cell.classList.add('goal-p1'); // I1
          if (x === 0 && y === 8) cell.classList.add('goal-p2'); // A9

          const coord = COLS[x] + (y + 1);
          if (lastMove && (lastMove.from === coord || lastMove.to === coord)) {
            cell.classList.add('last-move');
          }

          const piece = state[y][x];
          if (piece) {
            const pEl = document.createElement('div');
            pEl.className = 'piece ' + piece.player;
            pEl.textContent = SYMBOLS[piece.type] || '?';
            cell.appendChild(pEl);
          }
          boardEl.appendChild(cell);
        }
      }

      document.getElementById('statusText').textContent =
        'Lượt: ' + ply + ' / ' + (frames.length - 1) + (ply === frames.length - 1 && winner ? ' — ' + winner + ' CHIẾN THẮNG (' + reason + ')!' : '');

      renderLogs(ply);
    }

    function renderLogs(ply) {
      const logEl = document.getElementById('movesLog');
      logEl.innerHTML = '';
      history.forEach((step, idx) => {
        const row = document.createElement('div');
        row.className = 'log-row' + (idx === ply - 1 ? ' active' : '');
        row.textContent = 'Ply ' + (idx + 1) + ' [' + step.player + ']: ' + step.from + ' ➔ ' + step.to + (step.winner ? ' 🏆' : '');
        logEl.appendChild(row);
      });
      if (ply > 0) {
        const activeEl = logEl.children[ply - 1];
        if (activeEl) activeEl.scrollIntoView({ block: 'nearest' });
      }
    }

    document.getElementById('btnNext').onclick = () => {
      if (currentPly < frames.length - 1) { currentPly++; renderBoard(currentPly); }
    };
    document.getElementById('btnPrev').onclick = () => {
      if (currentPly > 0) { currentPly--; renderBoard(currentPly); }
    };
    document.getElementById('btnPlay').onclick = () => {
      if (timer) {
        clearInterval(timer); timer = null;
        document.getElementById('btnPlay').textContent = '▶ Tự động phát';
      } else {
        document.getElementById('btnPlay').textContent = '⏸ Tạm dừng';
        timer = setInterval(() => {
          if (currentPly < frames.length - 1) { currentPly++; renderBoard(currentPly); }
          else { clearInterval(timer); timer = null; document.getElementById('btnPlay').textContent = '▶ Tự động phát'; }
        }, 500);
      }
    };

    renderBoard(0);
  </script>
</body>
</html>`;
}

async function main() {
  const [b1, b2, out] = process.argv.slice(2);
  const bot1 = b1 || 'public/bots/champion.py';
  const bot2 = b2 || 'public/bots/vanguard.py';
  const outFile = out || 'replay.html';

  console.log(`Đang chạy trận đấu: ${bot1} vs ${bot2}...`);
  const matchData = await simulateMatch(bot1, bot2);

  const html = generateHtml(bot1.split('/').pop(), bot2.split('/').pop(), matchData);
  writeFileSync(outFile, html, 'utf8');

  console.log(`✅ Đã xuất Replay thành công ra file: ${outFile}`);
  console.log(`Người chiến thắng: ${matchData.winner || 'HÒA'} (${matchData.reason}) sau ${matchData.history.length} plies.`);
  console.log(`Bạn có thể mở tệp ${outFile} trên bất kỳ trình duyệt nào để xem trận đấu!`);
}

main().catch(err => {
  console.error('Lỗi xuất replay:', err);
  process.exit(1);
});
