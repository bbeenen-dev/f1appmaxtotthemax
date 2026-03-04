"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";

export default function AdminDashboard() {
  const [races, setRaces] = useState<{id: number, race_name: string}[]>([]);
  const [selectedRaceId, setSelectedRaceId] = useState<string>("");
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
        // Standaard de eerstvolgende race selecteren
        const now = new Date();
        const future = data.find(r => new Date(r.race_date) > now) || data[0];
        if (future) setSelectedRaceId(future.id.toString());
      }
      setLoading(false);
    }
    fetchRaces();
  }, [supabase]);

  if (loading) return <div className="min-h-screen bg-[#0f111a] flex items-center justify-center font-f1 text-[#005aff] italic animate-pulse">INITIALIZING...</div>;

  return (
    <div className="min-h-screen bg-[#0f111a] text-white p-4 md:p-8 font-f1">
      <div className="max-w-5xl mx-auto">
        
        <header className="mb-12 border-b border-slate-800 pb-8">
          <h1 className="text-3xl font-black italic uppercase tracking-tighter">Race <span className="text-[#005aff]">Control</span></h1>
          <p className="text-slate-500 text-[10px] uppercase tracking-[0.3em] mt-2 italic">Administrator Panel • 2026</p>
        </header>

        {/* RACE SELECTIE BALK */}
        <div className="mb-10 p-6 bg-[#161a23] border border-slate-800 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-black uppercase italic text-[#005aff]">Selecteer Race</h2>
            <p className="text-[10px] text-slate-500 uppercase">Kies de race voor uitslagen en exports</p>
          </div>
          <select 
            value={selectedRaceId} 
            onChange={(e) => setSelectedRaceId(e.target.value)}
            className="bg-[#0f111a] border border-slate-700 text-white p-3 rounded-xl font-black italic uppercase text-xs w-full md:w-64 focus:border-[#005aff] outline-none"
          >
            {races.map(r => (
              <option key={r.id} value={r.id}>{r.race_name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* STAP 01: CHECK */}
          <MenuCard title="Check" step="01" desc="Wie heeft voorspeld?" href={`/admin/check-predictions?race=${selectedRaceId}`} label="Check" />

          {/* STAP 02: UITSLAGEN */}
          <MenuCard title="Uitslagen" step="02" desc="Punten berekenen." href={`/admin/results/${selectedRaceId}`} label="Invoeren" highlight />

          {/* STAP 03: EXPORT (Nu dynamisch gebaseerd op selectie) */}
          <div className="bg-[#161a23] border border-green-500/30 rounded-3xl p-6 lg:col-span-2 flex flex-col justify-between">
            <div>
              <div className="text-green-500 text-xs font-black mb-1 italic">STAP 03: EXPORT</div>
              <h2 className="text-xl font-black italic uppercase mb-2">PDF Overzichten</h2>
              <p className="text-slate-500 text-[10px] uppercase mb-6">Exporteer data voor de geselecteerde race.</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Link href={`/admin/export/${selectedRaceId}?type=qualy`} className="btn-export">Qualy</Link>
              <Link href={`/admin/export/${selectedRaceId}?type=sprint`} className="btn-export">Sprint</Link>
              <Link href={`/admin/export/${selectedRaceId}?type=race`} className="btn-export bg-green-600 border-none">Main Race</Link>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .btn-export {
          @apply text-center bg-white/5 border border-white/10 text-white text-[9px] font-black uppercase py-3 rounded-xl hover:bg-white hover:text-black transition-all;
        }
      `}</style>
    </div>
  );
}

function MenuCard({ title, step, desc, href, label, highlight = false }: any) {
  return (
    <div className={`bg-[#161a23] border ${highlight ? 'border-[#005aff]/30' : 'border-slate-800'} rounded-3xl p-6 flex flex-col justify-between`}>
      <div>
        <div className="text-slate-600 text-[10px] font-black mb-1 italic">STAP {step}</div>
        <h2 className="text-xl font-black italic uppercase mb-2">{title}</h2>
        <p className="text-slate-500 text-[10px] uppercase mb-6 leading-tight">{desc}</p>
      </div>
      <Link href={href} className={`text-center py-3 rounded-xl text-[10px] font-black uppercase italic transition-all ${highlight ? 'bg-[#005aff] text-white hover:bg-white hover:text-[#005aff]' : 'bg-white/5 border border-white/10 text-white hover:bg-white hover:text-black'}`}>
        {label}
      </Link>
    </div>
  );
}