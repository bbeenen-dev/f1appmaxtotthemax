"use client";

import { useEffect, useState, Fragment } from "react";
import { createBrowserClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

// --- Interfaces ---
interface RaceInfo {
  id: number;
  slug: string;
  has_sprint: boolean;
  race_start: string;
}

interface LeaderboardEntry {
  user_id: string;
  nickname: string;
  urer_name: string;
  grand_total: number;
  scores: {
    [raceId: number]: { q?: number; r?: number; s?: number };
  };
}

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [activeRaces, setActiveRaces] = useState<RaceInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function fetchFullLeaderboard() {
      setLoading(true);

      // 1. Haal races op die gestart zijn
      const { data: races } = await supabase
        .from("races")
        .select("id, slug, has_sprint, race_start")
        .lte("race_start", new Date().toISOString())
        .order("race_start", { ascending: false });

      // 2. Haal basis leaderboard
      const { data: board } = await supabase
        .from("leaderboard")
        .select("user_id, nickname, urer_name, grand_total")
        .order("grand_total", { ascending: false });

      // 3. Haal scores op
      const [qScores, rScores, sScores] = await Promise.all([
        supabase.from("scores_qualifying").select("user_id, race_id, points"),
        supabase.from("scores_race").select("user_id, race_id, points"),
        supabase.from("scores_sprint").select("user_id, race_id, points"),
      ]);

      if (board && races) {
        // Filter races die daadwerkelijk scores hebben
        const filteredRaces = races.filter(race => {
          const hasQ = qScores.data?.some(s => s.race_id === race.id);
          const hasR = rScores.data?.some(s => s.race_id === race.id);
          const hasS = sScores.data?.some(s => s.race_id === race.id);
          return hasQ || hasR || hasS;
        });

        setActiveRaces(filteredRaces);

        const fullEntries: LeaderboardEntry[] = board.map(player => {
          const playerScores: LeaderboardEntry["scores"] = {};
          filteredRaces.forEach(race => {
            playerScores[race.id] = {
              q: qScores.data?.find(s => s.user_id === player.user_id && s.race_id === race.id)?.points,
              r: rScores.data?.find(s => s.user_id === player.user_id && s.race_id === race.id)?.points,
              s: sScores.data?.find(s => s.user_id === player.user_id && s.race_id === race.id)?.points,
            };
          });
          return { ...player, scores: playerScores };
        });

        setEntries(fullEntries);
      }
      setLoading(false);
    }

    fetchFullLeaderboard();
  }, [supabase]);

  if (loading) return (
    <div className="bg-[#161a23] rounded-3xl p-10 text-center animate-pulse text-slate-500 uppercase italic text-[10px] border border-white/5">
      Stand laden...
    </div>
  );

  return (
    <section className="relative">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-6 bg-[#e10600]"></div>
        <h2 className="font-f1 text-2xl font-black italic uppercase tracking-tighter text-white">
          F1 <span className="text-[#e10600]">Stand</span>
        </h2>
      </div>

      <div className="bg-[#161a23] rounded-3xl border border-white/5 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto overflow-y-hidden">
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="bg-white/5 text-[9px] font-f1 uppercase tracking-widest text-slate-500 border-b border-white/5">
                <th className="py-4 px-4 font-black w-12 text-center">Pos</th>
                <th className="py-4 px-2 font-black">Speler</th>
                <th className="py-4 px-4 text-center font-black bg-white/5 text-yellow-500">Totaal</th>
                
                {activeRaces.map(race => (
                  <th key={race.id} colSpan={race.has_sprint ? 3 : 2} className="py-4 px-2 text-center border-l border-white/10 font-black text-white bg-black/20">
                    {race.slug}
                  </th>
                ))}
              </tr>
              <tr className="text-[8px] font-f1 uppercase text-slate-600 border-b border-white/5 bg-black/10">
                <th colSpan={3}></th>
                {activeRaces.map(race => (
                  <Fragment key={`header-${race.id}`}>
                    {race.has_sprint && <th className="py-2 text-center border-l border-white/10 w-8 text-orange-400">S</th>}
                    <th className={`py-2 text-center w-8 ${!race.has_sprint ? 'border-l border-white/10' : ''}`}>Q</th>
                    <th className="py-2 text-center w-8">R</th>
                  </Fragment>
                ))}
              </tr>
            </thead>
            
            <tbody className="divide-y divide-white/5">
              {entries.map((entry, index) => (
                <tr key={entry.user_id} className="hover:bg-white/5 transition-colors">
                  <td className="py-4 px-4 text-center">
                    <span className={`font-f1 italic font-black text-xs ${
                      index === 0 ? "text-yellow-500" : 
                      index === 1 ? "text-slate-300" : 
                      index === 2 ? "text-orange-400" : "text-slate-600"
                    }`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="py-4 px-2">
                    <p className="font-f1 font-black italic uppercase text-xs tracking-tight text-white truncate max-w-[100px]">
                      {entry.nickname || entry.urer_name || "Coureur"}
                    </p>
                  </td>
                  <td className="py-4 px-4 text-center bg-white/5 font-f1 font-black italic text-sm text-white">
                    {entry.grand_total || 0}
                  </td>

                  {activeRaces.map(race => {
                    const s = entry.scores[race.id];
                    return (
                      <Fragment key={`cell-${entry.user_id}-${race.id}`}>
                        {race.has_sprint && (
                          <td className="py-4 text-center border-l border-white/5 text-[10px] text-slate-400 font-bold italic">
                            {s?.s ?? "-"}
                          </td>
                        )}
                        <td className={`py-4 text-center text-[10px] text-slate-400 font-bold italic ${!race.has_sprint ? 'border-l border-white/5' : ''}`}>
                          {s?.q ?? "-"}
                        </td>
                        <td className="py-4 text-center text-[10px] text-white font-black bg-white/5 italic">
                          {s?.r ?? "-"}
                        </td>
                      </Fragment>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-[8px] text-slate-600 uppercase font-black italic mt-4 text-right px-4 tracking-widest">
        S = Sprint | Q = Qualy | R = Race
      </p>
    </section>
  );
}