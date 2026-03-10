"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export default function LiveLeaderboard({ 
  initialScores, 
  raceId, 
  leaderboard 
}: { 
  initialScores: any[], 
  raceId: string, 
  leaderboard: any[] 
}) {
  const [liveScores, setLiveScores] = useState(initialScores);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    // Luister naar veranderingen in de 'actual_scores' tabel voor deze race
    const channel = supabase
      .channel('realtime-live-scores')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'actual_scores',
        filter: `race_id=eq.${raceId}`
      }, async () => {
        // Als er iets verandert (door de Cronjob), haal de nieuwste scores op
        const { data } = await supabase
          .from('actual_scores')
          .select('*')
          .eq('race_id', raceId);
        
        if (data) setLiveScores(data);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [raceId, supabase]);

  // Bereken de virtuele stand (zelfde logica als je had, maar nu reactief)
  const liveStanding = (leaderboard || []).map(user => {
    const currentRacePoints = liveScores?.find(s => s.user_id === user.user_id)?.points || 0;
    return {
      ...user,
      currentRacePoints,
      virtualTotal: (user.total_points || 0) + currentRacePoints
    };
  }).sort((a, b) => b.virtualTotal - a.virtualTotal);

  return (
    <div className="bg-[#161a23] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-[#1c222d] text-slate-500 text-[9px] uppercase tracking-widest">
            <th className="p-5 font-black">Pos</th>
            <th className="p-5 font-black">Deelnemer</th>
            <th className="p-5 text-right font-black">Totaal (V)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/50">
          {liveStanding.map((user, index) => (
            <tr key={user.user_id} className="hover:bg-[#1c222d] transition-colors border-l-2 border-transparent hover:border-[#005AFF]">
              <td className="p-5 font-black italic text-[#005AFF]">{index + 1}</td>
              <td className="p-5 font-black uppercase text-sm italic">{user.username}</td>
              <td className="p-5 text-right">
                <div className="flex flex-col items-end">
                  <span className="font-black text-xl italic leading-none">{user.virtualTotal}</span>
                  <span className="text-[8px] text-green-500 font-bold uppercase mt-1">
                    +{user.currentRacePoints} live
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}