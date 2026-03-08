"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

interface Driver {
  driver_id: string;
  driver_name: string;
  team_id: string;
}

interface Race {
  id: number;
  race_name: string;
}

type SessionType = "sprint" | "qualy" | "race";

export default function AdminResultsPage() {
  const params = useParams();
  const router = useRouter();
  
  const [currentRaceId, setCurrentRaceId] = useState<string>(params.raceid as string);
  const [activeSession, setActiveSession] = useState<SessionType>("race");
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const configMap = {
    sprint: { title: "Sprint", limit: 8, table: "results_sprint", field: "top_8_drivers" },
    qualy: { title: "Qualifying", limit: 3, table: "results_qualifying", field: "top_3_drivers" },
    race: { title: "Race", limit: 10, table: "results_race", field: "top_10_drivers" },
  };

  const config = configMap[activeSession];

  useEffect(() => {
    async function getRaces() {
      const { data } = await supabase
        .from("races")
        .select("id, race_name")
        .order("id", { ascending: true });
      if (data) setRaces(data);
    }
    getRaces();
  }, [supabase]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data: drv } = await supabase
        .from("drivers")
        .select("driver_id, driver_name, team_id")
        .eq("active", true)
        .order("driver_name", { ascending: true });
      
      if (drv) {
        const { data: existing } = await supabase
          .from(config.table)
          .select("*")
          .eq("race_id", currentRaceId)
          .maybeSingle();

        if (existing && existing[config.field]) {
          const savedIds = existing[config.field] as string[];
          const reordered = [...drv].sort((a, b) => {
            const idxA = savedIds.indexOf(a.driver_id);
            const idxB = savedIds.indexOf(b.driver_id);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return 0;
          });
          setDrivers(reordered);
        } else {
          setDrivers(drv);
        }
      }
      setLoading(false);
    }
    fetchData();
  }, [currentRaceId, activeSession, config.table, config.field, supabase]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(drivers);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setDrivers(items);
  };

  const handleRaceChange = (id: string) => {
    setCurrentRaceId(id);
    router.push(`/admin/results/${id}`);
  };

  const handleSaveAndCalculate = async () => {
    setSaving(true);
    
    // De volledige lijst uit de UI (om ook P11 te kunnen detecteren)
    const fullListIds = drivers.map(d => d.driver_id);
    // Alleen de top X voor de database opslag
    const topIdsForStorage = fullListIds.slice(0, config.limit);

    try {
      // STAP A: Sla de officiële uitslag op
      const { error: upsertError } = await supabase
        .from(config.table)
        .upsert({
          race_id: parseInt(currentRaceId),
          [config.field]: topIdsForStorage,
          updated_at: new Date().toISOString()
        }, { onConflict: 'race_id' });

      if (upsertError) throw upsertError;

      // STAP B: Voorspellingen ophalen
      const predictionTable = activeSession === 'race' ? 'predictions_race' : 
                             activeSession === 'qualy' ? 'predictions_qualifying' : 'predictions_sprint';
      
      const predictionField = activeSession === 'race' ? 'top_10_drivers' : 
                             activeSession === 'qualy' ? 'top_3_drivers' : 'top_8_drivers';

      const { data: allPredictions, error: predError } = await supabase
        .from(predictionTable)
        .select(`user_id, ${predictionField}`)
        .eq('race_id', currentRaceId);

      if (predError) throw predError;

      // STAP C: Punten berekenen
      const scoreEntries = (allPredictions || []).map(pred => {
        const userPreds = (pred as any)[predictionField] as string[] || [];
        let points = 0;

        userPreds.forEach((driverId, index) => {
          // AANPASSING: Gebruik fullListIds i.p.v. topIds om ook posities buiten de top 10 te vinden
          const actualPos = fullListIds.indexOf(driverId);
          
          if (activeSession === 'race') {
            if (actualPos === index) {
              points += 5; // Exact
            } else if (actualPos !== -1) {
              const distance = Math.abs(index - actualPos);
              // Nu werkt dit ook voor P10 voorspelling vs P11 uitslag (afstand 1)
              if (distance === 1) points += 2;
            }
          } 
          else if (activeSession === 'qualy') {
            if (actualPos === index) points += 3;
          } 
          else if (activeSession === 'sprint') {
            if (actualPos === index) points += 1;
          }
        });

        return {
          user_id: pred.user_id,
          race_id: parseInt(currentRaceId),
          points: points,
          updated_at: new Date().toISOString()
        };
      });

      // STAP D: Scores opslaan
      const scoreTable = activeSession === 'race' ? 'scores_race' : 
                        activeSession === 'qualy' ? 'scores_qualifying' : 'scores_sprint';

      if (scoreEntries.length > 0) {
        const { error: scoreError } = await supabase
          .from(scoreTable)
          .upsert(scoreEntries, { onConflict: 'user_id, race_id' });

        if (scoreError) throw scoreError;
      }

      alert(`Succes! Uitslag opgeslagen en punten berekend voor ${scoreEntries.length} deelnemers.`);
      
    } catch (err: any) {
      console.error("Fout:", err);
      alert("Er ging iets mis: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0f111a] flex items-center justify-center font-f1 text-[#005AFF] italic animate-pulse">
      SYNCING RACE DATA...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f111a] text-white p-4 md:p-8 pb-32 font-f1">
      <div className="max-w-xl mx-auto">
        <div className="mb-8 space-y-6">
          <div className="flex items-center justify-between">
            <button onClick={() => router.push('/admin')} className="text-slate-500 text-[10px] uppercase hover:text-[#005AFF] transition-all tracking-widest flex items-center gap-2">
              <span>←</span> RACE CONTROL
            </button>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Live Editor</span>
            </div>
          </div>

          <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none">
            Uitslag <span className="text-[#005AFF]">Invoeren</span>
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-slate-500 italic tracking-widest ml-1">Grand Prix</label>
              <select 
                value={currentRaceId} 
                onChange={(e) => handleRaceChange(e.target.value)}
                className="w-full bg-[#161a23] border border-slate-800 rounded-xl p-4 text-sm italic uppercase text-white focus:outline-none focus:border-[#005AFF] cursor-pointer appearance-none shadow-inner"
              >
                {races.map((r) => (
                  <option key={r.id} value={r.id}>{r.race_name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-slate-500 italic tracking-widest ml-1">Sessie Type</label>
              <select 
                value={activeSession} 
                onChange={(e) => setActiveSession(e.target.value as SessionType)}
                className="w-full bg-[#161a23] border border-slate-800 rounded-xl p-4 text-sm italic uppercase text-white focus:outline-none focus:border-[#005AFF] cursor-pointer appearance-none shadow-inner"
              >
                <option value="qualy">Qualifying (Top 3)</option>
                <option value="sprint">Sprint Race (Top 8)</option>
                <option value="race">Main Race (Top 10)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-[#005AFF]"></div>
            <p className="text-[10px] font-bold uppercase text-slate-400 italic">Sleep coureurs naar juiste positie</p>
          </div>
          <span className="text-[10px] font-black text-[#005AFF] uppercase tracking-widest">
            Top {config.limit} telt mee
          </span>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="admin-drivers">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                {drivers.map((driver, index) => {
                  const isInPointsZone = index < config.limit;
                  const isPos11 = index === 10; // Extra visuele indicatie voor de cruciale 11e plek
                  
                  return (
                    <Draggable key={driver.driver_id} draggableId={driver.driver_id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`flex items-center p-3 rounded-xl border transition-all ${
                            snapshot.isDragging ? "bg-[#1c222d] border-[#005AFF] shadow-2xl scale-[1.02] z-50" : 
                            isInPointsZone ? "bg-[#161a23] border-slate-800" : 
                            isPos11 ? "bg-[#161a23]/50 border-dashed border-slate-700 opacity-80" :
                            "bg-transparent border-transparent opacity-30 grayscale"
                          }`}
                        >
                          <div className={`w-8 font-black italic text-lg ${isInPointsZone ? "text-[#005AFF]" : "text-slate-700"}`}>
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-black uppercase italic text-sm text-white">{driver.driver_name}</p>
                            <p className="text-[8px] text-slate-500 font-bold uppercase">{driver.team_id}</p>
                          </div>
                          <div className="text-slate-700">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 8h16M4 16h16" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0f111a] via-[#0f111a] to-transparent z-[110]">
          <div className="max-w-xl mx-auto">
            <button
              onClick={handleSaveAndCalculate}
              disabled={saving}
              className="w-full bg-[#005AFF] hover:bg-white hover:text-[#005AFF] disabled:opacity-30 text-white font-black italic uppercase py-5 rounded-2xl shadow-[0_10px_30px_rgba(0,90,255,0.3)] transition-all text-sm tracking-widest flex items-center justify-center gap-3"
            >
              {saving ? "VERWERKEN..." : `BEVESTIG ${config.title} UITSLAG`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}