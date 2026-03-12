"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

// --- Interfaces voor de data-structuur ---
interface RaceInfo {
  id: number;
  slug: string;
  has_sprint: boolean;
  race_start: string;
}

interface ScoreEntry {
  user_id: string;
  race_id: number;
  points: number;
}

interface LeaderboardEntry {
  user_id: string;
  nickname: string;
  urer_name: string;
  grand_total: number;
  // Hier slaan we de scores per race dynamisch in op
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

      // 1. Haal races op (alleen die al geweest zijn of bezig zijn)
      const { data: races } = await supabase
        .from("races")
        .select("id, slug, has_sprint, race_start")
        .lte("race_start", new Date().toISOString())
        .order("race_start", { ascending: false });

      // 2. Haal het basis leaderboard op
      const { data: board } = await supabase
        .from("leaderboard")
        .select("user_id, nickname, urer_name, grand_total")
        .order("grand_total", { ascending: false });

      // 3. Haal alle scores op uit de 3 verschillende tabellen
      const [qScores, rScores, sScores] = await Promise.all([
        supabase.from("scores_qualifying").select("user_id, race_id, points"),
        supabase.from("scores_race").select("user_id, race_id, points"),
        supabase.from("scores_sprint").select("user_id, race_id, points"),
      ]);

      if (board && races) {
        // We filteren de races: alleen tonen als er voor MINSTENS één iemand een score is in Q, R of S
        const filteredRaces = races.filter(race => {
          const hasQ = qScores.data?.some(s => s.race_id === race.id);
          const hasR = rScores.data?.some(s => s.race_id === race.id);
          const hasS = sScores.data?.some(s => s.race_id === race.id);
          return hasQ || hasR || hasS;
        });

        setActiveRaces(filteredRaces);

        // Map de scores naar de juiste spelers
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
    <div className="text-center p-10 animate-pulse font-f1 italic text-slate-500 uppercase text-xs">Stand laden...</div>
  );

  return (
    <section className="mt-12 mb-24 px-2">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6 px-2">
          <div className="w-1 h-6 bg-[#e10600]"></div>
          <h2 className="font-f1 text-xl font-black italic uppercase tracking-tighter">
            WK <span className="text-[#e10600]">Stand</span>
          </h2>
        </div>

        <div className="bg-[#161a23] rounded-3xl border border-white/5 shadow-2xl overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              {/* Bovenste rij: Race Slugs */}
              <tr className="bg-white/5 text-[9px] font-f1 uppercase tracking-widest text-slate-500 border-b border-white/5">
                <th className="py-4 px-4 font-black w-12 text-center">Pos</th>
                <th className="py-4 px-2 font-black">Speler</th>
                <th className="py-4 px-4 text-center font-black bg-white/5">Totaal</th>
                
                {activeRaces.map(race => (
                  <th key={race.id} colSpan={race.has_sprint ? 3 : 2} className="py-4 px-2 text-center border-l border-white/10 font-black text-white">
                    {race.slug}
                  </th>
                ))}
              </tr>
              {/* Tweede rij: S Q R headers */}
              <tr className="text-[8px] font-f1 uppercase text-slate-600 border-b border-white/5">
                <th colSpan={3}></th>
                {activeRaces.map(race => (
                  <>
                    {race.has_sprint && <th key={`${race.id}-s`} className="py-2 text-center border-l border-white/10 w-8">S</th>}
                    <th key={`${race.id}-q`} className={`py-2 text-center w-8 ${!race.has_sprint ? 'border-l border-white/10' : ''}`}>Q</th>
                    <th key={`${race.id}-r`} className="py-2 text-center w-8">R</th>
                  </>
                ))}
              </tr>
            </thead>
            
            <tbody className="divide-y divide-white/5">
              {entries.map((entry, index) => (
                <tr key={entry.user_id} className="hover:bg-white/5 transition-colors group">
                  <td className="py-4 px-4 text-center">
                    <span className={`font-f1 italic font-black text-xs ${index === 0 ? "text-yellow-500" : "text-slate-500"}`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="py-4 px-2">
                    <p className="font-f1 font-black italic uppercase text-xs tracking-tight text-white truncate max-w-[120px]">
                      {entry.nickname || entry.urer_name || "Coureur"}
                    </p>
                  </td>
                  <td className="py-4 px-4 text-center bg-white/5 font-f1 font-black italic text-sm text-yellow-500">
                    {entry.grand_total || 0}
                  </td>

                  {activeRaces.map(race => {
                    const s = entry.scores[race.id];
                    return (
                      <>
                        {race.has_sprint && (
                          <td key={`${race.id}-s-val`} className="py-4 text-center border-l border-white/5 text-[10px] text-slate-400 font-bold">
                            {s?.s ?? "-"}
                          </td>
                        )}
                        <td key={`${race.id}-q-val`} className={`py-4 text-center text-[10px] text-slate-400 font-bold ${!race.has_sprint ? 'border-l border-white/5' : ''}`}>
                          {s?.q ?? "-"}
                        </td>
                        <td key={`${race.id}-r-val`} className="py-4 text-center text-[10px] text-white font-black bg-white/5">
                          {s?.r ?? "-"}
                        </td>
                      </>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}