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
    const channel = supabase
      .channel('realtime-live-scores')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'actual_scores',
        filter: `race_id=eq.${raceId}`
      }, async () => {
        const { data } = await supabase
          .from('actual_scores')
          .select('*')
          .eq('race_id', raceId);
        
        if (data) setLiveScores(data);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [raceId, supabase]);

  const liveStanding = (leaderboard || []).map(user => {
    // VERBETERDE MATCH-REGEL: 
    // We checken of het ID uit de scores matcht met 'id' OF 'user_id' uit het leaderboard object
    const currentRacePoints = liveScores?.find(s => 
      s.user_id === user.id || s.user_id === user.user_id
    )?.points || 0;
    
    return {
      ...user,
      currentRacePoints,
      virtualTotal: (Number(user.total_points) || 0) + currentRacePoints
    };
  }).sort((a, b) => b.virtualTotal - a.virtualTotal);

  return (
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
            <tr key={user.user_id || user.id} className="hover:bg-[#1c222d]/50 transition-all duration-500">
              <td className="p-5 font-black italic text-[#005AFF] text-lg">
                {index + 1}
              </td>
              <td className="p-5">
                <div className="flex flex-col">
                  <span className="font-black uppercase text-sm italic tracking-tight text-white">
                    {/* Rekening gehouden met de 'urer_name' typefout in de database */}
                    {user.nickname || user.urer_name || 'Racer'}
                  </span>
                  <span className="text-[7px] text-slate-500 uppercase tracking-widest mt-0.5">
                    F1 Deelnemer
                  </span>
                </div>
              </td>
              <td className="p-5 text-right">
                <div className="flex flex-col items-end">
                  <span className="font-black text-xl italic leading-none text-white">
                    {user.virtualTotal}
                  </span>
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
  );
}