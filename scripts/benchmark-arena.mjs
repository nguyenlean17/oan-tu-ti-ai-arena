#!/usr/bin/env node
/**
 * Benchmark Arena: Đấu thử nghiệm tự động giữa 2 Bot Python
 * Chạy trên nền Core Rules của Oẳn Tù Tì 2.0 (9x9, 15 quân, đích I1 / A9).
 */

import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { createInitialBoard, legalMoves, applyMove, verifyReplay } from '../lib/engine.mjs';

const PY_HARNESS = `import sys,json,runpy,copy,time
bot_func = runpy.run_path(sys.argv[1])['choose_move']
for line in sys.stdin:
    state = json.loads(line)
    start = time.perf_counter()
    move = bot_func(state)
    elapsed = time.perf_counter() - start
    print(json.dumps({'move': move, 'seconds': elapsed}), flush=True)
`;

function createBotRunner(botPath) {
  const child = spawn(process.env.OTT_PYTHON || 'python3', ['-u', '-c', PY_HARNESS, botPath], {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  const lines = createInterface({ input: child.stdout });
  let pending = null;
  let stderr = '';

  child.stderr.on('data', d => { stderr += d; });
  lines.on('line', line => {
    if (pending) {
      const res = pending;
      pending = null;
      res(JSON.parse(line));
    }
  });

  child.on('exit', () => {
    if (pending) {
      const res = pending;
      pending = null;
      res({ error: stderr || 'Bot exited' });
    }
  });

  return {
    async choose(state) {
      return new Promise((resolve, reject) => {
        pending = resolve;
        child.stdin.write(JSON.stringify(state) + '\n');
        const timer = setTimeout(() => {
          pending = null;
          child.kill();
          reject(new Error(`Timeout: ${botPath} exceeded 2000ms`));
        }, 2500);
        const original = pending;
        pending = data => {
          clearTimeout(timer);
          original(data);
        };
      });
    },
    close() {
      child.stdin.end();
      lines.close();
      child.kill();
    }
  };
}

async function runMatch(bot1Runner, bot2Runner, bot1Side, maxPlies = 200) {
  const board = createInitialBoard();
  const moves = [];
  let winner = null;
  let reason = 'max_plies';

  for (let ply = 0; ply < maxPlies; ply++) {
    const player = ply % 2 === 0 ? 'P1' : 'P2';
    const options = legalMoves(board, player);
    if (!options.length) {
      winner = player === 'P1' ? 'P2' : 'P1';
      reason = 'no_moves';
      break;
    }

    const runner = player === bot1Side ? bot1Runner : bot2Runner;
    const res = await runner.choose({
      board,
      player,
      legal_moves: options,
      history: moves,
      turn: ply
    });

    if (res.error || !res.move) {
      winner = player === 'P1' ? 'P2' : 'P1';
      reason = res.error || 'invalid_move';
      break;
    }

    const step = applyMove(board, res.move, player);
    moves.push(step);

    if (step.winner) {
      winner = step.winner;
      reason = 'goal';
      break;
    }
  }

  verifyReplay({ moves, winner, reason });
  return { winner, plies: moves.length, reason };
}

async function main() {
  const args = process.argv.slice(2);
  const botA = args[0] || 'public/bots/tactician.py';
  const botB = args[1] || 'public/bots/sprinter.py';
  const rounds = parseInt(args[2] || '10', 10);

  console.log('='.repeat(65));
  console.log(`ĐẤU TRƯỜNG BENCHMARK OẲN TÙ TÌ 2.0 (CHUẨN 15 QUÂN, 9x9)`);
  console.log(`Bot A: ${botA}`);
  console.log(`Bot B: ${botB}`);
  console.log(`Số vòng đấu: ${rounds} (Mỗi vòng gồm 2 lượt đổi bên P1/P2)`);
  console.log('='.repeat(65));

  const runnerA = createBotRunner(botA);
  const runnerB = createBotRunner(botB);

  let aWins = 0, bWins = 0, draws = 0;
  let totalPlies = 0;

  try {
    for (let r = 1; r <= rounds; r++) {
      // Lượt 1: Bot A cầm P1 (Trắng), Bot B cầm P2 (Đen)
      const res1 = await runMatch(runnerA, runnerB, 'P1');
      if (res1.winner === 'P1') aWins++;
      else if (res1.winner === 'P2') bWins++;
      else draws++;
      totalPlies += res1.plies;

      // Lượt 2: Bot A cầm P2 (Đen), Bot B cầm P1 (Trắng)
      const res2 = await runMatch(runnerA, runnerB, 'P2');
      if (res2.winner === 'P2') aWins++;
      else if (res2.winner === 'P1') bWins++;
      else draws++;
      totalPlies += res2.plies;

      process.stdout.write(`Vòng ${r}/${rounds} hoàn tất... (Tỷ số hiện tại: A ${aWins} - B ${bWins} - Hòa ${draws})\r`);
    }
  } finally {
    runnerA.close();
    runnerB.close();
  }

  const totalGames = rounds * 2;
  console.log('\n' + '='.repeat(65));
  console.log(`KẾT QUẢ TỔNG KẾT (${totalGames} ván):`);
  console.log(`- Bot A Thắng: ${aWins} ván (${((aWins / totalGames) * 100).toFixed(1)}%)`);
  console.log(`- Bot B Thắng: ${bWins} ván (${((bWins / totalGames) * 100).toFixed(1)}%)`);
  console.log(`- Hòa:         ${draws} ván (${((draws / totalGames) * 100).toFixed(1)}%)`);
  console.log(`- Số nước trung bình / ván: ${(totalPlies / totalGames).toFixed(1)} plies`);
  console.log('='.repeat(65));
}

main().catch(err => {
  console.error('Lỗi Benchmark:', err);
  process.exit(1);
});
