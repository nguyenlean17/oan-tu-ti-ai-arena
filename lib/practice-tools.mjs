export const PRACTICE_CONFIG = Object.freeze({ maxPlies: 40, memoryMB: 128, startupMs: 8000, moveMs: 1000 });
export const REFERENCE_BOTS = Object.freeze([
  { id: 'starter_config', name: 'Starter Config', description: 'Chỉnh trọng số BOT_CONFIG để thử chiến thuật.' },
  { id: 'heuristic_hunter', name: 'Heuristic Hunter', description: 'Ví dụ lượng giá thế cờ và săn quân.' },
  { id: 'sprinter', name: 'Sprinter', description: 'Bot tham chiếu ưu tiên tiến về đích.' },
  { id: 'guardian', name: 'Guardian', description: 'Bot tham chiếu thiên về phòng thủ.' },
  { id: 'tactician', name: 'Tactician', description: 'Bot tham chiếu lượng giá nhiều yếu tố.' },
]);
export function benchmarkSummary(games, expected) {
  const done = games.filter(g => g.status === 'done' && g.result);
  const wins = done.filter(g => g.result.winner === g.studentSide).length;
  const draws = done.filter(g => !g.result.winner).length;
  const measured = done.filter(g => Number.isFinite(g.result.timing?.wallMs));
  return { expected, completed: done.length, wins, draws, losses: done.length - wins - draws,
    measuredGames: measured.length, meanGameMs: measured.length ? Math.round(measured.reduce((n, g) => n + g.result.timing.wallMs, 0) / measured.length) : null };
}
