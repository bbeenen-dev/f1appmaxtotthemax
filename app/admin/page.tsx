"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";

interface Race {
  id: number;
  race_name: string;
  race_date: string;
  location: string;
}

export default function AdminDashboard() {
  const [races, setRaces] = useState<Race[]>([]);
  const [nextRace, setNextRace] = useState<Race | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function fetchData() {
      const { data: raceData } = await supabase
        .from("races")
        .select("id, race_name, race_date, location")
        .order("id", { ascending: true });

      if (raceData) {
        setRaces(raceData);
        // Bepaal de eerstvolgende race op basis van datum
        const now = new Date();
        const future = raceData.find(r => new Date(r.race_date) > now) || raceData[0];
        setNextRace(future);
      }
      setLoading(false);
    }
    fetchData();
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
        <header className="mb-12 border-b border-slate-800 pb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-8 bg-[#005aff] shadow-[0_0_15px_rgba(0,90,255,0.8)]"></div>
            <h1 className="text-3xl font-black italic uppercase text-white tracking-tighter">
              Race <span className="text-[#005aff]">Control</span>
            </h1>
          </div>
          <p className="text-slate-500 text-[10px] uppercase tracking-[0.3em] mt-2 italic">
            Administrator Command Center • F1 Poule 2026
          </p>
        </header>

        {/* HOOFDMENU SECTIES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          
          {/* 1. CONTROLE LIJST (Quick Link naar eerstvolgende event) */}
          <div className="bg-[#161a23] border border-slate-800 rounded-3xl p-6 hover:border-[#005aff] transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <svg className="w-20 h-20 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
            </div>
            <h2 className="text-xl font-black italic uppercase mb-2">1. Controlelijst</h2>
            <p className="text-slate-500 text-xs mb-6 h-12">Check wie hun voorspellingen al hebben ingediend voor {nextRace?.race_name}.</p>
            <Link 
              href={`/admin/check-predictions/${nextRace?.id}`}
              className="inline-block w-full text-center bg-white text-black text-[10px] font-black italic uppercase py-3 rounded-xl hover:bg-[#005aff] hover:text-white transition-all"
            >
              Open Checklijst
            </Link>
          </div>

          {/* 2. OVERIGE TAKEN */}
          <div className="bg-[#161a23] border border-slate-800 rounded-3xl p-6 hover:border-[#005aff] transition-all group relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <svg className="w-20 h-20 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
            </div>
            <h2 className="text-xl font-black italic uppercase mb-2">3. Admin Overzichten</h2>
            <p className="text-slate-500 text-xs mb-6 h-12">Beheer gebruikers, pas handmatige offsets aan of bekijk systeem logs.</p>
            <Link 
              href="/admin/settings"
              className="inline-block w-full text-center border border-white/20 text-white text-[10px] font-black italic uppercase py-3 rounded-xl hover:bg-white/10 transition-all"
            >
              Systeem Beheer
            </Link>
          </div>

        </div>

        {/* 2. UITSLAGEN INVOEREN (Race lijst) */}
        <div className="mb-6 flex items-center gap-2">
          <div className="w-1 h-4 bg-[#005aff]"></div>
          <h2 className="text-xl font-black italic uppercase tracking-tighter">2. Uitslagen & Punten</h2>
        </div>
        
        <div className="grid gap-3">
          {races.map((race) => (
            <div 
              key={race.id} 
              className="bg-[#161a23] border border-slate-800 p-4 rounded-2xl flex items-center justify-between group hover:bg-[#1c222d] transition-all"
            >
              <div className="flex flex-col">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1">
                  Ronde {race.id} • {race.location}
                </span>
                <h3 className="text-md font-black italic uppercase leading-tight text-white/90">
                  {race.race_name}
                </h3>
              </div>
              
              <div className="flex gap-2">
                <Link 
                  href={`/admin/results/${race.id}`}
                  className="bg-[#005aff]/10 text-[#005aff] text-[9px] font-black italic uppercase px-4 py-2 rounded-lg border border-[#005aff]/20 hover:bg-[#005aff] hover:text-white transition-all"
                >
                  Invoeren
                </Link>
                <Link 
                  href={`/admin/calculate/${race.id}`}
                  className="bg-green-500/10 text-green-500 text-[9px] font-black italic uppercase px-4 py-2 rounded-lg border border-green-500/20 hover:bg-green-500 hover:text-white transition-all"
                >
                  Berekenen
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Systeem Status */}
        <footer className="mt-16 p-6 rounded-2xl bg-white/5 border border-white/5 text-center">
          <div className="flex items-center justify-center gap-4 text-slate-600 text-[9px] uppercase tracking-widest font-bold">
            <span>Admin Mode</span>
            <span className="w-1 h-1 bg-slate-800 rounded-full"></span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              API Online
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}