"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";

export default function AdminDashboard() {
  const [races, setRaces] = useState<{id: number, race_name: string}[]>([]);
  const [selectedRaceId, setSelectedRaceId] = useState<string>("");
  const [exportType, setExportType] = useState<string>("race");
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function fetchRaces() {
      const { data } = await supabase
        .from("races")
        .select("id, race_name, race_date")
        .order("race_date", { ascending: true });

      if (data) {
        setRaces(data);
        const now = new Date();
        const future = data.find(r => new Date(r.race_date) > now) || data[0];
        if (future) setSelectedRaceId(future.id.toString());
      }
      setLoading(false);
    }
    fetchRaces();
  }, [supabase]);

  if (loading) return <div className="min-h-screen bg-[#0f111a] flex items-center justify-center font-f1 text-[#005aff] animate-pulse italic">DATA SYNC...</div>;

  return (
    <div className="min-h-screen bg-[#0f111a] text-white p-4 md:p-8 font-f1">
      <div className="max-w-4xl mx-auto">
        
        <header className="mb-12 border-b border-slate-800 pb-8">
          <h1 className="text-3xl font-black italic uppercase tracking-tighter">Race <span className="text-[#005aff]">Control</span></h1>
          <p className="text-slate-500 text-[10px] uppercase tracking-[0.3em] mt-2 italic">F1 POULE ADMIN 2026</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* LINKER KOLOM: SNELLE ACTIES */}
          <div className="space-y-6">
            <MenuCard title="Check" step="01" desc="Wie heeft er al voorspeld?" href={`/admin/check-predictions?race=${selectedRaceId}`} label="Open Controlelijst" />
            <MenuCard title="Uitslag" step="02" desc="Punten verwerken na de race." href={`/admin/results/${selectedRaceId}`} label="Uitslag Invoeren" highlight />
          </div>

          {/* RECHTER KOLOM: EXPORT CENTER (Alles in één blok) */}
          <div className="bg-[#161a23] border-2 border-green-500/30 rounded-3xl p-8 flex flex-col shadow-[0_0_40px_rgba(34,197,94,0.05)]">
            <div className="mb-6">
              <div className="text-green-500 text-xs font-black mb-1 italic">STAP 03</div>
              <h2 className="text-2xl font-black italic uppercase">Export Center</h2>
              <p className="text-slate-500 text-[10px] uppercase tracking-wider">Genereer PDF voor offline gebruik</p>
            </div>

            <div className="space-y-5">
              {/* 1. SELECTEER RACE */}
              <div>
                <label className="text-[9px] font-black uppercase text-slate-400 mb-2 block">1. Selecteer Race</label>
                <select 
                  value={selectedRaceId} 
                  onChange={(e) => setSelectedRaceId(e.target.value)}
                  className="w-full bg-[#0f111a] border border-slate-700 text-white p-4 rounded-xl font-black italic uppercase text-xs focus:border-green-500 outline-none appearance-none cursor-pointer"
                >
                  {races.map(r => (
                    <option key={r.id} value={r.id}>{r.race_name}</option>
                  ))}
                </select>
              </div>

              {/* 2. SELECTEER TYPE */}
              <div>
                <label className="text-[9px] font-black uppercase text-slate-400 mb-2 block">2. Type Voorspelling</label>
                <select 
                  value={exportType} 
                  onChange={(e) => setExportType(e.target.value)}
                  className="w-full bg-[#0f111a] border border-slate-700 text-white p-4 rounded-xl font-black italic uppercase text-xs focus:border-green-500 outline-none appearance-none cursor-pointer"
                >
                  <option value="qualy">Qualifying (Top 3)</option>
                  <option value="sprint">Sprint Race (Top 8)</option>
                  <option value="race">Grand Prix (Full 22 Grid)</option>
                </select>
              </div>

              {/* 3. EXPORT KNOP */}
              <div className="pt-4">
                <Link 
                  href={`/admin/export/${selectedRaceId}?type=${exportType}`}
                  className="block w-full text-center bg-green-600 text-white text-[11px] font-black italic uppercase py-4 rounded-xl hover:bg-white hover:text-green-600 transition-all shadow-lg"
                >
                  Genereer Export PDF
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// Simpele herbruikbare card
function MenuCard({ title, step, desc, href, label, highlight = false }: any) {
  return (
    <div className={`bg-[#161a23] border ${highlight ? 'border-[#005aff]/40' : 'border-slate-800'} rounded-3xl p-6 flex flex-col justify-between transition-all hover:translate-y-[-2px]`}>
      <div className="mb-4">
        <span className="text-slate-600 text-[10px] font-black italic">STAP {step}</span>
        <h3 className="text-xl font-black italic uppercase">{title}</h3>
        <p className="text-slate-500 text-[10px] uppercase mt-1 leading-tight">{desc}</p>
      </div>
      <Link href={href} className={`text-center py-3 rounded-xl text-[10px] font-black uppercase italic transition-all ${highlight ? 'bg-[#005aff] text-white' : 'bg-white/5 text-white hover:bg-white/10'}`}>
        {label}
      </Link>
    </div>
  );
}