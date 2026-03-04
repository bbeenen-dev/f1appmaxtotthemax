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
      <div className="max-w-5xl mx-auto">
        
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* 1. CONTROLE LIJST */}
          <MenuCard 
            step="01" 
            title="Check" 
            desc="Wie heeft er al voorspeld?" 
            href="/admin/check-predictions" 
            label="Check Deelnemers"
          />

          {/* 2. UITSLAGEN */}
          <MenuCard 
            step="02" 
            title="Uitslagen" 
            desc="Punten berekenen voor de race." 
            href={`/admin/results/${nextRace?.id || 1}`} 
            label="Invoeren"
            highlight
          />

          {/* 3. EXPORT (NIEUW) */}
          <div className="bg-[#161a23] border border-green-500/30 rounded-3xl p-6 hover:border-green-500 transition-all group flex flex-col justify-between">
            <div>
              <div className="text-green-500 text-xs font-black mb-2 italic tracking-widest">STAP 03</div>
              <h2 className="text-xl font-black italic uppercase mb-2">Offline Back-up</h2>
              <p className="text-slate-500 text-[10px] uppercase leading-relaxed mb-6 text-balance">
                Exporteer alle voorspellingen naar een printbaar overzicht voor op je telefoon.
              </p>
            </div>
            <Link 
              href={`/admin/export/${nextRace?.id || 1}`}
              className="block w-full text-center bg-green-600 text-white text-[10px] font-black italic uppercase py-3 rounded-xl hover:bg-white hover:text-green-600 transition-all shadow-[0_10px_20px_rgba(34,197,94,0.1)]"
            >
              Exporteer naar PDF
            </Link>
          </div>

          {/* 4. BEHEER */}
          <MenuCard 
            step="04" 
            title="Beheer" 
            desc="Systeeminstellingen & spelers." 
            href="/admin/settings" 
            label="Systeem Beheer"
            isDark
          />

        </div>

        {/* Info balk */}
        <div className="mt-12 p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
             <span className="text-[10px] font-black italic uppercase text-slate-400">Verbonden: {nextRace?.race_name}</span>
          </div>
          <span className="text-[10px] font-black italic uppercase text-blue-500">Seizoen 2026</span>
        </div>
      </div>
    </div>
  );
}

// Hulpcart voor overzichtelijk dashboard
function MenuCard({ step, title, desc, href, label, highlight = false, isDark = false }: any) {
  return (
    <div className={`bg-[#161a23] border ${highlight ? 'border-[#005aff]/30 shadow-[0_0_30px_rgba(0,90,255,0.05)]' : 'border-slate-800'} rounded-3xl p-6 hover:border-[#005aff] transition-all flex flex-col justify-between`}>
      <div>
        <div className={`${highlight ? 'text-[#005aff]' : 'text-slate-600'} text-xs font-black mb-2 italic`}>STAP {step}</div>
        <h2 className="text-xl font-black italic uppercase mb-2">{title}</h2>
        <p className="text-slate-500 text-[10px] uppercase leading-relaxed mb-6">{desc}</p>
      </div>
      <Link 
        href={href}
        className={`block w-full text-center py-3 rounded-xl text-[10px] font-black italic uppercase transition-all ${
          highlight 
          ? 'bg-[#005aff] text-white hover:bg-white hover:text-[#005aff]' 
          : 'bg-white/5 border border-white/10 text-white hover:bg-white hover:text-black'
        }`}
      >
        {label}
      </Link>
    </div>
  );
}