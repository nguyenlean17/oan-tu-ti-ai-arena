import { diagnoseFile } from '../judge/local-tools.mjs';
try {
  if (process.argv.length !== 3) throw new Error('Cách dùng: node scripts/diagnose-bot.mjs /bots/bot.py');
  const result = await diagnoseFile(process.argv[2]);
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.valid ? 0 : 1;
} catch (error) { console.error('Không thể tự kiểm tra: ' + error.message); process.exitCode = 2; }
