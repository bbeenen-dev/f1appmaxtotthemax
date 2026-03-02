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
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function fetchRaces() {
      const { data } = await supabase
        .from("races")
        .select("id, race_name, race_date, location")
        .order("id", { ascending: true });

      if (data) setRaces(data);
      setLoading(false);
    }
    fetchRaces();
  }, [supabase]);

  if (loading) return (
    <div className="min-h-screen bg-[#0f111a] flex items-center justify-center font-f1 text-[#005aff] italic animate-pulse">
      ACCESSING RACE CONTROL...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f111a] text-white p-4 md:p-8 font-f1 pb-32">
      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <header className="mb-12 border-b border-slate-800 pb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-8 bg-[#005aff]"></div>
            <h1 className="text-3xl font-black italic uppercase text-white tracking-tighter">
              Admin <span className="text-[#005aff]">Dashboard</span>
            </h1>
          </div>
          <p className="text-slate-500 text-[10px] uppercase tracking-[0.3em] mt-2">
            Selecteer een sessie om uitslagen te publiceren
          </p>
        </header>

        {/* Race List */}
        <div className="grid gap-4">
          {races.map((race) => (
            <div 
              key={race.id} 
              className="bg-[#161a23] border border-slate-800 p-5 rounded-2xl flex items-center justify-between group hover:border-[#005aff]/50 transition-all duration-300 shadow-lg"
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] text-[#005aff] font-black uppercase tracking-widest bg-[#005aff]/10 px-2 py-0.5 rounded">
                    R0{race.id}
                  </span>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                    {race.location || "Formula 1"}
                  </span>
                </div>
                <h3 className="text-lg font-black italic uppercase leading-tight group-hover:text-white transition-colors">
                  {race.race_name}
                </h3>
              </div>
              
              <Link 
                href={`/admin/results/${race.id}`}
                className="bg-[#005aff] text-white text-[10px] font-black italic uppercase px-5 py-2.5 rounded-xl hover:bg-white hover:text-[#005aff] transition-all shadow-[0_0_15px_rgba(0,90,255,0.2)] active:scale-95"
              >
                Uitslag Invullen
              </Link>
            </div>
          ))}
        </div>

        {/* Footer Info */}
        <footer className="mt-12 p-6 rounded-2xl border border-dashed border-slate-800 text-center">
          <p className="text-slate-600 text-[10px] uppercase tracking-widest font-bold">
            Ingelogd als Administrator • Systeem Status: <span className="text-green-500">Online</span>
          </p>
        </footer>
      </div>
    </div>
  );
}