import { readFileSync, writeFileSync } from 'node:fs';
import { replayHtml } from '../lib/replay-html.mjs';

const [input, output] = process.argv.slice(2);
if (!input || !output) throw new Error('Usage: node scripts/export-replay-html.mjs replay.json replay.html');
// Read a downloaded replay, never source code; refuse to overwrite existing files.
const html = replayHtml(JSON.parse(readFileSync(input, 'utf8')));
writeFileSync(output, html, { flag: 'wx' });
console.log('Offline replay saved: ' + output);
