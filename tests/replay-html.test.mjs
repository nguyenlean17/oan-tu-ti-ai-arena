import assert from 'node:assert/strict';
import vm from 'node:vm';
import { simulate } from '../lib/engine.mjs';
import { replayHtml } from '../lib/replay-html.mjs';

const result = { ...simulate(), runtime: '</script><img src=x onerror=alert(1)>', p1sha: 'a'.repeat(64), p2sha: 'b'.repeat(64) };
const html = replayHtml({ result, source: 'SECRET SOURCE MUST NOT BE EXPORTED' });
assert.ok(!html.includes('<img') && !html.includes('SECRET SOURCE'));
assert.ok(html.includes("connect-src 'none'") && !/https?:\/\//.test(html));
const data = /<script id="replay-data" type="application\/json">(.*?)<\/script>/s.exec(html)[1];
assert.equal(JSON.parse(data).runtime, result.runtime);
const script = /<script nonce="([a-f0-9]+)">([\s\S]*?)<\/script>/.exec(html);
assert.ok(html.includes(`script-src 'nonce-${script[1]}'`));
const elements = new Map();
function element() { return { children: [], textContent: '', value: 0, handlers: {}, append(...nodes) { this.children.push(...nodes); }, replaceChildren() { this.children = []; }, addEventListener(type, fn) { this.handlers[type] = fn; } }; }
const document = { getElementById(id) { if (!elements.has(id)) elements.set(id, element()); return elements.get(id); }, createElement: element };
document.getElementById('replay-data').textContent = data;
let tick;
vm.runInNewContext(script[2], { document, setInterval(fn) { tick = fn; return 1; }, clearInterval() { tick = null; } });
assert.equal(elements.get('board').children.length, 81);
const slider = elements.get('step');
slider.value = result.moves.length; slider.handlers.input();
assert.equal(elements.get('status').textContent, `Nước ${result.moves.length} / ${result.moves.length}`);
elements.get('prev').handlers.click();
assert.equal(slider.value, result.moves.length - 1);
elements.get('play').handlers.click(); tick();
assert.equal(slider.value, result.moves.length);
assert.equal(elements.get('play').textContent, 'Phát');
assert.throws(() => replayHtml({ result: { ...result, engine: 'unknown' } }));
assert.throws(() => replayHtml({ result: { ...result, moves: [{ from: 'A1', to: 'I9', player: 'P1' }] } }));
assert.throws(() => replayHtml({ result: { ...result, moves: [{ ...result.moves[0], player: 'P2' }] } }));
// Short official games and startup forfeits are displayable, unlike the casual 200-ply verifier.
const short = { ...result, moves: result.moves.slice(0, 20), winner: null, reason: 'max_plies' };
assert.equal(JSON.parse(/id="replay-data" type="application\/json">(.*?)<\/script>/s.exec(replayHtml({ result: short }))[1]).frames.length, 21);
assert.ok(replayHtml({ result: { ...short, moves: [], winner: 'P1', reason: 'timeout' } }));
console.log('Offline replay: legal frames, both playback controls, escaped metadata, no source/network and compatible official result formats.');
