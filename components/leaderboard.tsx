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
  status: string; // Toegevoegd voor de status-check
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
      
      // Stap 1: Haal alleen de races op die de status 'scheduled' hebben
      const { data: races } = await supabase
        .from("races")
        .select("id, slug, has_sprint, race_start, status")
        .eq("status", "scheduled") 
        .order("race_start", { ascending: true });

      const { data: board } = await supabase
        .from("leaderboard")
        .select("user_id, nickname, urer_name, grand_total")
        .order("grand_total", { ascending: false });

      const [qScores, rScores, sScores] = await Promise.all([
        supabase.from("scores_qualifying").select("user_id, race_id, points"),
        supabase.from("scores_race").select("user_id, race_id, points"),
        supabase.from("scores_sprint").select("user_id, race_id, points"),
      ]);

      if (board && races) {
        // Stap 2: Filter binnen de 'scheduled' races alleen diegene waar al scores voor zijn
        const filteredRaces = races.filter(race => {
          const hasQ = qScores.data?.some(s => s.race_id === race.id);
          const hasR = rScores.data?.some(s => s.race_id === race.id);
          const hasS = sScores.data?.some(s => s.race_id === race.id);
          return hasQ || hasR || hasS;
        });

        // Stap 3: Zet de nieuwste resultaten vooraan (naast de TOT kolom)
        setActiveRaces([...filteredRaces].reverse());

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
    <div className="bg-[#161a23] rounded-3xl p-10 text-center animate-pulse text-slate-500 uppercase italic text-xs border border-white/5 font-f1">
      WK Matrix opbouwen...
    </div>
  );

  return (
    <section className="group relative p-[1px] rounded-3xl overflow-hidden shadow-2xl">
      <div className="absolute inset-0 bg-[conic-gradient(from_180deg_at_50%_50%,#e10600_0deg,#e10600_40deg,transparent_90deg)] opacity-40" />
      
      <div className="relative bg-[#161a23] rounded-[calc(1.5rem-1px)] overflow-hidden border border-white/5 transition-all">
        
        <div className="p-4 pb-2 border-b border-white/5">
          <h2 className="font-f1 text-xl font-black italic uppercase tracking-tighter text-white leading-none">
            F1 <span className="text-[#e10600]">Stand</span>
          </h2>
          <p className="text-[9px] text-slate-500 uppercase font-bold mt-1 tracking-widest italic">
            Meest recente resultaten vooraan
          </p>
        </div>

        <div className="overflow-x-auto overflow-y-hidden">
          <table className="w-full text-left border-separate border-spacing-0 min-w-max">
            <thead>
              <tr className="bg-white/5 text-[10px] font-f1 uppercase tracking-widest text-slate-400">
                <th className="sticky left-0 z-30 bg-[#1c212c] py-2 px-2 font-black w-8 text-center border-b border-white/5">#</th>
                <th className="sticky left-8 z-30 bg-[#1c212c] py-2 px-4 font-black min-w-[120px] border-b border-white/5">NAAM</th>
                <th className="sticky left-[152px] z-30 bg-[#222834] py-2 px-3 text-center font-black text-green-400 border-b border-white/5 border-r-2 border-green-500/50 shadow-[4px_0_10px_-2px_rgba(0,0,0,0.5)]">TOT</th>
                
                {activeRaces.map(race => (
                  <th key={race.id} colSpan={race.has_sprint ? 3 : 2} className="py-2 px-2 text-center border-l border-white/10 font-black text-white bg-black/20 border-b border-white/5 text-[11px] tracking-tighter">
                    {race.slug}
                  </th>
                ))}
              </tr>
              <tr className="text-[11px] font-f1 uppercase text-slate-500 bg-black/10">
                <th className="sticky left-0 z-30 bg-[#1c212c] border-b border-white/5"></th>
                <th className="sticky left-8 z-30 bg-[#1c212c] border-b border-white/5"></th>
                <th className="sticky left-[152px] z-30 bg-[#222834] border-b border-white/5 border-r-2 border-green-500/50"></th>
                {activeRaces.map(race => (
                  <Fragment key={`sub-${race.id}`}>
                    {race.has_sprint && <th className="py-1 text-center border-l border-white/10 w-10 text-orange-400 border-b border-white/5 font-black text-xs">S</th>}
                    <th className={`py-1 text-center w-10 border-b border-white/5 font-black text-xs ${!race.has_sprint ? 'border-l border-white/10' : ''}`}>Q</th>
                    <th className="py-1 text-center w-10 border-b border-white/5 font-black text-xs text-white">R</th>
                  </Fragment>
                ))}
              </tr>
            </thead>
            
            <tbody className="divide-y divide-white/5">
              {entries.map((index_entry, index) => (
                <tr key={index_entry.user_id} className="hover:bg-white/5 transition-colors group">
                  <td className="sticky left-0 z-10 bg-[#161a23] py-2 px-2 text-center border-b border-white/5 group-hover:bg-[#1c222d]">
                    <span className={`font-f1 italic font-black text-[10px] ${
                      index === 0 ? "text-yellow-500" : index === 1 ? "text-slate-300" : index === 2 ? "text-orange-400" : "text-slate-600"
                    }`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="sticky left-8 z-10 bg-[#161a23] py-2 px-4 border-b border-white/5 group-hover:bg-[#1c222d]">
                    <p className="font-f1 font-black italic uppercase text-[11px] tracking-tight text-white whitespace-nowrap">
                      {index_entry.nickname || index_entry.urer_name || "Coureur"}
                    </p>
                  </td>
                  <td className="sticky left-[152px] z-10 bg-[#1c212c] py-2 px-3 text-center font-f1 font-black italic text-xs text-green-400 border-b border-white/5 border-r-2 border-green-500/50 group-hover:bg-[#222834] shadow-[4px_0_10px_-2px_rgba(0,0,0,0.5)]">
                    {index_entry.grand_total || 0}
                  </td>

                  {activeRaces.map(race => {
                    const s = index_entry.scores[race.id];
                    return (
                      <Fragment key={`cell-${index_entry.user_id}-${race.id}`}>
                        {race.has_sprint && (
                          <td className="py-2 text-center border-l border-white/5 text-xs text-slate-400 font-black italic border-b border-white/5">
                            {s?.s ?? "-"}
                          </td>
                        )}
                        <td className={`py-2 text-center text-xs text-slate-400 font-black italic border-b border-white/5 ${!race.has_sprint ? 'border-l border-white/5' : ''}`}>
                          {s?.q ?? "-"}
                        </td>
                        <td className="py-2 text-center text-sm text-white font-black bg-white/5 italic border-b border-white/5">
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
        
        <div className="bg-black/20 p-2">
          <p className="text-[9px] text-slate-600 uppercase font-black italic text-right px-4 tracking-widest">
            S = Sprint | Q = Qualy | R = Race
          </p>
        </div>
      </div>
    </section>
  );
}