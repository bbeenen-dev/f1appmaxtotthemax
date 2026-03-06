"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

interface SeasonPrediction {
  nickname: string;
  driver_champion: string;
  constructor_champion: string;
}

export default function SeasonOverviewPage() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [predictions, setPredictions] = useState<SeasonPrediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPredictions() {
      try {
        setLoading(true);
        
        // 1. Haal de voorspellingen op
        const { data: predData, error: predError } = await supabase
          .from("predictions_season")
          .select("user_id, driver_champion, constructor_champion");

        if (predError) throw predError;

        // 2. Haal de nicknames op uit de profiles tabel
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, nickname");

        if (profileError) throw profileError;

        // 3. Combineer de data handmatig op basis van user_id
        if (predData) {
          const formatted = predData.map((item: any) => {
            const userProfile = profileData?.find(p => p.id === item.user_id);
            return {
              nickname: userProfile?.nickname || "Onbekende Coureur",
              driver_champion: item.driver_champion || "Niet ingevuld",
              constructor_champion: item.constructor_champion || "Niet ingevuld",
            };
          });

          // Sorteren op alfabet
          formatted.sort((a, b) => a.nickname.localeCompare(b.nickname));
          setPredictions(formatted);
        }
      } catch (err: any) {
        console.error("Data ophaal fout:", err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchPredictions();
  }, [supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f111a] flex items-center justify-center font-f1 text-yellow-500 italic animate-pulse text-sm tracking-widest">
        OPENING SEASON VAULT...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f111a] text-white p-4 md:p-8 pb-32 font-f1">
      <div className="max-w-3xl mx-auto">
        
        <header className="mb-10">
          <button 
            onClick={() => router.push('/')} // Direct naar home ipv back() voor stabiliteit
            className="text-slate-500 text-[10px] uppercase mb-4 hover:text-yellow-500 transition-colors tracking-widest"
          >
            ← Terug naar Dashboard
          </button>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-l-4 border-yellow-500 pl-6">
            <div>
              <h1 className="text-4xl font-black italic uppercase leading-none">
                Season <span className="text-yellow-500">2026</span>
              </h1>
              <p className="text-slate-500 text-[10px] uppercase mt-2 tracking-[0.3em]">
                Gezamenlijke Voorspellingen
              </p>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/20 px-4 py-2 rounded-lg">
              <span className="text-yellow-500 text-[10px] font-black uppercase italic tracking-widest flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                </span>
                Predictions Sealed
              </span>
            </div>
          </div>
        </header>

        {predictions.length > 0 ? (
          <div className="bg-[#161a23] rounded-3xl border border-slate-800/50 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#1c222d] border-b border-slate-800">
                    <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      Deelnemer
                    </th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase text-yellow-500 tracking-widest">
                      Driver Champion
                    </th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase text-yellow-500 tracking-widest">
                      Constructor
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30">
                  {predictions.map((pred, index) => (
                    <tr key={index} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-2 rounded-full bg-slate-700 group-hover:bg-yellow-500 transition-colors"></div>
                          <span className="font-black italic uppercase text-sm group-hover:text-yellow-500 transition-colors">
                            {pred.nickname}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-sm font-bold text-slate-300 uppercase italic tracking-tight">
                          {pred.driver_champion}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-sm font-bold text-slate-300 uppercase italic tracking-tight">
                          {pred.constructor_champion}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 bg-[#161a23] rounded-3xl border border-dashed border-slate-800">
            <p className="text-slate-500 italic uppercase text-xs tracking-widest">Geen voorspellingen gevonden</p>
          </div>
        )}

        <footer className="mt-12 flex flex-col items-center justify-center gap-2 opacity-30">
          <div className="h-px w-20 bg-slate-700"></div>
          <p className="text-[8px] text-slate-500 uppercase tracking-[0.4em]">
            Official Grid Data • 2026 Season
          </p>
        </footer>
      </div>
    </div>
  );
}