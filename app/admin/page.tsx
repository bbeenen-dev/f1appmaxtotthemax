"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";

export default function AdminDashboard() {
  const [nextRace, setNextRace] = useState<{id: number, race_name: string} | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function fetchNextRace() {
      const { data } = await supabase
        .from("races")
        .select("id, race_name, race_date")
        .order("race_date", { ascending: true });

      if (data) {
        const now = new Date();
        const future = data.find(r => new Date(r.race_date) > now) || data[0];
        setNextRace(future);
      }
      setLoading(false);
    }
    fetchNextRace();
  }, [supabase]);

  if (loading) return (
    <div className="min-h-screen bg-[#0f111a] flex items-center justify-center font-f1 text-[#005aff] italic animate-pulse">
      INITIALIZING RACE CONTROL...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f111a] text-white p-4 md:p-8 font-f1 pb-32">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <header className="mb-12 border-b border-slate-800 pb-8 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
            <div className="w-2 h-8 bg-[#005aff] shadow-[0_0_15px_rgba(0,90,255,0.8)]"></div>
            <h1 className="text-3xl font-black italic uppercase text-white tracking-tighter">
              Race <span className="text-[#005aff]">Control</span>
            </h1>
          </div>
          <p className="text-slate-500 text-[10px] uppercase tracking-[0.3em] mt-2 italic">
            Administrator Command Center • F1 Poule 2026
          </p>
        </header>

        {/* HOOFDMENU GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* 1. CONTROLE LIJST */}
          <div className="bg-[#161a23] border border-slate-800 rounded-3xl p-6 hover:border-[#005aff] transition-all group flex flex-col justify-between">
            <div>
              <div className="text-[#005aff] text-xs font-black mb-2 opacity-50 italic">STAP 01</div>
              <h2 className="text-xl font-black italic uppercase mb-2">Controlelijst</h2>
              <p className="text-slate-500 text-[10px] uppercase leading-relaxed mb-6">
                Check wie de voorspellingen al heeft ingevuld voor de volgende race.
              </p>
            </div>
            <Link 
              href={`/admin/check-predictions`}
              className="block w-full text-center bg-white/5 border border-white/10 text-white text-[10px] font-black italic uppercase py-3 rounded-xl hover:bg-white hover:text-black transition-all"
            >
              Check Deelnemers
            </Link>
          </div>

          {/* 2. UITSLAGEN & PUNTEN (De pagina die we net maakten) */}
          <div className="bg-[#161a23] border border-[#005aff]/30 rounded-3xl p-6 hover:border-[#005aff] transition-all group shadow-[0_0_30px_rgba(0,90,255,0.05)] flex flex-col justify-between">
            <div>
              <div className="text-[#005aff] text-xs font-black mb-2 italic">STAP 02</div>
              <h2 className="text-xl font-black italic uppercase mb-2">Uitslagen</h2>
              <p className="text-slate-500 text-[10px] uppercase leading-relaxed mb-6">
                Voer de uitslag in van Qualy, Sprint of Race en bereken direct alle scores.
              </p>
            </div>
            <Link 
              href={`/admin/results/${nextRace?.id || 1}`}
              className="block w-full text-center bg-[#005aff] text-white text-[10px] font-black italic uppercase py-3 rounded-xl hover:bg-white hover:text-[#005aff] transition-all shadow-[0_10px_20px_rgba(0,90,255,0.2)]"
            >
              Uitslag Invoeren
            </Link>
          </div>

          {/* 3. ADMIN OVERZICHTEN */}
          <div className="bg-[#161a23] border border-slate-800 rounded-3xl p-6 hover:border-red-500/50 transition-all group flex flex-col justify-between">
            <div>
              <div className="text-slate-600 text-xs font-black mb-2 italic">STAP 03</div>
              <h2 className="text-xl font-black italic uppercase mb-2">Beheer</h2>
              <p className="text-slate-500 text-[10px] uppercase leading-relaxed mb-6">
                Toevoegen van spelers, handmatige correcties of systeeminstellingen.
              </p>
            </div>
            <Link 
              href="/admin/settings"
              className="block w-full text-center bg-white/5 border border-white/10 text-white text-[10px] font-black italic uppercase py-3 rounded-xl hover:bg-red-500 hover:text-white hover:border-red-500 transition-all"
            >
              Systeem Beheer
            </Link>
          </div>

        </div>

        {/* Info balk */}
        <div className="mt-12 p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
             <span className="text-[10px] font-black italic uppercase text-slate-400">Status: Verbonden met Database</span>
          </div>
          <span className="text-[10px] font-black italic uppercase text-blue-500">Seizoen 2026</span>
        </div>

      </div>
    </div>
  );
}