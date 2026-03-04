"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";

export default function AdminDashboard() {
  const [races, setRaces] = useState<{id: number, race_name: string}[]>([]);
  const [selectedRaceId, setSelectedRaceId] = useState<string>("");
  const [exportType, setExportType] = useState<string>("race");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function fetchRaces() {
      try {
        setLoading(true);
        // We gebruiken nu fp1_start voor de sortering en selectie
        const { data, error: dbError } = await supabase
          .from("races")
          .select("id, race_name, fp1_start")
          .order("fp1_start", { ascending: true });

        if (dbError) throw dbError;

        if (data && data.length > 0) {
          setRaces(data);
          
          // Zoek de eerstvolgende race op basis van fp1_start
          const now = new Date();
          const future = data.find(r => new Date(r.fp1_start) > now) || data[0];
          setSelectedRaceId(future.id.toString());
        } else {
          setError("Geen races gevonden in de database.");
        }
      } catch (err: any) {
        console.error("Fout:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchRaces();
  }, [supabase]);

  if (loading) return (
    <div className="min-h-screen bg-[#0f111a] flex items-center justify-center font-f1 text-[#005aff] italic animate-pulse">
      SYNCING CALENDAR...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f111a] text-white p-4 md:p-8 font-f1">
      <div className="max-w-4xl mx-auto">
        
        <header className="mb-12 border-b border-slate-800 pb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter">Race <span className="text-[#005aff]">Control</span></h1>
            <p className="text-slate-500 text-[10px] uppercase tracking-[0.3em] mt-2 italic">Admin Panel • 2026 Season</p>
          </div>
          {error && (
            <div className="bg-red-500/10 border border-red-500 px-3 py-1 rounded text-red-500 text-[8px] font-black uppercase">
              DB Error: {error}
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* LINKER KOLOM: SNELLE ACTIES */}
          <div className="space-y-6">
            <MenuCard 
              title="Check" 
              step="01" 
              desc="Wie heeft er al voorspeld?" 
              href={`/admin/check-predictions?race=${selectedRaceId}`} 
              label="Check Deelnemers" 
            />
            <MenuCard 
              title="Uitslag" 
              step="02" 
              desc="Punten invoeren na de sessie." 
              href={`/admin/results/${selectedRaceId}`} 
              label="Uitslag Invoeren" 
              highlight 
            />
          </div>

          {/* RECHTER KOLOM: EXPORT CENTER */}
          <div className="bg-[#161a23] border-2 border-green-500/30 rounded-3xl p-8 flex flex-col shadow-[0_0_50px_rgba(34,197,94,0.05)]">
            <div className="mb-8">
              <div className="text-green-500 text-[10px] font-black mb-1 italic tracking-[0.2em]">STAP 03</div>
              <h2 className="text-2xl font-black italic uppercase">Export Center</h2>
              <p className="text-slate-500 text-[10px] uppercase italic">Genereer PDF voor offline gebruik</p>
            </div>

            <div className="space-y-6">
              {/* SELECTEER RACE */}
              <div>
                <label className="text-[9px] font-black uppercase text-slate-400 mb-2 block ml-1 underline decoration-[#005aff]">1. Kies de Race</label>
                <select 
                  value={selectedRaceId} 
                  onChange={(e) => setSelectedRaceId(e.target.value)}
                  className="w-full bg-[#0f111a] border border-slate-700 text-white p-4 rounded-2xl font-black italic uppercase text-xs focus:border-green-500 outline-none cursor-pointer hover:border-slate-500 transition-all"
                >
                  {races.length > 0 ? (
                    races.map(r => (
                      <option key={r.id} value={r.id}>{r.race_name}</option>
                    ))
                  ) : (
                    <option value="">Laden...</option>
                  )}
                </select>
              </div>

              {/* SELECTEER TYPE */}
              <div>
                <label className="text-[9px] font-black uppercase text-slate-400 mb-2 block ml-1 underline decoration-[#005aff]">2. Kies Onderdeel</label>
                <select 
                  value={exportType} 
                  onChange={(e) => setExportType(e.target.value)}
                  className="w-full bg-[#0f111a] border border-slate-700 text-white p-4 rounded-2xl font-black italic uppercase text-xs focus:border-green-500 outline-none cursor-pointer hover:border-slate-500 transition-all"
                >
                  <option value="qualy">Qualifying (Top 3)</option>
                  <option value="sprint">Sprint Race (Top 8)</option>
                  <option value="race">Grand Prix (Top 22)</option>
                </select>
              </div>

              {/* EXPORT KNOP */}
              <div className="pt-2">
                <Link 
                  href={`/admin/export/${selectedRaceId}?type=${exportType}`}
                  className={`block w-full text-center py-5 rounded-2xl text-[11px] font-black italic uppercase transition-all shadow-xl ${
                    selectedRaceId 
                    ? "bg-green-600 text-white hover:bg-white hover:text-green-600 active:scale-95" 
                    : "bg-slate-800 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  Download PDF / Overzicht
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function MenuCard({ title, step, desc, href, label, highlight = false }: any) {
  return (
    <div className={`bg-[#161a23] border ${highlight ? 'border-[#005aff]/40' : 'border-slate-800'} rounded-3xl p-6 flex flex-col justify-between transition-all hover:border-slate-600`}>
      <div className="mb-4">
        <span className="text-slate-600 text-[10px] font-black italic tracking-widest uppercase">STAP {step}</span>
        <h3 className="text-xl font-black italic uppercase tracking-tighter">{title}</h3>
        <p className="text-slate-500 text-[10px] uppercase mt-1 leading-tight italic">{desc}</p>
      </div>
      <Link href={href} className={`text-center py-3 rounded-xl text-[10px] font-black uppercase italic transition-all ${highlight ? 'bg-[#005aff] text-white hover:bg-white hover:text-[#005aff]' : 'bg-white/5 text-white hover:bg-white/10'}`}>
        {label}
      </Link>
    </div>
  );
}