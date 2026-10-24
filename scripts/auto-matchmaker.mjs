#!/usr/bin/env node
/**
 * Auto Matchmaker & Leaderboard Runner (Phòng Ngừa Bơm Điểm Dàn Xếp)
 * Trích xuất từ Sổ Tay Vận Hành BTC UET BattleCode 2026 (Mục 7.3 & 7.4).
 *
 * Tự động ghép cặp thi đấu theo chuẩn giải đấu:
 * 1. Ghép các đội có độ lệch Elo nhỏ (|Elo_A - Elo_B| <= 200).
 * 2. Thi đấu đối xứng 2 ván (Lượt đi: A cầm P1 - B cầm P2; Lượt về: B cầm P1 - A cầm P2).
 * 3. Ẩn danh dữ liệu đối thủ (Anti-Collusion).
 * 4. Cập nhật hệ thống Elo Động (Dynamic Elo) có K thích ứng và chuỗi thắng/thua.
 */

import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { createInitialBoard, legalMoves, applyMove, verifyReplay } from '../lib/engine.mjs';
import { calculateEloUpdate } from '../lib/dynamic-elo.mjs';

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

async function playSingleGame(r1, r2, p1Name, p2Name) {
  const board = createInitialBoard();
  const history = [];
  let winner = null;
  let reason = 'max_plies';

  for (let ply = 0; ply < 200; ply++) {
    const player = ply % 2 === 0 ? 'P1' : 'P2';
    const options = legalMoves(board, player);
    if (!options.length) {
      winner = player === 'P1' ? 'P2' : 'P1';
      reason = 'no_moves';
      break;
    }

    const runner = player === 'P1' ? r1 : r2;
    // Ẩn danh danh tính đối thủ khi truyền vào bot
    const res = await runner.choose({
      board,
      player,
      legal_moves: options,
      history,
      turn: ply
    });

    if (!res.move) {
      winner = player === 'P1' ? 'P2' : 'P1';
      reason = 'invalid_move';
      break;
    }

    const step = applyMove(board, res.move, player);
    history.push(step);

    if (step.winner) {
      winner = step.winner;
      reason = 'goal';
      break;
    }
  }

  verifyReplay({ moves: history, winner, reason });
  return winner;
}

async function main() {
  const botsDir = 'public/bots';
  const botFiles = readdirSync(botsDir)
    .filter(f => f.endsWith('.py') && !f.startsWith('__'))
    .sort();

  console.log('='.repeat(75));
  console.log('BAN TỔ CHỨC UET BATTLECODE 2026 — HỆ THỐNG GHÉP CẶP ĐẤU ELO ĐỘNG');
  console.log(`Tìm thấy ${botFiles.length} bot thi đấu: ${botFiles.join(', ')}`);
  console.log('Quy chuẩn: Cặp đấu 2 lượt đối xứng P1/P2 • Dynamic Elo Engine');
  console.log('='.repeat(75));

  // Khởi tạo bảng đội thi
  const teams = {};
  for (const f of botFiles) {
    const name = f.replace('.py', '');
    teams[name] = {
      name,
      file: join(botsDir, f),
      elo: 1000.0,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      streak: 0
    };
  }

  const teamNames = Object.keys(teams);

  // Vòng đấu tròn (Round Robin giữa các cặp bot)
  for (let i = 0; i < teamNames.length; i++) {
    for (let j = i + 1; j < teamNames.length; j++) {
      const tA = teams[teamNames[i]];
      const tB = teams[teamNames[j]];

      // Kiểm tra khoảng cách Elo (|Elo_A - Elo_B| <= 200đ)
      if (Math.abs(tA.elo - tB.elo) > 200.0 && tA.played >= 10 && tB.played >= 10) {
        continue;
      }

      const rA = createBotRunner(tA.file);
      const rB = createBotRunner(tB.file);

      try {
        // Lượt 1: A cầm P1, B cầm P2
        const w1 = await playSingleGame(rA, rB, tA.name, tB.name);

        // Lượt 2: B cầm P1, A cầm P2
        const w2 = await playSingleGame(rB, rA, tB.name, tA.name);

        // Tính điểm trận: Thắng = 1, Hòa = 0.5, Thua = 0
        let ptsA = 0;
        if (w1 === 'P1') ptsA += 0.5; else if (!w1) ptsA += 0.25;
        if (w2 === 'P2') ptsA += 0.5; else if (!w2) ptsA += 0.25;

        // Cập nhật thống kê
        tA.played += 2;
        tB.played += 2;

        if (ptsA > 0.5) { tA.wins++; tB.losses++; }
        else if (ptsA < 0.5) { tB.wins++; tA.losses++; }
        else { tA.draws++; tB.draws++; }

        // Cập nhật Elo Động
        const eloUpdate = calculateEloUpdate(tA, tB, ptsA, false);
        tA.elo = eloUpdate.playerA.newElo;
        tA.streak = eloUpdate.playerA.streak;
        tB.elo = eloUpdate.playerB.newElo;
        tB.streak = eloUpdate.playerB.streak;

        const resStr = ptsA > 0.5 ? `${tA.name} THẮNG` : ptsA < 0.5 ? `${tB.name} THẮNG` : 'HÒA';
        console.log(`⚔️  [Trận Đấu]: ${tA.name} (${tA.elo.toFixed(1)}) vs ${tB.name} (${tB.elo.toFixed(1)}) ➔ ${resStr} (Điểm A: ${ptsA})`);
      } finally {
        rA.close();
        rB.close();
      }
    }
  }

  // Sắp xếp và in bảng xếp hạng (Leaderboard)
  const ranking = Object.values(teams).sort((a, b) => b.elo - a.elo);

  console.log('\n' + '='.repeat(75));
  console.log('BẢNG XẾP HẠNG TỔNG SẮP GIẢI ĐẤU (DYNAMIC ELO LEADERBOARD):');
  console.log('Hạng | Tên Đội Thi           | Điểm Elo | Đã Đấu | Thắng | Hòa | Thua | Chuỗi');
  console.log('-'.repeat(75));
  ranking.forEach((t, idx) => {
    const padName = t.name.padEnd(21, ' ');
    const padElo = t.elo.toFixed(1).padStart(8, ' ');
    const padP = String(t.played).padStart(6, ' ');
    const padW = String(t.wins).padStart(5, ' ');
    const padD = String(t.draws).padStart(3, ' ');
    const padL = String(t.losses).padStart(4, ' ');
    const streakStr = t.streak > 0 ? `+${t.streak}W` : t.streak < 0 ? `${t.streak}L` : '0';
    const padStrk = streakStr.padStart(6, ' ');
    console.log(` #${String(idx + 1).padStart(2, ' ')} | ${padName} | ${padElo} | ${padP} | ${padW} | ${padD} | ${padL} | ${padStrk}`);
  });
  console.log('='.repeat(75));
}

main().catch(err => {
  console.error('Lỗi ghép cặp tự động:', err);
  process.exit(1);
});
