import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import LiveLeaderboard from '@/components/liveleaderboard'; // Check of dit pad klopt

export const revalidate = 0;

interface LivePageProps {
  params: Promise<{ id: string }>;
}

export default async function LiveRacePage({ params }: LivePageProps) {
  const { id: raceId } = await params;

  if (!raceId) {
    return <div className="text-white p-10 font-f1">Geen Race ID gevonden.</div>;
  }

  const supabase = await createClient();

  // 1. Data ophalen (we halen de blokkerende check op actualResults weg)
  const { data: leaderboard } = await supabase.from('leaderboard').select('*');
  const { data: liveScores } = await supabase
    .from('actual_scores')
    .select('*')
    .eq('race_id', raceId);

  // We checken nog wel of de raceId überhaupt bestaat in je systeem
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
               Update: {new Date().toLocaleTimeString()}
             </span>
             <div className="bg-red-600 px-2 py-0.5 rounded text-[8px] font-black uppercase animate-pulse">Live</div>
          </div>
        </div>

        <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-2">
          Live <span className="text-[#005AFF]">Tracker</span>
        </h1>
        <p className="text-slate-500 text-[10px] uppercase tracking-[0.3em] mb-8 italic">Virtuele Tussenstand</p>

        {/* Hier roepen we het Client Component aan */}
        <LiveLeaderboard 
          initialScores={liveScores || []} 
          raceId={raceId} 
          leaderboard={leaderboard} 
        />

        <p className="text-center text-slate-600 text-[8px] uppercase tracking-widest mt-10 mb-20">
          De stand wordt automatisch bijgewerkt zodra er posities wisselen.
        </p>
      </div>
    </div>
  );
}