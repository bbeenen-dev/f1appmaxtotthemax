import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';

export const revalidate = 30;

interface LivePageProps {
  params: Promise<{ id: string }>; // Params is een Promise in de nieuwere Next.js versies
}

export default async function LiveRacePage({ params }: LivePageProps) {
  // 1. UNWRAP DE PARAMS
  const resolvedParams = await params;
  const raceId = resolvedParams.id;

  const supabase = await createClient();

  // 2. HAAL DE DATA OP (met error handling)
  const [actualRes, leaderboardRes, scoresRes] = await Promise.all([
    supabase.from('actual_results').select('*').eq('race_id', raceId).maybeSingle(),
    supabase.from('leaderboard').select('user_id, total_points, username').order('total_points', { ascending: false }),
    supabase.from('actual_scores').select('user_id, points').eq('race_id', raceId)
  ]);

  // Foutmelding als de tabel 'actual_results' nog helemaal leeg is voor deze race
  if (!actualRes.data) {
    return (
      <div className="min-h-screen bg-[#0f111a] flex flex-col items-center justify-center text-white p-6 font-f1">
        <div className="w-16 h-1 w-full max-w-[200px] bg-slate-800 rounded-full mb-8 overflow-hidden">
            <div className="h-full bg-[#005AFF] animate-progress-fast w-1/3"></div>
        </div>
        <h2 className="text-xl font-black italic uppercase tracking-tighter mb-2">Geen live data</h2>
        <p className="text-slate-500 text-[10px] uppercase tracking-widest mb-8">De race is nog niet gestart of gesynct.</p>
        <Link href={`/races/${raceId}`} className="text-[#005AFF] text-[10px] font-black uppercase tracking-widest border border-[#005AFF]/30 px-6 py-3 rounded-full hover:bg-[#005AFF]/10 transition-all">
          ← Terug naar Dashboard
        </Link>
      </div>
    );
  }

  // 3. LOGICA VOOR STAND EN PIJLTJES
  const oldPositions = new Map();
  leaderboardRes.data?.forEach((user, index) => {
    oldPositions.set(user.user_id, index + 1);
  });

  const liveStanding = (leaderboardRes.data || []).map(user => {
    const livePointsEntry = scoresRes.data?.find(s => s.user_id === user.user_id);
    const livePoints = livePointsEntry ? livePointsEntry.points : 0;
    const totalVirtual = (user.total_points || 0) + livePoints;

    return {
      user_id: user.user_id,
      username: user.username,
      pointsBeforeRace: user.total_points || 0,
      virtualRacePoints: livePoints,
      totalVirtualPoints: totalVirtual,
      oldPos: oldPositions.get(user.user_id) || 99
    };
  });

  const sortedLiveStanding = liveStanding.sort((a, b) => b.totalVirtualPoints - a.totalVirtualPoints);

  return (
    <div className="min-h-screen bg-[#0f111a] text-white p-4 md:p-8 font-f1 pb-20">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* NAVIGATIE */}
        <div className="flex items-center justify-between">
          <Link href={`/races/${raceId}`} className="text-slate-500 text-[10px] uppercase hover:text-[#005AFF] transition-all tracking-widest flex items-center gap-2 font-bold">
            <span>←</span> RACE CONTROL
          </Link>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold italic">Live Tracker</span>
          </div>
        </div>

        {/* TITEL SECTIE */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b-2 border-[#005AFF] pb-6 gap-4">
          <div>
            <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none">
              Live <span className="text-[#005AFF]">Stand</span>
            </h1>
          </div>
          <div className="bg-[#161a23] px-4 py-2 rounded-xl border border-slate-800 text-right">
            <span className="text-[9px] text-slate-500 uppercase font-black block mb-1">Laatste Update</span>
            <p className="font-mono text-[#005AFF] text-xl font-bold">
              {new Date(actualRes.data.last_updated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LINKER KOLOM: BAANPOSITIE */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-[11px] font-black uppercase italic text-slate-500 px-2 tracking-widest">Baanpositie</h2>
            <div className="bg-[#161a23] rounded-2xl p-4 border border-slate-800 shadow-2xl space-y-1">
              {actualRes.data.live_positions.map((driverId: string, index: number) => (
                <div key={driverId} className="flex items-center gap-3 py-2.5 px-3 bg-[#1c222d]/50 rounded-lg border-l-2 border-transparent hover:border-[#005AFF] transition-all group">
                  <span className={`w-5 font-black italic text-sm ${index < 3 ? 'text-[#005AFF]' : 'text-slate-600'}`}>
                    {index + 1}
                  </span>
                  <span className="font-black uppercase text-xs tracking-wider">{driverId}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RECHTER KOLOM: KLASSEMENT */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-[11px] font-black uppercase italic text-slate-500 px-2 tracking-widest">Klassement (Virtueel)</h2>
            <div className="bg-[#161a23] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#1c222d] text-[9px] uppercase tracking-[0.2em] text-slate-500">
                    <th className="p-5 text-center">Trend</th>
                    <th className="p-5">Deelnemer</th>
                    <th className="p-5 text-center">Race</th>
                    <th className="p-5 text-right">Totaal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {sortedLiveStanding.map((entry, index) => {
                    const currentPos = index + 1;
                    const diff = entry.oldPos - currentPos;

                    return (
                      <tr key={entry.user_id} className="hover:bg-[#1c222d]/80 transition-colors">
                        <td className="p-5 text-center">
                            {diff > 0 ? (
                              <span className="text-green-500 font-black text-xs">▲{diff}</span>
                            ) : diff < 0 ? (
                              <span className="text-red-500 font-black text-xs">▼{Math.abs(diff)}</span>
                            ) : (
                              <span className="text-slate-700 font-black text-[10px]">—</span>
                            )}
                        </td>
                        <td className="p-5 font-black uppercase text-sm italic">{entry.username}</td>
                        <td className="p-5 text-center">
                          <span className="bg-[#005AFF]/10 text-[#005AFF] px-2 py-1 rounded text-[11px] font-black border border-[#005AFF]/20">
                            +{entry.virtualRacePoints}
                          </span>
                        </td>
                        <td className="p-5 text-right font-black text-xl italic leading-none">
                          {entry.totalVirtualPoints}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}