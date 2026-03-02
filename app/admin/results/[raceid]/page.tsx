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

export default function AdminResultsPage() {
  const params = useParams();
  const raceId = params.raceid; 
  const router = useRouter();
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [activeSession, setActiveSession] = useState<"sprint" | "qualy" | "race">("race");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const configMap = {
    sprint: { title: "Sprint Uitslag", limit: 8, table: "results_sprint", field: "top_8_drivers" },
    qualy: { title: "Qualy Uitslag", limit: 3, table: "results_qualifying", field: "top_3_drivers" },
    race: { title: "Race Uitslag", limit: 10, table: "results_race", field: "top_10_drivers" },
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
          .eq("race_id", raceId)
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
  }, [raceId, activeSession, config.table, config.field, supabase]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(drivers);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setDrivers(items);
  };

  const handleSaveResult = async () => {
    setSaving(true);
    const topIds = drivers.slice(0, config.limit).map(d => d.driver_id);

    const { error } = await supabase
      .from(config.table)
      .upsert({
        race_id: parseInt(raceId as string),
        [config.field]: topIds,
        updated_at: new Date().toISOString()
      }, { onConflict: 'race_id' });

    if (error) {
      alert("Fout bij opslaan: " + error.message);
    } else {
      alert(`${config.title} succesvol opgeslagen!`);
      router.refresh();
    }
    setSaving(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0f111a] flex items-center justify-center font-f1 text-[#005AFF] italic animate-pulse text-sm tracking-widest">
      CONNECTING TO PIT WALL...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f111a] text-white p-4 md:p-8 pb-32">
      <div className="max-w-xl mx-auto">
        
        {/* STICKY HEADER - BLAUW THEMA */}
        <div className="sticky top-0 z-[100] bg-[#0f111a] pt-4 pb-6 border-b border-slate-800 mb-8">
          <div className="flex items-center justify-between gap-4 mb-6">
            <header>
              <button 
                onClick={() => router.push('/admin')}
                className="group flex items-center gap-2 text-slate-500 text-[10px] font-f1 uppercase mb-2 tracking-widest hover:text-[#005AFF] transition-colors"
              >
                <span className="text-lg">←</span> Control Panel
              </button>
              <h1 className="font-f1 text-2xl font-black italic uppercase tracking-tighter leading-none">
                Admin <span className="text-[#005AFF]">Results</span>
              </h1>
            </header>

            <button
              onClick={handleSaveResult}
              disabled={saving}
              className="flex-shrink-0 bg-[#005AFF] hover:bg-white hover:text-[#005AFF] disabled:opacity-30 text-white font-f1 font-black italic uppercase px-6 py-3 rounded-xl shadow-[0_0_20px_rgba(0,90,255,0.3)] transition-all duration-300 tracking-widest text-[10px]"
            >
              {saving ? "Storing..." : "Publiceren"}
            </button>
          </div>

          {/* RACE SELECTOR */}
          <div className="mb-4">
            <label className="block text-[8px] font-black uppercase text-slate-500 mb-2 italic tracking-[0.2em]">Select Grand Prix</label>
            <div className="relative">
              <select 
                value={raceId} 
                onChange={(e) => router.push(`/admin/results/${e.target.value}`)}
                className="w-full bg-[#161a23] border border-slate-800 rounded-xl p-3 font-f1 text-xs italic uppercase text-white focus:outline-none focus:border-[#005AFF] appearance-none cursor-pointer shadow-inner"
              >
                {races.map((r) => (
                  <option key={r.id} value={r.id}>{r.race_name}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#005AFF]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* SESSION SWITCHER */}
          <div className="flex gap-2 bg-[#161a23] p-1 rounded-xl border border-slate-800/50 shadow-md">
            {(['sprint', 'qualy', 'race'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setActiveSession(s)}
                className={`flex-1 py-2 rounded-lg font-f1 italic font-black uppercase text-[9px] tracking-[0.15em] transition-all ${
                  activeSession === s ? "bg-[#005AFF] text-white shadow-lg" : "text-slate-500 hover:text-white hover:bg-[#0f111a]"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* DRAG & DROP AREA */}
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="admin-drivers">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                {drivers.map((driver, index) => {
                  const isInPointsZone = index < config.limit;
                  const isLastPointPos = index === config.limit - 1;

                  return (
                    <div key={driver.driver_id}>
                      <Draggable draggableId={driver.driver_id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`relative flex items-center p-4 rounded-xl border transition-all duration-200 ${
                              snapshot.isDragging
                                ? "bg-[#1c222d] border-[#005AFF] scale-[1.02] z-50 shadow-2xl"
                                : isInPointsZone
                                ? "bg-[#161a23] border-slate-700/50 shadow-lg"
                                : "bg-[#0f111a] border-slate-800/40 opacity-40 grayscale-[0.5]"
                            }`}
                          >
                            <div className={`w-10 font-f1 font-black italic text-xl ${isInPointsZone ? "text-[#005AFF]" : "text-slate-800"}`}>
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <p className="font-f1 font-black uppercase italic text-sm tracking-tight text-white leading-tight">{driver.driver_name}</p>
                              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest italic">{driver.team_id}</p>
                            </div>
                            <div className="text-slate-700 hover:text-[#005AFF] transition-colors">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </Draggable>

                      {isLastPointPos && (
                        <div className="my-6 flex items-center gap-4">
                          <div className="h-[1px] flex-grow bg-gradient-to-r from-transparent via-[#005AFF] to-transparent opacity-50"></div>
                          <span className="text-[8px] font-f1 font-black italic text-[#005AFF] uppercase tracking-widest opacity-70">Points Boundary ({config.limit} Pos)</span>
                          <div className="h-[1px] flex-grow bg-gradient-to-r from-transparent via-[#005AFF] to-transparent opacity-50"></div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
}