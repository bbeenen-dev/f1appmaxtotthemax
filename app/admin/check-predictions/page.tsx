"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

interface Profile {
  id: string;
  full_name: string;
}

interface Race {
  id: number;
  race_name: string;
}

interface PredictionStatus {
  user_id: string;
  user_name: string;
  hasQualy: boolean;
  hasSprint: boolean;
  hasRace: boolean;
}

export default function CheckPredictionsPage() {
  const router = useRouter();
  const [races, setRaces] = useState<Race[]>([]);
  const [selectedRaceId, setSelectedRaceId] = useState<string>("");
  const [statusList, setStatusList] = useState<PredictionStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 1. Haal alle races en alle profielen op
  useEffect(() => {
    async function init() {
      const { data: raceData } = await supabase.from("races").select("id, race_name").order("id");
      if (raceData) {
        setRaces(raceData);
        // Pak de eerste of de 'volgende' race als standaard
        setSelectedRaceId(raceData[0].id.toString());
      }
    }
    init();
  }, [supabase]);

  // 2. Check de status zodra de race-selectie wijzigt
  useEffect(() => {
    if (!selectedRaceId) return;

    async function checkStatus() {
      setLoading(true);
      
      // Haal alle deelnemers op (uit je profiles of users tabel)
      const { data: users } = await supabase.from("profiles").select("id, full_name").order("full_name");
      
      // Haal alle bestaande voorspellingen op voor deze race
      const [qualy, sprint, race] = await Promise.all([
        supabase.from("predictions_qualifying").select("user_id").eq("race_id", selectedRaceId),
        supabase.from("predictions_sprint").select("user_id").eq("race_id", selectedRaceId),
        supabase.from("predictions_race").select("user_id").eq("race_id", selectedRaceId)
      ]);

      if (users) {
        const results = users.map(u => ({
          user_id: u.id,
          user_name: u.full_name || "Onbekende coureur",
          hasQualy: qualy.data?.some(p => p.user_id === u.id) || false,
          hasSprint: sprint.data?.some(p => p.user_id === u.id) || false,
          hasRace: race.data?.some(p => p.user_id === u.id) || false,
        }));
        setStatusList(results);
      }
      setLoading(false);
    }

    checkStatus();
  }, [selectedRaceId, supabase]);

  return (
    <div className="min-h-screen bg-[#0f111a] text-white p-4 md:p-8 font-f1">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => router.push('/admin')} className="text-slate-500 text-[10px] uppercase hover:text-[#005AFF] transition-all flex items-center gap-2">
            <span>←</span> DASHBOARD
          </button>
          <h1 className="text-2xl font-black italic uppercase tracking-tighter">
            Controle <span className="text-[#005AFF]">Lijst</span>
          </h1>
        </div>

        {/* Race Selector */}
        <div className="bg-[#161a23] p-4 rounded-2xl border border-slate-800 mb-6">
          <label className="text-[9px] font-black uppercase text-slate-500 italic mb-2 block">Selecteer Grand Prix</label>
          <select 
            value={selectedRaceId} 
            onChange={(e) => setSelectedRaceId(e.target.value)}
            className="w-full bg-transparent text-white font-bold uppercase italic focus:outline-none cursor-pointer"
          >
            {races.map(r => (
              <option key={r.id} value={r.id} className="bg-[#161a23]">{r.race_name}</option>
            ))}
          </select>
        </div>

        {/* Status Tabel */}
        <div className="bg-[#161a23] border border-slate-800 rounded-3xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-slate-800">
                <th className="p-4 text-[10px] font-black uppercase text-slate-500 italic">Deelnemer</th>
                <th className="p-4 text-[10px] font-black uppercase text-slate-500 italic text-center">Qualy</th>
                <th className="p-4 text-[10px] font-black uppercase text-slate-500 italic text-center">Sprint</th>
                <th className="p-4 text-[10px] font-black uppercase text-slate-500 italic text-center">Race</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="p-8 text-center text-xs animate-pulse text-[#005AFF]">DATA OPHALEN...</td></tr>
              ) : statusList.map(user => (
                <tr key={user.user_id} className="border-b border-slate-800/50 hover:bg-white/5 transition-colors">
                  <td className="p-4 font-bold uppercase italic text-sm">{user.user_name}</td>
                  <td className="p-4 text-center">{StatusIcon(user.hasQualy)}</td>
                  <td className="p-4 text-center">{StatusIcon(user.hasSprint)}</td>
                  <td className="p-4 text-center">{StatusIcon(user.hasRace)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusIcon(done: boolean) {
  return done ? (
    <span className="inline-flex items-center justify-center w-6 h-6 bg-green-500/20 text-green-500 rounded-full text-xs font-black">✓</span>
  ) : (
    <span className="inline-flex items-center justify-center w-6 h-6 bg-red-500/20 text-red-500 rounded-full text-xs font-black">×</span>
  );
}