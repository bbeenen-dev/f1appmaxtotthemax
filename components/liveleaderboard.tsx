"use client";

import { useEffect, useState, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";

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
  urer_name?: string; 
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

  useEffect(() => {
    if (initialScores && initialScores.length > 0) {
      setLiveScores(initialScores);
    }
  }, [initialScores]);

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

  useEffect(() => {
    fetchScores();
    const intervalId = setInterval(() => {
      fetchScores();
    }, 10000);

    return () => clearInterval(intervalId);
  }, [fetchScores]);

  // Stap 1: Bepaal ieders basisdata en virtuele totalen
  const processedUsers = (leaderboard || []).map((user, index) => {
    const validUserId = user.user_id || user.id || `user-${index}`;
    const currentRacePoints = liveScores?.find(s => s.user_id === validUserId || s.user_id === user.user_id)?.points || 0;
    const basePoints = Number(user.total_points) || 0;

    return {
      ...user,
      validUserId,
      basePoints,
      currentRacePoints,
      virtualTotal: basePoints + currentRacePoints
    };
  });

  // Stap 2: Bepaal de OUDE ranglijst (gesorteerd op eerdere punten van hoog naar laag)
  const sortedByBase = [...processedUsers].sort((a, b) => b.basePoints - a.basePoints);
  const oldRankMap = new Map<string, number>();
  sortedByBase.forEach((user, index) => {
    oldRankMap.set(user.validUserId, index + 1);
  });

  // Stap 3: Bepaal de NIEUWE ranglijst (gesorteerd op virtualTotal) en bereken positieverschil
  const liveStanding = [...processedUsers]
    .sort((a, b) => b.virtualTotal - a.virtualTotal)
    .map((user, newIndex) => {
      const newRank = newIndex + 1;
      const oldRank = oldRankMap.get(user.validUserId) ?? newRank;
      const rankDiff = oldRank - newRank;

      return {
        ...user,
        rank: newRank,
        rankDiff
      };
    });

  return (
    <div className="bg-[#161a23] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl w-full">
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse text-xs md:text-sm">
          <thead>
            <tr className="bg-[#1c222d] text-slate-400 text-[8px] md:text-[9px] uppercase tracking-wider border-b border-slate-800">
              <th className="p-3 md:p-4 font-black">Deelnemer</th>
              <th className="p-3 md:p-4 text-right font-black whitespace-nowrap">Vorige</th>
              <th className="p-3 md:p-4 text-right font-black whitespace-nowrap">Live</th>
              <th className="p-3 md:p-4 text-right font-black text-[#005AFF] whitespace-nowrap">Totaal (V)</th>
              <th className="p-3 md:p-4 text-center font-black">+/-</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {liveStanding.map((user) => {
              const displayName = user.nickname || user.urer_name || user.user_name || 'Racer';

              return (
                <tr key={user.validUserId} className="hover:bg-[#1c222d]/50 transition-all duration-300">
                  {/* Kolom 1: Deelnemer + Huidige Live Positie */}
                  <td className="p-3 md:p-4 max-w-[120px] md:max-w-none truncate">
                    <div className="flex items-center gap-2">
                      <span className="font-black italic text-slate-500 text-xs md:text-sm w-5 shrink-0">
                        {user.rank}.
                      </span>
                      <div className="flex flex-col truncate">
                        <span className="font-black uppercase text-xs md:text-sm italic tracking-tight text-white truncate">
                          {displayName}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Kolom 2: Punten t/m vorige race */}
                  <td className="p-3 md:p-4 text-right font-bold text-slate-300 text-xs md:text-sm">
                    {user.basePoints}
                  </td>

                  {/* Kolom 3: Virtuele punten race */}
                  <td className="p-3 md:p-4 text-right font-bold text-green-400 text-xs md:text-sm whitespace-nowrap">
                    +{user.currentRacePoints}
                  </td>

                  {/* Kolom 4: Virtuele totaalstand */}
                  <td className="p-3 md:p-4 text-right font-black italic text-base md:text-xl text-white whitespace-nowrap">
                    {user.virtualTotal}
                  </td>

                  {/* Kolom 5: Positie mutatie (Groen/Rood pijltje) */}
                  <td className="p-3 md:p-4 text-center whitespace-nowrap">
                    {user.rankDiff > 0 ? (
                      <span className="inline-flex items-center justify-center bg-green-500/10 text-green-400 font-bold px-1.5 py-0.5 rounded text-[10px] md:text-xs">
                        ▲ {user.rankDiff}
                      </span>
                    ) : user.rankDiff < 0 ? (
                      <span className="inline-flex items-center justify-center bg-red-500/10 text-red-400 font-bold px-1.5 py-0.5 rounded text-[10px] md:text-xs">
                        ▼ {Math.abs(user.rankDiff)}
                      </span>
                    ) : (
                      <span className="text-slate-600 font-bold text-[10px] md:text-xs">
                        -
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}