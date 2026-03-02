"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

interface Driver {
  driver_id: string;
  driver_name: string;
}

interface Team {
  team_id: string;
  team_name: string;
  hex_color: string;
}

export default function ChampionshipPredictionPage() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string>("");
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isPastDeadline, setIsPastDeadline] = useState(false);

  useEffect(() => {
    // Deadline: Vrijdag 6 maart 2026, 17:00u
    const deadline = new Date('2026-03-06T17:00:00');
    if (new Date() > deadline) {
      setIsPastDeadline(true);
    }

    async function fetchData() {
      // 1. Haal actieve coureurs op
      const { data: drv } = await supabase
        .from("drivers")
        .select("driver_id, driver_name")
        .eq("active", true)
        .order("driver_name");
      
      // 2. Haal teams op
      const { data: tm } = await supabase
        .from("teams")
        .select("team_id, team_name, hex_color")
        .order("team_name");

      if (drv) setDrivers(drv);
      if (tm) setTeams(tm);

      // 3. Haal bestaande seizoensvoorspelling op
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: existing } = await supabase
          .from("predictions_season")
          .select("predicted_driver_champion, predicted_team_champion")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (existing) {
          setSelectedDriver(existing.predicted_driver_champion || "");
          setSelectedTeam(existing.predicted_team_champion || "");
        }
      }
      setLoading(false);
    }
    fetchData();
  }, [supabase]);

  const handleSave = async () => {
    if (isPastDeadline) {
      alert("De deadline is verstreken. Aanpassingen zijn niet meer mogelijk.");
      return;
    }

    if (!selectedDriver || !selectedTeam) {
      alert("Maak s.v.p. beide keuzes voordat je bevestigt.");
      return;
    }

    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      alert("Je moet ingelogd zijn om je voorspelling op te slaan.");
      setSaving(false);
      return;
    }

    // Gebruik upsert om de voorspelling aan te maken of bij te werken op basis van user_id
    const { error } = await supabase
      .from("predictions_season")
      .upsert({
        user_id: session.user.id,
        predicted_driver_champion: selectedDriver,
        predicted_team_champion: selectedTeam,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (error) {
      alert("Er ging iets mis bij het opslaan: " + error.message);
    } else {
      router.push("/");
      router.refresh();
    }
    setSaving(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0f111a] flex items-center justify-center font-f1 text-yellow-500 italic animate-pulse">
      LOADING CHAMPIONSHIP DATA...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f111a] text-white p-4 md:p-8 pb-32">
      <div className="max-w-xl mx-auto">
        
        {/* Sticky Header */}
        <div className="sticky top-0 z-[100] bg-[#0f111a] pt-4 pb-6 border-b border-slate-800 mb-8">
          <div className="flex items-center justify-between gap-4">
            <header>
              <button onClick={() => router.back()} className="group flex items-center gap-2 text-slate-500 text-[10px] font-f1 uppercase mb-2 tracking-widest hover:text-yellow-500 transition-colors">
                <span className="text-lg">←</span> Terug naar Home
              </button>
              <h1 className="font-f1 text-2xl font-black italic uppercase tracking-tighter leading-none">
                Season <span className="text-yellow-500">2026</span>
              </h1>
            </header>

            {!isPastDeadline ? (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-shrink-0 bg-yellow-500 hover:bg-white hover:text-yellow-600 disabled:opacity-30 text-black font-f1 font-black italic uppercase px-6 py-3 rounded-xl shadow-[0_0_20px_rgba(234,179,8,0.3)] transition-all duration-300 tracking-widest text-[10px]"
              >
                {saving ? "Opslaan..." : "Bevestigen"}
              </button>
            ) : (
              <div className="bg-slate-900/50 border border-slate-800 px-4 py-2 rounded-lg">
                <span className="text-slate-500 font-f1 italic text-[9px] uppercase tracking-tighter">
                  Gesloten
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          {/* Driver Selection */}
          <section className="bg-[#161a23] p-6 rounded-3xl border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <label className="font-f1 text-[10px] font-black uppercase text-yellow-500 tracking-widest italic">
                World Driver Champion
              </label>
              <span className="text-[10px] font-f1 font-bold text-slate-600 uppercase">25 PT</span>
            </div>
            <div className={`grid grid-cols-1 gap-2 ${isPastDeadline ? 'opacity-60' : ''}`}>
              {drivers.map((driver) => (
                <button
                  key={driver.driver_id}
                  disabled={isPastDeadline}
                  onClick={() => setSelectedDriver(driver.driver_id)}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                    selectedDriver === driver.driver_id 
                    ? "bg-yellow-500/10 border-yellow-500 text-white shadow-[0_0_15px_rgba(234,179,8,0.1)]" 
                    : "bg-[#0f111a] border-slate-800/50 text-slate-400 hover:border-slate-600"
                  }`}
                >
                  <span className="font-f1 font-black italic uppercase text-sm">{driver.driver_name}</span>
                  {selectedDriver === driver.driver_id && <span className="text-yellow-500 text-lg">🏆</span>}
                </button>
              ))}
            </div>
          </section>

          {/* Team Selection */}
          <section className="bg-[#161a23] p-6 rounded-3xl border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <label className="font-f1 text-[10px] font-black uppercase text-yellow-500 tracking-widest italic">
                World Constructor Champion
              </label>
              <span className="text-[10px] font-f1 font-bold text-slate-600 uppercase">25 PT</span>
            </div>
            <div className={`grid grid-cols-1 gap-2 ${isPastDeadline ? 'opacity-60' : ''}`}>
              {teams.map((team) => (
                <button
                  key={team.team_id}
                  disabled={isPastDeadline}
                  onClick={() => setSelectedTeam(team.team_id)}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                    selectedTeam === team.team_id 
                    ? "bg-white/5 border-white text-white" 
                    : "bg-[#0f111a] border-slate-800/50 text-slate-400 hover:border-slate-600"
                  }`}
                  style={{ 
                    borderLeftColor: selectedTeam === team.team_id ? team.hex_color : 'transparent',
                    borderLeftWidth: '4px' 
                  }}
                >
                  <span className="font-f1 font-black italic uppercase text-sm">{team.team_name}</span>
                  {selectedTeam === team.team_id && <span className="text-white text-lg">🏁</span>}
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}