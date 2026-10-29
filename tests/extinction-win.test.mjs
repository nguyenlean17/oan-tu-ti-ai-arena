import assert from 'node:assert/strict';
import { createInitialBoard } from '../lib/engine.mjs';
import { countPieces, checkExtinction } from '../lib/extinction-win.mjs';

// Test 1: Bàn cờ ban đầu (15 quân mỗi bên: 5 R, 5 P, 5 S)
const initialBoard = createInitialBoard();
const initialCounts = countPieces(initialBoard);
assert.equal(initialCounts.P1.R, 5);
assert.equal(initialCounts.P1.P, 5);
assert.equal(initialCounts.P1.S, 5);
assert.equal(initialCounts.P1.total, 15);
assert.equal(initialCounts.P2.R, 5);
assert.equal(initialCounts.P2.P, 5);
assert.equal(initialCounts.P2.S, 5);
assert.equal(initialCounts.P2.total, 15);

const initialResult = checkExtinction(initialBoard);
assert.equal(initialResult.hasWinner, false);

// Test 2: Xóa toàn bộ quân Scissors của P2 -> P1 thắng Extinction Win
const boardP2NoScissors = createInitialBoard();
for (let y = 0; y < boardP2NoScissors.length; y++) {
  for (let x = 0; x < boardP2NoScissors[y].length; x++) {
    const piece = boardP2NoScissors[y][x];
    if (piece?.player === 'P2' && (piece?.type === 'S' || piece?.type === 'SCISSORS')) {
      boardP2NoScissors[y][x] = null;
    }
  }
}

const p1WinsResult = checkExtinction(boardP2NoScissors);
assert.equal(p1WinsResult.hasWinner, true);
assert.equal(p1WinsResult.winner, 'P1');
assert.equal(p1WinsResult.extinctType, 'S');
assert.equal(p1WinsResult.reason, 'EXTINCTION_WIN');

// Test 3: Xóa toàn bộ quân Rock của P1 -> P2 thắng Extinction Win
const boardP1NoRock = createInitialBoard();
for (let y = 0; y < boardP1NoRock.length; y++) {
  for (let x = 0; x < boardP1NoRock[y].length; x++) {
    const piece = boardP1NoRock[y][x];
    if (piece?.player === 'P1' && (piece?.type === 'R' || piece?.type === 'ROCK')) {
      boardP1NoRock[y][x] = null;
    }
  }
}

const p2WinsResult = checkExtinction(boardP1NoRock);
assert.equal(p2WinsResult.hasWinner, true);
assert.equal(p2WinsResult.winner, 'P2');
assert.equal(p2WinsResult.extinctType, 'R');
assert.equal(p2WinsResult.reason, 'EXTINCTION_WIN');

console.log('Extinction Win tests passed: initial setup, P1 win on P2 extinction, P2 win on P1 extinction.');
