import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import LiveLeaderboard from '@/components/liveleaderboard';

export const revalidate = 0;

interface LivePageProps {
  params: Promise<{ id: string }>;
}

export default async function LiveRacePage({ params }: LivePageProps) {
  const { id: raceId } = await params;
  const numericRaceId = parseInt(raceId, 10);

  if (isNaN(numericRaceId)) {
    return <div className="text-white p-10 font-f1">Ongeldig Race ID.</div>;
  }

  const supabase = await createClient();

  // 1. Data parallel ophalen
  const [leaderboardRes, liveScoresRes] = await Promise.all([
    supabase.from('leaderboard').select('*'),
    supabase.from('actual_scores').select('*').eq('race_id', numericRaceId)
  ]);

  const leaderboard = leaderboardRes.data;
  const liveScores = liveScoresRes.data;

  if (!leaderboard) {
    return <div className="text-white p-10 font-f1">Data kon niet worden geladen.</div>;
  }

  return (
    <div className="min-h-screen bg-[#0f111a] text-white p-4 md:p-8 pb-32 font-f1">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <Link href={`/races/${raceId}`} className="text-slate-500 text-[10px] uppercase font-bold tracking-widest hover:text-[#005AFF]">
            ← Race Control
          </Link>
          <div className="flex items-center gap-2">
             <span className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">
               Update: {new Date().toLocaleTimeString('nl-NL')}
             </span>
             <div className="bg-red-600 px-2 py-0.5 rounded text-[8px] font-black uppercase animate-pulse">Live</div>
          </div>
        </div>

        <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-2">
          Live <span className="text-[#005AFF]">Tracker</span>
        </h1>
        <p className="text-slate-500 text-[10px] uppercase tracking-[0.3em] mb-8 italic">Virtuele Tussenstand</p>

        {/* Client Component voor de live updates */}
        <LiveLeaderboard 
          initialScores={liveScores || []} 
          raceId={numericRaceId} 
          leaderboard={leaderboard} 
        />

        <p className="text-center text-slate-600 text-[8px] uppercase tracking-widest mt-10 mb-20">
          De stand wordt elke 10 seconden automatisch bijgewerkt.
        </p>
      </div>
    </div>
  );
}