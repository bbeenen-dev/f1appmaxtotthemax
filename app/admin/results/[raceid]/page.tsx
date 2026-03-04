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
  
  // State voor selectors
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

  // Configuratie mapping voor database interactie
  const configMap = {
    sprint: { title: "Sprint", limit: 8, table: "results_sprint", field: "top_8_drivers" },
    qualy: { title: "Qualifying", limit: 3, table: "results_qualifying", field: "top_3_drivers" },
    race: { title: "Race", limit: 10, table: "results_race", field: "top_10_drivers" },
  };

  const config = configMap[activeSession];

  // 1. Haal alle races op voor de picklist
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

  // 2. Haal coureurs en bestaande uitslag op
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      // Haal actieve coureurs op
      const { data: drv } = await supabase
        .from("drivers")
        .select("driver_id, driver_name, team_id")
        .eq("active", true)
        .order("driver_name", { ascending: true });
      
      if (drv) {
        // Check of er al een uitslag is voor deze race + sessie
        const { data: existing } = await supabase
          .from(config.table)
          .select("*")
          .eq("race_id", currentRaceId)
          .maybeSingle();

        if (existing && existing[config.field]) {
          const savedIds = existing[config.field] as string[];
          // Sorteer coureurs op basis van de opgeslagen uitslag, rest alfabetisch eronder
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
    const topIds = drivers.slice(0, config.limit).map(d => d.driver_id);

    try {
      // STAP A: Sla uitslag op in de sessie-tabel
      const { error: upsertError } = await supabase
        .from(config.table)
        .upsert({
          race_id: parseInt(currentRaceId),
          [config.field]: topIds,
          updated_at: new Date().toISOString()
        }, { onConflict: 'race_id' });

      if (upsertError) throw upsertError;

      // STAP B: Punten berekenen
      // (Deze logica is behouden van je originele code voor de tweetrapsraket)
      const predictionTable = activeSession === 'race' ? 'predictions_race' : 
                             activeSession === 'qualy' ? 'predictions_qualifying' : 'predictions_sprint';
      const predictionField = activeSession === 'race' ? 'predicted_10_drivers' : 
                             activeSession === 'qualy' ? 'predicted_3_drivers' : 'predicted_8_drivers';

      const { data: allPredictions, error: predError } = await supabase
        .from(predictionTable)
        .select(`user_id, ${predictionField}`)
        .eq('race_id', currentRaceId);

      if (predError) throw predError;

      const scoreEntries = (allPredictions || []).map(pred => {
        const userPreds = (pred as any)[predictionField] as string[] || [];
        let points = 0;

        userPreds.forEach((driverId, index) => {
          const actualPos = topIds.indexOf(driverId);
          if (activeSession === 'race') {
            if (actualPos === index) points += 5;
            else if (actualPos !== -1 && Math.abs(index - actualPos) === 1) points += 2;
          } 
          else if (activeSession === 'qualy' && actualPos === index) points += 3;
          else if (activeSession === 'sprint' && actualPos === index) points += 1;
        });

        return {
          user_id: pred.user_id,
          race_id: parseInt(currentRaceId),
          points: points,
          updated_at: new Date().toISOString()
        };
      });

      const scoreTable = activeSession === 'race' ? 'scores_race' : 
                        activeSession === 'qualy' ? 'scores_qualifying' : 'scores_sprint';

      const { error: scoreError } = await supabase
        .from(scoreTable)
        .upsert(scoreEntries, { onConflict: 'user_id, race_id' });

      if (scoreError) throw scoreError;

      alert(`Gepubliceerd! Uitslag voor ${config.title} opgeslagen en scores berekend.`);
      
    } catch (err: any) {
      alert("Fout: " + err.message);
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
        
        {/* HEADER AREA */}
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

          {/* PICKLISTS SECTIE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Race Picklist */}
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

            {/* Type Picklist */}
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

        {/* DRAG LIST INFO */}
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-[#005AFF]"></div>
            <p className="text-[10px] font-bold uppercase text-slate-400 italic">Sleep coureurs naar juiste positie</p>
          </div>
          <span className="text-[10px] font-black text-[#005AFF] uppercase tracking-widest">
            Top {config.limit} telt mee
          </span>
        </div>

        {/* DRAGGABLE LIST */}
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="admin-drivers">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                {drivers.map((driver, index) => {
                  const isInPointsZone = index < config.limit;
                  return (
                    <Draggable key={driver.driver_id} draggableId={driver.driver_id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`flex items-center p-3 rounded-xl border transition-all ${
                            snapshot.isDragging ? "bg-[#1c222d] border-[#005AFF] shadow-2xl scale-[1.02] z-50" : 
                            isInPointsZone ? "bg-[#161a23] border-slate-800" : "bg-transparent border-transparent opacity-30 grayscale"
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

        {/* FIXED FOOTER ACTION */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0f111a] via-[#0f111a] to-transparent z-[110]">
          <div className="max-w-xl mx-auto">
            <button
              onClick={handleSaveAndCalculate}
              disabled={saving}
              className="w-full bg-[#005AFF] hover:bg-white hover:text-[#005AFF] disabled:opacity-30 text-white font-black italic uppercase py-5 rounded-2xl shadow-[0_10px_30px_rgba(0,90,255,0.3)] transition-all text-sm tracking-widest flex items-center justify-center gap-3"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  VERWERKEN...
                </>
              ) : `BEVESTIG ${config.title} UITSLAG`}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}