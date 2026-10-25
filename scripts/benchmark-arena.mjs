import { writeFileSync } from 'node:fs';
import { benchmarkFiles } from '../judge/local-tools.mjs';
try {
  const [first, second, count = '1', output, ...extra] = process.argv.slice(2);
  if (!first || !second || extra.length || !/^[1-5]$/.test(count)) throw new Error('Cách dùng: node scripts/benchmark-arena.mjs /bots/a.py /bots/b.py [1-5 cặp] [report.json]');
  const report = await benchmarkFiles(first, second, Number(count)), text = JSON.stringify(report, null, 2);
  if (output) writeFileSync(output, text, { flag: 'wx', mode: 0o600 });
  console.log(text);
} catch (error) { console.error('Không thể benchmark: ' + error.message); process.exitCode = 2; }
