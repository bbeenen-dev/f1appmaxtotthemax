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

export default function AdminResultsPage() {
  const params = useParams();
  const raceId = params.raceid; 
  const router = useRouter();
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [activeSession, setActiveSession] = useState<"sprint" | "qualy" | "race">("race");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const configMap = {
    sprint: { title: "Sprint", limit: 8, table: "results_sprint", field: "top_8_drivers" },
    qualy: { title: "Qualy", limit: 3, table: "results_qualifying", field: "top_3_drivers" },
    race: { title: "Grand Prix", limit: 10, table: "results_race", field: "top_10_drivers" },
  };

  const config = configMap[activeSession];

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data: drv } = await supabase
        .from("drivers")
        .select("driver_id, driver_name, team_id")
        .eq("active", true)
        .order("driver_name", { ascending: true });
      
      if (drv) setDrivers(drv);

      const { data: existing } = await supabase
        .from(config.table)
        .select("*")
        .eq("race_id", raceId)
        .maybeSingle();

      if (existing && existing[config.field] && drv) {
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
      alert(`${config.title} uitslag succesvol gepubliceerd!`);
      router.refresh();
    }
    setSaving(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0f111a] flex items-center justify-center font-f1 text-[#e10600] italic animate-pulse">
      LOADING PIT DATA...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f111a] text-white p-4 md:p-8 pb-32">
      <div className="max-w-xl mx-auto">
        
        {/* STICKY HEADER - Identiek aan PredictionPage */}
        <div className="sticky top-0 z-[100] bg-[#0f111a] pt-4 pb-6 border-b border-slate-800 mb-8">
          <div className="flex items-center justify-between gap-4">
            <header>
              <button 
                onClick={() => router.push('/admin')}
                className="group flex items-center gap-2 text-slate-500 text-[10px] font-f1 uppercase mb-2 tracking-widest hover:text-[#e10600] transition-colors"
              >
                <span className="text-lg">←</span> Dashboard
              </button>
              <h1 className="font-f1 text-2xl font-black italic uppercase tracking-tighter leading-none">
                Result <span className="text-[#e10600]">{activeSession}</span>
              </h1>
            </header>

            <button
              onClick={handleSaveResult}
              disabled={saving}
              className="flex-shrink-0 bg-[#e10600] hover:bg-white hover:text-[#e10600] disabled:opacity-30 text-white font-f1 font-black italic uppercase px-6 py-3 rounded-xl shadow-lg transition-all duration-300 tracking-widest text-[10px]"
            >
              {saving ? "Storing..." : "Publiceren"}
            </button>
          </div>

          {/* Session Switcher onder de header */}
          <div className="flex gap-2 mt-4 bg-[#161a23] p-1 rounded-xl border border-slate-800/50">
            {(['sprint', 'qualy', 'race'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setActiveSession(s)}
                className={`flex-1 py-2 rounded-lg font-f1 italic font-black uppercase text-[9px] tracking-[0.2em] transition-all ${
                  activeSession === s ? "bg-[#e10600] text-white shadow-lg" : "text-slate-500 hover:text-white"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Drag & Drop Area */}
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
                                ? "bg-[#1c222d] border-[#e10600] scale-[1.02] z-50 shadow-2xl"
                                : isInPointsZone
                                ? "bg-[#161a23] border-slate-700/50 shadow-lg"
                                : "bg-[#0f111a] border-slate-800/40 opacity-40 grayscale-[0.5]"
                            }`}
                          >
                            <div className={`w-10 font-f1 font-black italic text-xl ${isInPointsZone ? "text-[#e10600]" : "text-slate-800"}`}>
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <p className="font-f1 font-black uppercase italic text-sm tracking-tight text-white">{driver.driver_name}</p>
                              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest italic">{driver.team_id}</p>
                            </div>
                            <div className="text-slate-700">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </Draggable>

                      {isLastPointPos && (
                        <div className="my-6 flex items-center gap-4">
                          <div className="h-[1px] flex-grow bg-gradient-to-r from-transparent via-[#e10600] to-transparent opacity-50"></div>
                          <span className="text-[8px] font-f1 font-black italic text-[#e10600] uppercase tracking-widest opacity-70">Cut-off</span>
                          <div className="h-[1px] flex-grow bg-gradient-to-r from-transparent via-[#e10600] to-transparent opacity-50"></div>
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