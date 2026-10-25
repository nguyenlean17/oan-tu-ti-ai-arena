import { openSync, readSync, closeSync, fstatSync } from 'node:fs';
import { validateBot, runGame } from './runner.mjs';
import { sha, RUNTIME_VERSION } from '../competition/store.mjs';
import { ENGINE_VERSION } from '../lib/engine.mjs';
import { PRACTICE_CONFIG, benchmarkSummary } from '../lib/practice-tools.mjs';

export function readBot(file) {
  const fd = openSync(file, 'r');
  try {
    if (!fstatSync(fd).isFile()) throw new Error('Bot phải là tệp Python thông thường.');
    const bytes = Buffer.alloc(65537), length = readSync(fd, bytes, 0, bytes.length, 0);
    if (length > 65536) throw new Error('Source vượt 64 KiB.');
    const source = new TextDecoder('utf-8', { fatal: true }).decode(bytes.subarray(0, length));
    if (!source.trim()) throw new Error('Source rỗng.');
    return source;
  } finally { closeSync(fd); }
}
const payloadFor = source => ({ source, sha: sha(source), config: PRACTICE_CONFIG, engine: ENGINE_VERSION, runtime: RUNTIME_VERSION });
export async function diagnoseFile(file) { return validateBot(payloadFor(readBot(file))); }
export async function benchmarkFiles(first, second, pairs = 1) {
  if (!Number.isInteger(pairs) || pairs < 1 || pairs > 5) throw new Error('Số cặp phải từ 1 đến 5.');
  const a = readBot(first), b = readBot(second), games = [];
  for (let i = 0; i < pairs; i++) for (const studentSide of ['P1', 'P2']) {
    const one = studentSide === 'P1' ? a : b, two = studentSide === 'P2' ? a : b;
    const result = await runGame({ ...payloadFor(a), seed: 42 + i, p1: { source: one, sha: sha(one) }, p2: { source: two, sha: sha(two) } }, { measure: true });
    games.push({ status: 'done', studentSide, result });
  }
  return { config: PRACTICE_CONFIG, firstSha: sha(a), secondSha: sha(b), summary: benchmarkSummary(games, pairs * 2), games, note: 'Thống kê từ góc nhìn bot thứ nhất. Thời gian wall gồm startup/IPC, không dùng phân thắng thua; không cập nhật Elo.' };
}
