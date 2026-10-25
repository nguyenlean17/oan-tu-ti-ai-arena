import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export function runSimilarity(payload) {
  const input = JSON.stringify(payload);
  if (Buffer.byteLength(input) > 8 * 1024 * 1024) throw new Error('Review batch too large');
  return new Promise((resolve, reject) => {
    const child = spawn(process.env.JUDGE_PYTHON || 'python3', [fileURLToPath(new URL('./similarity.py', import.meta.url))], { shell: false, windowsHide: true, stdio: ['pipe', 'pipe', 'ignore'], env: { PATH: process.env.PATH || '', SYSTEMROOT: process.env.SYSTEMROOT || '', PYTHONIOENCODING: 'utf-8' } });
    let output = '', settled = false;
    const finish = (error, result) => { if (settled) return; settled = true; clearTimeout(timer); child.kill(); if (error) reject(error); else resolve(result); };
    const timer = setTimeout(() => finish(new Error('AST review timeout')), 15000);
    child.on('error', () => finish(new Error('AST parser unavailable')));
    child.stdout.on('data', chunk => { output += chunk; if (output.length > 200000) finish(new Error('AST output limit')); });
    child.stdin.on('error', () => {});
    child.on('close', code => { if (code !== 0) return finish(new Error('AST parser failed')); try { finish(null, JSON.parse(output)); } catch { finish(new Error('AST parser returned invalid JSON')); } });
    child.stdin.end(input);
  });
}
