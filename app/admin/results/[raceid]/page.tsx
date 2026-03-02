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
  const raceId = params.raceId;
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
    sprint: { title: "Sprint Uitslag", limit: 8, table: "results_sprint", field: "top_8_drivers" },
    qualy: { title: "Qualy Uitslag", limit: 3, table: "results_qualifying", field: "top_3_drivers" },
    race: { title: "Race Uitslag", limit: 10, table: "results_race", field: "top_10_drivers" },
  };

  const config = configMap[activeSession];

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      // 1. Haal alle coureurs op
      const { data: drv } = await supabase
        .from("drivers")
        .select("driver_id, driver_name, team_id")
        .eq("active", true)
        .order("driver_name");
      
      if (drv) setDrivers(drv);

      // 2. Haal bestaande uitslag op voor de geselecteerde sessie
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
        updated_at: new Date().toISOString() // De handmatige kolom die je toevoegt
      }, { onConflict: 'race_id' });

    if (error) {
      alert("Fout bij opslaan: " + error.message);
    } else {
      alert(`${config.title} succesvol opgeslagen!`);
    }
    setSaving(false);
  };

  if (loading) return <div className="min-h-screen bg-[#0f111a] p-8 text-white">Laden...</div>;

  return (
    <div className="min-h-screen bg-[#0f111a] text-white p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        
        {/* Header met Session Switcher */}
        <div className="mb-8 bg-[#161a23] p-6 rounded-3xl border border-slate-800">
          <h1 className="font-f1 text-2xl font-black italic uppercase mb-6 text-[#e10600]">Admin: Race Results</h1>
          
          <div className="flex gap-2">
            {(['sprint', 'qualy', 'race'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setActiveSession(s)}
                className={`flex-1 py-3 rounded-xl font-f1 italic font-black uppercase text-xs transition-all ${
                  activeSession === s ? "bg-[#e10600] text-white" : "bg-[#0f111a] text-slate-500 border border-slate-800"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Info & Save */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-f1 text-xl italic font-black uppercase">{config.title}</h2>
          <button
            onClick={handleSaveResult}
            disabled={saving}
            className="bg-green-600 hover:bg-green-500 text-white font-f1 font-black italic uppercase px-6 py-2 rounded-lg text-xs"
          >
            {saving ? "Opslaan..." : "Uitslag Publiceren"}
          </button>
        </div>

        {/* Drag & Drop uitslag */}
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="admin-drivers">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                {drivers.map((driver, index) => {
                  const isWinner = index === 0;
                  const isInPoints = index < config.limit;
                  return (
                    <Draggable key={driver.driver_id} draggableId={driver.driver_id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`flex items-center p-3 rounded-xl border ${
                            snapshot.isDragging ? "bg-slate-700 border-white" : 
                            isInPoints ? "bg-[#161a23] border-slate-700" : "bg-[#0f111a] border-slate-900 opacity-50"
                          }`}
                        >
                          <div className={`w-8 font-f1 italic font-black ${isWinner ? "text-yellow-500" : "text-slate-500"}`}>
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-f1 font-black italic uppercase text-sm">{driver.driver_name}</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase">{driver.team_id}</p>
                          </div>
                          {index === config.limit - 1 && (
                            <span className="text-[8px] bg-red-600 px-2 py-1 rounded font-black italic">CUT-OFF</span>
                          )}
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
      </div>
    </div>
  );
}