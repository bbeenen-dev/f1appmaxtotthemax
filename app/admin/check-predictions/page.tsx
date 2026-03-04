"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

interface Profile {
  id: string;
  nickname: string;
}

interface Race {
  id: number;
  race_name: string;
  has_sprint: boolean; // Toegevoegd om sprint status te weten
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
  const [isSprintWeekend, setIsSprintWeekend] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 1. Haal alle races op inclusief has_sprint
  useEffect(() => {
    async function init() {
      const { data: raceData } = await supabase
        .from("races")
        .select("id, race_name, has_sprint")
        .order("id");
      
      if (raceData && raceData.length > 0) {
        setRaces(raceData);
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
      
      // Update of dit een sprintweekend is
      const currentRace = races.find(r => r.id.toString() === selectedRaceId);
      setIsSprintWeekend(currentRace?.has_sprint || false);

      // Haal alle deelnemers op
      const { data: users, error: userError } = await supabase
        .from("profiles")
        .select("id, nickname")
        .order("nickname", { ascending: true });

      if (userError) console.error("Fout bij ophalen profiles:", userError);
      
      // Haal alle bestaande voorspellingen op
      const [qualy, sprint, race] = await Promise.all([
        supabase.from("predictions_qualifying").select("user_id").eq("race_id", selectedRaceId),
        supabase.from("predictions_sprint").select("user_id").eq("race_id", selectedRaceId),
        supabase.from("predictions_race").select("user_id").eq("race_id", selectedRaceId)
      ]);

      if (users) {
        const results = users.map(u => ({
          user_id: u.id,
          user_name: u.nickname || "Anonieme coureur",
          hasQualy: qualy.data?.some(p => p.user_id === u.id) || false,
          hasSprint: sprint.data?.some(p => p.user_id === u.id) || false,
          hasRace: race.data?.some(p => p.user_id === u.id) || false,
        }));
        setStatusList(results);
      }
      setLoading(false);
    }

    checkStatus();
  }, [selectedRaceId, races, supabase]);

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
        <div className="bg-[#161a23] p-4 rounded-2xl border border-slate-800 mb-6 shadow-inner relative">
          <label className="text-[9px] font-black uppercase text-slate-500 italic mb-2 block ml-1">Selecteer Grand Prix</label>
          <select 
            value={selectedRaceId} 
            onChange={(e) => setSelectedRaceId(e.target.value)}
            className="w-full bg-transparent text-white font-bold uppercase italic focus:outline-none cursor-pointer appearance-none pr-10"
          >
            {races.map(r => (
              <option key={r.id} value={r.id} className="bg-[#161a23]">
                {r.race_name} {r.has_sprint ? "(SPRINT)" : ""}
              </option>
            ))}
          </select>
          <div className="absolute right-8 top-12 pointer-events-none text-slate-500 text-xs">▼</div>
        </div>

        {/* Status Tabel */}
        <div className="bg-[#161a23] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-slate-800">
                <th className="p-4 text-[10px] font-black uppercase text-slate-500 italic">Deelnemer</th>
                <th className="p-4 text-[10px] font-black uppercase text-slate-500 italic text-center">Qualy</th>
                {isSprintWeekend && (
                  <th className="p-4 text-[10px] font-black uppercase text-[#005AFF] italic text-center">Sprint</th>
                )}
                <th className="p-4 text-[10px] font-black uppercase text-slate-500 italic text-center">Race</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={isSprintWeekend ? 4 : 3} className="p-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-[#005AFF] mr-3"></div>
                    <span className="text-xs font-black italic uppercase text-slate-500">Gegevens laden...</span>
                  </td>
                </tr>
              ) : (
                statusList.map(user => (
                  <tr key={user.user_id} className="border-b border-slate-800/50 hover:bg-white/5 transition-colors group">
                    <td className="p-4">
                      <p className="font-black uppercase italic text-sm text-white group-hover:text-[#005AFF] transition-colors">{user.user_name}</p>
                      <p className="text-[7px] text-slate-600 font-mono uppercase tracking-tighter italic">ID: {user.user_id.slice(0,8)}...</p>
                    </td>
                    <td className="p-4 text-center">{StatusIcon(user.hasQualy)}</td>
                    {isSprintWeekend && (
                      <td className="p-4 text-center">{StatusIcon(user.hasSprint)}</td>
                    )}
                    <td className="p-4 text-center">{StatusIcon(user.hasRace)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Info Legend */}
        <div className="mt-6 flex justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-[9px] font-bold uppercase text-slate-500 italic">Ingevuld</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-[9px] font-bold uppercase text-slate-500 italic">Ontbreekt</span>
          </div>
        </div>

      </div>
    </div>
  );
}

function StatusIcon(done: boolean) {
  return done ? (
    <div className="inline-flex items-center justify-center w-7 h-7 bg-green-500/10 border border-green-500/20 text-green-500 rounded-lg shadow-sm">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
      </svg>
    </div>
  ) : (
    <div className="inline-flex items-center justify-center w-7 h-7 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg opacity-40">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </div>
  );
}