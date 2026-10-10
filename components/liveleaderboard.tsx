"use client";

import { useEffect, useState, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";

// Supabase client eenmalig buiten de render-cycle aanmaken
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface UserScore {
  user_id: string;
  race_id: number;
  points: number;
  updated_at?: string;
}

interface LeaderboardUser {
  id?: string;
  user_id?: string;
  nickname?: string;
  urer_name?: string; // Rekening gehouden met eventuele typefout in DB
  user_name?: string;
  total_points?: number | string;
}

export default function LiveLeaderboard({ 
  initialScores = [], 
  raceId, 
  leaderboard = [] 
}: { 
  initialScores?: UserScore[]; 
  raceId: string | number; 
  leaderboard?: LeaderboardUser[]; 
}) {
  const [liveScores, setLiveScores] = useState<UserScore[]>(initialScores);

  // Synchroniseer initialScores als de server-props verversen
  useEffect(() => {
    if (initialScores && initialScores.length > 0) {
      setLiveScores(initialScores);
    }
  }, [initialScores]);

  // Functie die de nieuwste stand ophaalt uit Supabase via Polling
  const fetchScores = useCallback(async () => {
    const numericRaceId = typeof raceId === "string" ? parseInt(raceId, 10) : raceId;

    if (isNaN(numericRaceId)) return;

    const { data, error } = await supabase
      .from("actual_scores")
      .select("*")
      .eq("race_id", numericRaceId);

    if (data && !error) {
      setLiveScores(data as UserScore[]);
    }
  }, [raceId]);

  // Polling-loop instellen op 10 seconden
  useEffect(() => {
    // Direct eenmaal ophalen bij mount
    fetchScores();

    // Elke 10 seconden opnieuw ophalen
    const intervalId = setInterval(() => {
      fetchScores();
    }, 10000);

    // Opruimen wanneer de component unmount
    return () => clearInterval(intervalId);
  }, [fetchScores]);

  // Bereken de virtuele tussenstand
  const liveStanding = (leaderboard || []).map(user => {
    const userId = user.id || user.user_id;

    const currentRacePoints = liveScores?.find(s => 
      s.user_id === userId
    )?.points || 0;
    
    const basePoints = Number(user.total_points) || 0;

    return {
      ...user,
      currentRacePoints,
      virtualTotal: basePoints + currentRacePoints
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
          {liveStanding.map((user, index) => {
            const displayName = user.nickname || user.urer_name || user.user_name || 'Racer';
            const userId = user.user_id || user.id || `user-${index}`;

            return (
              <tr key={userId} className="hover:bg-[#1c222d]/50 transition-all duration-500">
                <td className="p-5 font-black italic text-[#005AFF] text-lg">
                  {index + 1}
                </td>
                <td className="p-5">
                  <div className="flex flex-col">
                    <span className="font-black uppercase text-sm italic tracking-tight text-white">
                      {displayName}
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
            );
          })}
        </tbody>
      </table>
    </div>
  );
}