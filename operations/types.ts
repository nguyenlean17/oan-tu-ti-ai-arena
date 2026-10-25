export type JobCount = { kind: string; status: string; count: number; oldest: number };
export type Sample = { at: number; rps: number; p95: number; queued: number; accepted?: number; done?: number; running?: number };
export type LoadState = {
  name: string; scope: string; phase: string; updatedAt: number; total: number;
  sent: number; accepted: number; errors: number; retries: number; concurrency: number;
  samples: Sample[]; events: { at: number; message: string }[];
  resources: { name: string; cpu: string; memory: string }[];
};
export type Similarity = { compared: number; pairs: { a: string; b: string; score: number }[]; templateExempt: string[]; errors: string[]; partial: boolean; labels?: Record<string, string> };
export type Metrics = {
  at: number; jobs: JobCount[]; operations: JobCount[];
  submissions: { status: string; count: number }[];
  workers: { id: string; seen: number; runtime: string }[];
  errors: { id: string; kind: string; attempts: number; status: string; created: number }[];
  selftest: { id: string; at: number; passed: boolean } | null;
  backup: { name: string; bytes: number; at: number } | null;
  restore: { restoredToSeparateDatabase: boolean; finishedAt: string } | null;
  reviews: { id: string; subject: string; status: string; result: Similarity | null }[];
  load: LoadState | null;
  readiness: { database: boolean; worker: boolean; backup: boolean; restore: boolean; publicHttpsConfigured: boolean };
};
export type TournamentOption = { id: string; name: string };
export type Mutation = { id: string; partial?: boolean; error?: string };
export type QueueData = { submissions: { id: string; status: string; verdict: string | null; job_status: string; position: number | null; ageMs: number }[] };
export type PracticeData = {
  own: { id: string; sha: string; status: string; verdict: string | null; active: number }[];
  ratings: { user_id: string; name: string; rating: number; played: number; won: number; drawn: number; lost: number }[];
  matches: { game: string; result: { winner: string | null; reason: string; moves: unknown[] } }[];
  policy: string;
};
