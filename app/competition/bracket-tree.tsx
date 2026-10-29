import React from 'react';

export type Match = {
  id: string;
  round: 'r16' | 'quarter' | 'semi' | 'final';
  team1: { name: string; score?: number; winner?: boolean };
  team2: { name: string; score?: number; winner?: boolean };
  status: 'pending' | 'live' | 'finished';
};

export type BracketData = {
  r16?: Match[];
  quarter?: Match[];
  semi?: Match[];
  final?: Match[];
};

export function BracketTree({ data }: { data: BracketData }) {
  const rounds: { key: keyof BracketData; title: string }[] = [
    { key: 'r16', title: 'Vòng 1/8' },
    { key: 'quarter', title: 'Tứ kết' },
    { key: 'semi', title: 'Bán kết' },
    { key: 'final', title: 'Chung kết' }
  ];

  return (
    <div className="w-full overflow-x-auto py-6 px-4 bg-slate-950 text-slate-100 rounded-xl border border-slate-800 shadow-2xl">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-white uppercase">
          Sơ Đồ Thi Đấu Trực Tiếp · UET Battlecode 2026
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Cập nhật trực tiếp kết quả các vòng đối đầu loại trực tiếp
        </p>
      </div>

      <div className="flex flex-row justify-between min-w-[900px] gap-8">
        {rounds.map(({ key, title }) => {
          const matches = data[key] || [];
          if (matches.length === 0) return null;

          return (
            <div key={key} className="flex-1 flex flex-col justify-around">
              <div className="text-center font-semibold text-xs text-sky-400 uppercase tracking-widest mb-4">
                {title}
              </div>
              <div className="flex flex-col gap-6 justify-around flex-grow">
                {matches.map(m => (
                  <div
                    key={m.id}
                    className={`relative p-3 rounded-lg border transition-all ${
                      m.status === 'live'
                        ? 'border-amber-500 bg-amber-950/20 shadow-amber-900/30 shadow-lg animate-pulse'
                        : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                    }`}
                  >
                    {m.status === 'live' && (
                      <span className="absolute -top-2 right-2 bg-amber-500 text-slate-950 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
                        Đang đấu
                      </span>
                    )}

                    {/* Team 1 */}
                    <div
                      className={`flex justify-between items-center py-1.5 px-2 rounded ${
                        m.team1.winner ? 'bg-emerald-950/40 text-emerald-300 font-semibold' : 'text-slate-300'
                      }`}
                    >
                      <span className="truncate max-w-[130px] text-sm" title={m.team1.name}>
                        {m.team1.name || 'Chưa xác định'}
                      </span>
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-slate-800/80">
                        {m.team1.score ?? '-'}
                      </span>
                    </div>

                    <div className="border-t border-slate-800/60 my-1"></div>

                    {/* Team 2 */}
                    <div
                      className={`flex justify-between items-center py-1.5 px-2 rounded ${
                        m.team2.winner ? 'bg-emerald-950/40 text-emerald-300 font-semibold' : 'text-slate-300'
                      }`}
                    >
                      <span className="truncate max-w-[130px] text-sm" title={m.team2.name}>
                        {m.team2.name || 'Chưa xác định'}
                      </span>
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-slate-800/80">
                        {m.team2.score ?? '-'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default BracketTree;
