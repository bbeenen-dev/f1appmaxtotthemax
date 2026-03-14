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
      
      // 1. Haal alle races op, chronologisch gesorteerd (oud naar nieuw)
      // De filter op 'race_start' is verwijderd zodat races met vroege scores altijd zichtbaar zijn
      const { data: races } = await supabase
        .from("races")
        .select("id, slug, has_sprint, race_start")
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
        // 2. Filter races: toon alleen de races waarvoor daadwerkelijk scores bestaan
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
    <div className="bg-[#161a23] rounded-3xl p-10 text-center animate-pulse text-slate-500 uppercase italic text-xs border border-white/5 font-f1">
      WK Matrix opbouwen...
    </div>
  );

  return (
    <section className="group relative p-[1px] rounded-3xl overflow-hidden shadow-2xl">
      <div className="absolute inset-0 bg-[conic-gradient(from_180deg_at_50%_50%,#e10600_0deg,#e10600_40deg,transparent_90deg)] opacity-40" />
      
      <div className="relative bg-[#161a23] rounded-[calc(1.5rem-1px)] overflow-hidden border border-white/5 transition-all">
        
        <div className="p-6 pb-2 border-b border-white/5">
          <h2 className="font-f1 text-2xl font-black italic uppercase tracking-tighter text-white leading-none">
            F1 <span className="text-[#e10600]">Stand</span>
          </h2>
          <p className="text-[10px] text-slate-500 uppercase font-bold mt-2 tracking-widest italic">
            Algemeen klassement & sessie overzicht
          </p>
        </div>

        <div className="overflow-x-auto overflow-y-hidden">
          <table className="w-full text-left border-separate border-spacing-0 min-w-max">
            <thead>
              <tr className="bg-white/5 text-xs font-f1 uppercase tracking-widest text-slate-400">
                <th className="sticky left-0 z-20 bg-[#1c212c] py-4 px-2 font-black w-10 text-center border-b border-white/5">#</th>
                <th className="sticky left-10 z-20 bg-[#1c212c] py-4 px-4 font-black min-w-[130px] border-b border-white/5">NAAM</th>
                <th className="sticky left-[170px] z-20 bg-[#222834] py-4 px-4 text-center font-black text-yellow-500 border-b border-white/5">TOT</th>
                
                {activeRaces.map(race => (
                  <th key={race.id} colSpan={race.has_sprint ? 3 : 2} className="py-4 px-2 text-center border-l border-white/10 font-black text-white bg-black/20 border-b border-white/5 text-sm tracking-tighter">
                    {race.slug}
                  </th>
                ))}
              </tr>
              <tr className="text-sm font-f1 uppercase text-slate-500 bg-black/10">
                <th className="sticky left-0 z-20 bg-[#1c212c] border-b border-white/5"></th>
                <th className="sticky left-10 z-20 bg-[#1c212c] border-b border-white/5"></th>
                <th className="sticky left-[170px] z-20 bg-[#222834] border-b border-white/5"></th>
                {activeRaces.map(race => (
                  <Fragment key={`sub-${race.id}`}>
                    {race.has_sprint && <th className="py-2 text-center border-l border-white/10 w-12 text-orange-400 border-b border-white/5 font-black text-base">S</th>}
                    <th className={`py-2 text-center w-12 border-b border-white/5 font-black text-base ${!race.has_sprint ? 'border-l border-white/10' : ''}`}>Q</th>
                    <th className="py-2 text-center w-12 border-b border-white/5 font-black text-base text-white">R</th>
                  </Fragment>
                ))}
              </tr>
            </thead>
            
            <tbody className="divide-y divide-white/5">
              {entries.map((index_entry, index) => (
                <tr key={index_entry.user_id} className="hover:bg-white/5 transition-colors group">
                  <td className="sticky left-0 z-10 bg-[#161a23] py-4 px-2 text-center border-b border-white/5 group-hover:bg-[#1c222d]">
                    <span className={`font-f1 italic font-black text-xs ${
                      index === 0 ? "text-yellow-500" : index === 1 ? "text-slate-300" : index === 2 ? "text-orange-400" : "text-slate-600"
                    }`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="sticky left-10 z-10 bg-[#161a23] py-4 px-4 border-b border-white/5 group-hover:bg-[#1c222d]">
                    <p className="font-f1 font-black italic uppercase text-xs tracking-tight text-white">
                      {index_entry.nickname || index_entry.urer_name || "Coureur"}
                    </p>
                  </td>
                  <td className="sticky left-[170px] z-10 bg-[#1c212c] py-4 px-4 text-center font-f1 font-black italic text-sm text-white border-b border-white/5 group-hover:bg-[#222834]">
                    {index_entry.grand_total || 0}
                  </td>

                  {activeRaces.map(race => {
                    const s = index_entry.scores[race.id];
                    return (
                      <Fragment key={`cell-${index_entry.user_id}-${race.id}`}>
                        {race.has_sprint && (
                          <td className="py-4 text-center border-l border-white/5 text-sm text-slate-400 font-black italic border-b border-white/5">
                            {s?.s ?? "-"}
                          </td>
                        )}
                        <td className={`py-4 text-center text-sm text-slate-400 font-black italic border-b border-white/5 ${!race.has_sprint ? 'border-l border-white/5' : ''}`}>
                          {s?.q ?? "-"}
                        </td>
                        <td className="py-4 text-center text-base text-white font-black bg-white/5 italic border-b border-white/5">
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
        
        <div className="bg-black/20 p-3">
          <p className="text-[10px] text-slate-600 uppercase font-black italic text-right px-4 tracking-widest">
            S = Sprint | Q = Qualy | R = Race
          </p>
        </div>
      </div>
    </section>
  );
}