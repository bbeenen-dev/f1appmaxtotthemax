"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

interface Profile {
  id: string;
  nickname: string;
  is_admin: boolean;
  is_active: boolean;
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: "", type: "" });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchProfiles();
  }, []);

  async function fetchProfiles() {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, nickname, is_admin, is_active")
      .order("nickname");
    
    if (data) setProfiles(data);
    setLoading(false);
  }

  const updateProfile = async (id: string, updates: Partial<Profile>) => {
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", id);

    if (error) {
      setMessage({ text: "Fout bij updaten: " + error.message, type: "error" });
    } else {
      setMessage({ text: "Profiel succesvol bijgewerkt!", type: "success" });
      fetchProfiles();
    }
  };

  // VERBETERDE RESET FUNCTIE: Keuze uit Qualy, Sprint of Race
  const resetRaceScores = async () => {
    // 1. Vraag om de Race ID
    const raceId = prompt("Voor welk Race ID wil je scores wissen? (Bijv: 1)");
    if (!raceId) return;

    // 2. Vraag om het type sessie
    const type = prompt("Welke scores wil je wissen? Typ: 'qualy', 'sprint' of 'race'")?.toLowerCase();
    
    const validTypes = ['qualy', 'sprint', 'race'];
    if (!type || !validTypes.includes(type)) {
      alert("Ongeldig type. Kies uit: qualy, sprint of race.");
      return;
    }

    // Map het type naar de juiste database tabel
    const tableMap: { [key: string]: string } = {
      qualy: "scores_qualifying",
      sprint: "scores_sprint",
      race: "scores_race"
    };

    const tableName = tableMap[type];

    // 3. Bevestiging
    const confirm = window.confirm(
      `LET OP: Je gaat ALLE berekende punten voor de ${type.toUpperCase()} van Race ${raceId} verwijderen.\n\nDe voorspellingen van deelnemers blijven bewaard. Weet je het zeker?`
    );
    
    if (!confirm) return;

    // 4. Uitvoering in de database
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq("race_id", raceId);
    
    if (error) {
      setMessage({ text: "Fout bij wissen: " + error.message, type: "error" });
    } else {
      setMessage({ 
        text: `Succes! Scores voor ${type} (Race ${raceId}) zijn gewist. Je kunt ze nu opnieuw berekenen.`, 
        type: "success" 
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#0f111a] text-white p-4 md:p-8 font-f1 pb-20">
      <div className="max-w-5xl mx-auto">
        
        {/* Navigatie */}
        <button onClick={() => router.push('/admin')} className="text-slate-500 text-[10px] uppercase hover:text-[#005AFF] mb-8 flex items-center gap-2 transition-colors">
          <span>←</span> TERUG NAAR RACE CONTROL
        </button>

        <header className="mb-12">
          <h1 className="text-3xl font-black italic uppercase tracking-tighter">
            Systeem <span className="text-[#005AFF]">Beheer</span>
          </h1>
          <p className="text-slate-500 text-[10px] uppercase italic tracking-widest mt-2">Configuration & Command Center</p>
        </header>

        {message.text && (
          <div className={`p-4 rounded-xl mb-8 text-[10px] font-black uppercase italic animate-fade-in ${
            message.type === 'success' 
              ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
              : 'bg-red-500/10 text-red-500 border border-red-500/20'
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* 1. THE DRIVER MARKET (Gebruikersbeheer) */}
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-[#161a23] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-slate-800 bg-white/5 flex justify-between items-center">
                <div>
                  <h2 className="text-sm font-black uppercase italic">The Driver Market</h2>
                  <p className="text-[9px] text-slate-500 uppercase italic">Beheer nicknames, status en rechten</p>
                </div>
                <span className="text-[10px] font-bold text-[#005AFF] bg-[#005AFF]/10 px-3 py-1 rounded-full uppercase italic">
                  {profiles.length} Coureurs
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[9px] uppercase text-slate-500 border-b border-slate-800 bg-black/20">
                      <th className="p-4">Deelnemer (Nickname)</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4 text-center">Admin</th>
                      <th className="p-4 text-right">Identifier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {profiles.map((p) => (
                      <tr key={p.id} className="hover:bg-white/5 transition-colors group">
                        <td className="p-4">
                          <input 
                            type="text" 
                            defaultValue={p.nickname}
                            onBlur={(e) => {
                              if(e.target.value !== p.nickname) updateProfile(p.id, { nickname: e.target.value });
                            }}
                            className="bg-transparent border-b border-transparent focus:border-[#005AFF] focus:outline-none font-bold uppercase italic text-sm w-full transition-all text-white group-hover:text-[#005AFF]"
                          />
                        </td>
                        <td className="p-4 text-center">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={p.is_active} 
                              onChange={(e) => updateProfile(p.id, { is_active: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-8 h-4 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-green-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all"></div>
                          </label>
                        </td>
                        <td className="p-4 text-center">
                          <input 
                            type="checkbox" 
                            checked={p.is_admin} 
                            onChange={(e) => updateProfile(p.id, { is_admin: e.target.checked })}
                            className="w-4 h-4 accent-red-600 cursor-pointer"
                          />
                        </td>
                        <td className="p-4 text-right">
                          <span className="text-[7px] text-slate-600 font-mono uppercase tracking-tighter opacity-50 group-hover:opacity-100">{p.id.slice(0, 12)}...</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* 2. THE GARAGE & STEWARDS (Tools) */}
          <div className="space-y-6">
            <section className="bg-[#161a23] border border-slate-800 rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-4 bg-red-500"></div>
                <h2 className="text-sm font-black uppercase italic">The Garage</h2>
              </div>
              <div className="space-y-4">
                <p className="text-[9px] text-slate-500 uppercase italic leading-relaxed">
                  Gebruik de reset-tool om berekende punten te wissen zonder de voorspellingen aan te tasten.
                </p>
                <button 
                  onClick={resetRaceScores}
                  className="w-full bg-red-500/10 border border-red-500/20 text-red-500 py-4 rounded-2xl text-[10px] font-black uppercase italic hover:bg-red-500 hover:text-white transition-all shadow-lg"
                >
                  Scores resetten (ID & Type)
                </button>
              </div>
            </section>

            <section className="bg-[#005AFF]/10 border border-[#005AFF]/20 rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-4 bg-[#005AFF]"></div>
                <h2 className="text-sm font-black uppercase italic text-[#005AFF]">FIA Stewards</h2>
              </div>
              <p className="text-[9px] text-slate-400 uppercase italic mb-6 leading-relaxed">
                Noodzaak om punten handmatig te corrigeren voor een specifieke race? Doe dit direct in het uitslagenoverzicht.
              </p>
              <button 
                onClick={() => router.push('/admin/results/1')}
                className="w-full bg-[#005AFF] text-white py-4 rounded-2xl text-[10px] font-black uppercase italic hover:bg-white hover:text-[#005AFF] transition-all shadow-[0_0_20px_rgba(0,90,255,0.2)]"
              >
                Ga naar Score Overrides
              </button>
            </section>

            <div className="p-6 border border-slate-800 rounded-3xl bg-black/20">
               <h3 className="text-[9px] font-black uppercase text-slate-600 mb-1">Versie Beheer</h3>
               <p className="text-[8px] text-slate-700 font-mono">F1-POULE-v2.6.4-STABLE</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}