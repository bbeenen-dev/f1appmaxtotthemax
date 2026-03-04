"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

// Forceer Next.js om de pagina telkens vers op te bouwen
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
      
      // We gebruiken .select() met de exacte kolommen uit je nieuwe View.
      // De .neq() filter dient als cache-breaker om de Vercel/Supabase cache te omzeilen.
      const { data: board, error } = await supabase
        .from("leaderboard")
        .select("nickname, urer_name, total_points, grand_total")
        .neq("nickname", "CACHE_BREAKER_NULL") 
        .range(0, 100) 
        .order("grand_total", { ascending: false });

      if (!error && board) {
        // Controleer je browser console (F12) om te zien of hier nu '11' staat.
        console.log(`[${new Date().toLocaleTimeString()}] Leaderboard geladen: ${board.length} spelers.`);
        setData(board);
      } else if (error) {
        console.error("Fout bij ophalen leaderboard:", error.message);
      }
      setLoading(false);
    }
    
    fetchLeaderboard();
  }, [supabase]);

  if (loading) return (
    <div className="text-center p-10 animate-pulse font-f1 italic text-slate-500 uppercase text-xs">
      Stand laden...
    </div>
  );

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
                        {/* We tonen nu de nickname die in je SQL resultaat staat */}
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
        
        <p className="text-center mt-6 text-[10px] text-slate-500 font-f1 uppercase tracking-[0.2em] italic">
          Punten worden automatisch berekend na elke sessie
        </p>
      </div>
    </section>
  );
}