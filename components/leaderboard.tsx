"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

interface LeaderboardEntry {
  urer_name: string;
  nickname: string;
  total_points: number;
  grand_total: number;
}

export default function Leaderboard() {
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      
      // We halen alle kolommen expliciet op en forceren een range tot 100
      const { data: board, error } = await supabase
        .from("leaderboard")
        .select("urer_name, nickname, total_points, grand_total")
        .range(0, 100) 
        .order("grand_total", { ascending: false });

      if (!error && board) {
        console.log(`Leaderboard geladen: ${board.length} spelers.`);
        setData(board);
      } else if (error) {
        console.error("Fout:", error.message);
      }
      setLoading(false);
    }
    
    fetchLeaderboard();
  }, [supabase]);

  if (loading) return <div className="text-center p-10 animate-pulse font-f1 italic text-slate-500 uppercase text-xs">Stand laden...</div>;

  return (
    <section className="mt-12 mb-24 px-4">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-6 bg-[#e10600]"></div>
          <h2 className="font-f1 text-xl font-black italic uppercase tracking-tighter">
            Stand <span className="text-[#e10600]">WK Voorspellen</span>
          </h2>
        </div>

        <div className="bg-[#161a23] rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 text-[10px] font-f1 uppercase tracking-widest text-slate-500">
                <th className="py-4 px-6 font-black">Pos</th>
                <th className="py-4 px-2 font-black">Speler</th>
                <th className="py-4 px-6 text-right font-black">Punten</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.map((entry, index) => {
                const displayPoints = entry.grand_total ?? 0;
                
                return (
                  <tr key={index} className={`group transition-colors hover:bg-white/5 ${index === 0 ? 'bg-yellow-500/5' : ''}`}>
                    <td className="py-4 px-6">
                      <span className={`font-f1 italic font-black text-sm ${
                        index === 0 ? "text-yellow-500" : 
                        index === 1 ? "text-slate-300" : 
                        index === 2 ? "text-orange-400" : "text-slate-600"
                      }`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-4 px-2">
                      <p className="font-f1 font-black italic uppercase text-sm tracking-normal text-white">
                        {/* HIER GEBRUIKEN WE NU PRIMAIR DE NICKNAME */}
                        {entry.nickname || entry.urer_name || "Anonieme Coureur"}
                      </p>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="font-f1 font-black italic text-sm text-white">
                        {displayPoints}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {data.length === 0 && (
            <div className="p-10 text-center text-slate-500 font-f1 italic uppercase text-[10px] tracking-widest">
              Geen deelnemers gevonden
            </div>
          )}
        </div>
      </div>
    </section>
  );
}