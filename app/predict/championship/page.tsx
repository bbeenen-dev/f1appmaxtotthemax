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

  // De harde deadline: Vrijdag 6 maart 2026, 20:00:00 Amsterdamse tijd
  const DEADLINE_ISO = '2026-03-06T20:00:00';

  useEffect(() => {
    // 1. Deadline check functie
    const checkDeadline = () => {
      const deadline = new Date(DEADLINE_ISO);
      if (new Date() > deadline) {
        setIsPastDeadline(true);
      }
    };

    checkDeadline();
    // Controleer elke minuut of de deadline is verstreken terwijl de gebruiker op de pagina is
    const timer = setInterval(checkDeadline, 60000);

    async function fetchData() {
      // 1. Haal coureurs op
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

      // 3. Haal bestaande voorspelling op
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: existing } = await supabase
          .from("predictions_season")
          .select("driver_champion, constructor_champion")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (existing) {
          setSelectedDriver(existing.driver_champion || "");
          setSelectedTeam(existing.constructor_champion || "");
        }
      }
      setLoading(false);
    }

    fetchData();
    return () => clearInterval(timer);
  }, [supabase]);

  const handleSave = async () => {
    // STRENGERE BEVEILIGING: Controleer de tijd OP HET MOMENT van klikken opnieuw
    const now = new Date();
    const deadline = new Date(DEADLINE_ISO);

    if (now > deadline) {
      setIsPastDeadline(true);
      alert("Helaas, de deadline van 20:00 uur is zojuist verstreken. Je voorspelling kan niet meer worden opgeslagen.");
      return;
    }

    if (!selectedDriver || !selectedTeam) {
      alert("Selecteer s.v.p. zowel een coureur als een team.");
      return;
    }

    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      alert("Niet ingelogd.");
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("predictions_season")
      .upsert({
        user_id: session.user.id,
        driver_champion: selectedDriver, 
        constructor_champion: selectedTeam,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (error) {
      alert("Fout bij opslaan: " + error.message);
    } else {
      router.push("/");
      router.refresh();
    }
    setSaving(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0f111a] flex items-center justify-center font-f1 text-yellow-500 italic animate-pulse">
      SYNCING WITH PIT WALL...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f111a] text-white p-4 md:p-8 pb-32 font-f1">
      <div className="max-w-xl mx-auto">
        
        <div className="sticky top-0 z-[100] bg-[#0f111a] pt-4 pb-6 border-b border-slate-800 mb-8">
          <div className="flex items-center justify-between">
            <header>
              <button onClick={() => router.back()} className="text-slate-500 text-[10px] uppercase mb-2 hover:text-yellow-500 transition-colors">
                ← Terug
              </button>
              <h1 className="text-2xl font-black italic uppercase leading-none">
                Season <span className="text-yellow-500">2026</span>
              </h1>
              <p className="text-[9px] text-slate-500 uppercase mt-1">
                Deadline: Vandaag 20:00u
              </p>
            </header>

            {!isPastDeadline ? (
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-yellow-500 hover:bg-white text-black font-black italic uppercase px-6 py-3 rounded-xl shadow-lg transition-all text-[10px]"
              >
                {saving ? "Storing..." : "Bevestigen"}
              </button>
            ) : (
              <div className="text-red-500 font-black italic text-[10px] uppercase border border-red-500/20 bg-red-500/5 px-4 py-2 rounded-lg">
                Deadline verstreken
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          {/* DRIVERS */}
          <section className="bg-[#161a23] p-6 rounded-3xl border border-slate-800">
            <label className="block text-[10px] font-black uppercase text-yellow-500 mb-4 italic tracking-widest">
              World Driver Champion (25 PT)
            </label>
            <div className={`grid gap-2 ${isPastDeadline ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
              {drivers.map((driver) => (
                <button
                  key={driver.driver_id}
                  disabled={isPastDeadline}
                  onClick={() => setSelectedDriver(driver.driver_id)}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                    selectedDriver === driver.driver_id 
                    ? "bg-yellow-500/10 border-yellow-500 text-white shadow-[0_0_15px_rgba(234,179,8,0.1)]" 
                    : "bg-[#0f111a] border-slate-800 text-slate-400 hover:border-slate-600"
                  }`}
                >
                  <span className="font-black italic uppercase text-sm">{driver.driver_name}</span>
                  {selectedDriver === driver.driver_id && <span>🏆</span>}
                </button>
              ))}
            </div>
          </section>

          {/* TEAMS */}
          <section className="bg-[#161a23] p-6 rounded-3xl border border-slate-800">
            <label className="block text-[10px] font-black uppercase text-yellow-500 mb-4 italic tracking-widest">
              Constructor Champion (25 PT)
            </label>
            <div className={`grid gap-2 ${isPastDeadline ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
              {teams.map((team) => (
                <button
                  key={team.team_id}
                  disabled={isPastDeadline}
                  onClick={() => setSelectedTeam(team.team_id)}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                    selectedTeam === team.team_id 
                    ? "bg-white/5 border-white text-white" 
                    : "bg-[#0f111a] border-slate-800 text-slate-400 hover:border-slate-600"
                  }`}
                  style={{ borderLeft: `4px solid ${team.hex_color}` }}
                >
                  <span className="font-black italic uppercase text-sm">{team.team_name}</span>
                  {selectedTeam === team.team_id && <span>🏁</span>}
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}