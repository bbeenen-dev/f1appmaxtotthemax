import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';

export const revalidate = 0;

interface LivePageProps {
  params: Promise<{ id: string }>;
}

export default async function LiveRacePage({ params }: LivePageProps) {
  const resolvedParams = await params;
  const raceId = resolvedParams.id;

  if (!raceId) {
    return <div className="text-white p-10">Geen Race ID gevonden in de URL.</div>;
  }

  const supabase = await createClient();

  // 1. Data ophalen
  const { data: actualResults, error: actualError } = await supabase
    .from('actual_results')
    .select('*')
    .eq('race_id', raceId)
    .maybeSingle();

  if (actualError) {
    return (
      <div className="min-h-screen bg-[#0f111a] text-white p-10 font-f1">
        <h1 className="text-red-500 font-bold">Database Configuratie Fout</h1>
        <p className="text-[10px] text-slate-600 mt-4">Error: {actualError.message}</p>
      </div>
    );
  }

  if (!actualResults || !actualResults.live_positions) {
    return (
      <div className="min-h-screen bg-[#0f111a] flex flex-col items-center justify-center text-white p-6 font-f1">
        <div className="w-12 h-12 border-4 border-[#005AFF] border-t-transparent rounded-full animate-spin mb-6"></div>
        <h2 className="text-xl font-black italic uppercase tracking-tighter">Wachten op Race Data</h2>
        <Link href={`/races/${raceId}`} className="mt-8 px-6 py-2 border border-slate-700 text-slate-400 text-[10px] uppercase font-bold rounded-full hover:bg-slate-800 transition-all">
          ← Terug
        </Link>
      </div>
    );
  }

  // 2. Leaderboard en Live Scores ophalen
  // Tip: Zorg dat je 'username' of 'display_name' selecteert
  const { data: leaderboard } = await supabase.from('leaderboard').select('*');
  const { data: liveScores } = await supabase.from('actual_scores').select('*').eq('race_id', raceId);

  const liveStanding = (leaderboard || []).map(user => {
    const currentRacePoints = liveScores?.find(s => s.user_id === user.user_id)?.points || 0;
    return {
      ...user,
      currentRacePoints,
      virtualTotal: (user.total_points || 0) + currentRacePoints
    };
  }).sort((a, b) => b.virtualTotal - a.virtualTotal);

  return (
    // Toegevoegd: pb-32 zorgt voor extra ruimte onderaan voor het menu
    <div className="min-h-screen bg-[#0f111a] text-white p-4 md:p-8 pb-32 font-f1">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <Link href={`/races/${raceId}`} className="text-slate-500 text-[10px] uppercase font-bold tracking-widest hover:text-[#005AFF]">
            ← Race Control
          </Link>
          <div className="flex items-center gap-2">
             <span className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">Update: {new Date().toLocaleTimeString()}</span>
             <div className="bg-red-600 px-2 py-0.5 rounded text-[8px] font-black uppercase animate-pulse">Live</div>
          </div>
        </div>

        <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-2">
          Live <span className="text-[#005AFF]">Tracker</span>
        </h1>
        <p className="text-slate-500 text-[10px] uppercase tracking-[0.3em] mb-8 italic">Virtuele Tussenstand</p>

        <div className="bg-[#161a23] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1c222d] text-slate-500 text-[9px] uppercase tracking-widest border-b border-slate-800">
                <th className="p-5 font-black w-16">Pos</th>
                <th className="p-5 font-black">Deelnemer</th>
                <th className="p-5 text-right font-black">Totaal (V)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {liveStanding.map((user, index) => (
                <tr key={user.user_id} className="hover:bg-[#1c222d]/50 transition-colors">
                  <td className="p-5 font-black italic text-[#005AFF] text-lg">
                    {index + 1}
                  </td>
                  <td className="p-5">
                    <div className="flex flex-col">
                      {/* Checkt op display_name, anders username */}
                      <span className="font-black uppercase text-sm italic tracking-tight">
                        {user.display_name || user.username || 'Onbekende Racer'}
                      </span>
                      {/* Sub-text voor extra info indien nodig */}
                      <span className="text-[7px] text-slate-600 uppercase tracking-widest">P1 Voorspelling</span>
                    </div>
                  </td>
                  <td className="p-5 text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-black text-xl italic leading-none">{user.virtualTotal}</span>
                      <span className="text-[8px] text-green-500 font-bold uppercase tracking-tighter mt-1">
                        +{user.currentRacePoints} live
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Extra melding onder de tabel voor de zekerheid */}
        <p className="text-center text-slate-600 text-[8px] uppercase tracking-widest mt-10 mb-20">
          Einde van de ranglijst • Veilig scrollen geactiveerd
        </p>
      </div>
    </div>
  );
}