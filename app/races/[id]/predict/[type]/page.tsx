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

export default function PredictionPage() {
  const params = useParams();
  const raceId = params.id;
  const type = params.type;
  const router = useRouter();
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fastestLap, setFastestLap] = useState<string>("");
  const [enabled, setEnabled] = useState(false); // Fix voor Next.js hydration

  // Configuratie per type op basis van jouw database-velden
  const configMap: Record<string, any> = {
    sprint: { 
      title: "Sprint Top 8", 
      limit: 8, 
      table: "predictions_sprint", 
      field: "top_8_drivers" 
    },
    qualy: { 
      title: "Qualifying Top 3", 
      limit: 3, 
      table: "predictions_qualifying", // Let op: je noemde predictions_qualify, check of dit klopt met je tabelnaam
      field: "top_3_drivers" 
    },
    race: { 
      title: "Grand Prix Top 10", 
      limit: 10, 
      table: "predictions_race", 
      field: "top_10_drivers" 
    },
  };

  const config = configMap[type as string] || configMap.race;

  useEffect(() => {
    async function fetchData() {
      // 1. Haal de coureurs op
      const { data: driversData } = await supabase
        .from("drivers")
        .select("driver_id, driver_name, team_id")
        .eq("active", true)
        .order("driver_name", { ascending: true });
      
      if (driversData) setDrivers(driversData);

      // 2. Haal bestaande voorspelling op (als die er al is)
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: existingPred } = await supabase
          .from(config.table)
          .select("*")
          .eq("race_id", raceId)
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (existingPred) {
          // Als er al een voorspelling is, zetten we de opgeslagen drivers bovenaan
          const savedIds = existingPred[config.field] as string[];
          if (savedIds && driversData) {
            const reordered = [...driversData].sort((a, b) => {
              const indexA = savedIds.indexOf(a.driver_id);
              const indexB = savedIds.indexOf(b.driver_id);
              if (indexA !== -1 && indexB !== -1) return indexA - indexB;
              if (indexA !== -1) return -1;
              if (indexB !== -1) return 1;
              return 0;
            });
            setDrivers(reordered);
          }
          if (existingPred.fastest_lap_driver) {
            setFastestLap(existingPred.fastest_lap_driver);
          }
        }
      }

      setLoading(false);
      setEnabled(true); // Activeer DnD pas na data-fetch en mount
    }
    fetchData();
  }, [raceId, type, config.table, config.field]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(drivers);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setDrivers(items);
  };

  const handleSave = async () => {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      alert("Je moet ingelogd zijn om op te slaan.");
      setSaving(false);
      return;
    }

    const topDriversIds = drivers.slice(0, config.limit).map(d => d.driver_id);
    
    const payload: any = {
      user_id: session.user.id,
      race_id: parseInt(raceId as string),
      [config.field]: topDriversIds,
    };

    if (type === "race") {
      payload.fastest_lap_driver = fastestLap || topDriversIds[0];
    }

    const { error } = await supabase
      .from(config.table)
      .upsert(payload, { onConflict: 'user_id, race_id' });

    if (error) {
      console.error(error);
      alert("Er ging iets mis bij het opslaan: " + error.message);
    } else {
      router.push(`/races/${raceId}`);
      router.refresh();
    }
    setSaving(false);
  };

  if (loading || !enabled) return (
    <div className="min-h-screen bg-[#0f111a] flex items-center justify-center font-f1 text-[#e10600] italic animate-pulse">
      Loading interface...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f111a] text-white p-4 md:p-8 pb-32">
      <div className="max-w-xl mx-auto">
        
        {/* Header */}
        <header className="mb-8">
          <button onClick={() => router.back()} className="group flex items-center gap-2 text-slate-500 text-[10px] font-f1 uppercase mb-6 tracking-widest hover:text-[#e10600] transition-colors">
            <span className="text-lg">←</span> Terug naar overzicht
          </button>
          <div className="w-12 h-1 bg-[#e10600] mb-3 shadow-[0_0_15px_rgba(225,6,0,0.5)]"></div>
          <h1 className="font-f1 text-4xl font-black italic uppercase tracking-tighter leading-none">
            Predict <span className="text-[#e10600]">{type}</span>
          </h1>
          <p className="text-slate-500 text-[10px] font-f1 uppercase tracking-[0.2em] mt-2 italic">
            Versleep de coureurs naar de juiste posities
          </p>
        </header>

        {/* Drag & Drop Area */}
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="drivers">
            {(provided) => (
              <div 
                {...provided.droppableProps} 
                ref={provided.innerRef} 
                className="space-y-3 pr-2 custom-scrollbar overflow-y-auto max-h-[65vh]"
              >
                {drivers.map((driver, index) => {
                  const isInPointsZone = index < config.limit;
                  
                  return (
                    <Draggable key={driver.driver_id} draggableId={driver.driver_id} index={index}>
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
                          {/* Positie Nummer */}
                          <div className={`w-10 font-f1 font-black italic text-xl ${isInPointsZone ? "text-[#e10600]" : "text-slate-800"}`}>
                            {index + 1}
                          </div>

                          {/* Coureur Info */}
                          <div className="flex-1">
                            <p className="font-f1 font-black uppercase italic text-sm tracking-tight text-white">
                              {driver.driver_name}
                            </p>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest italic">
                              {driver.team_id}
                            </p>
                          </div>

                          {/* Sleep-icoon */}
                          <div className="text-slate-700">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                            </svg>
                          </div>

                          {/* Indicator voor puntenzone */}
                          {isInPointsZone && index === config.limit - 1 && (
                            <div className="absolute -bottom-4 left-0 right-0 flex justify-center pointer-events-none">
                              <span className="bg-[#e10600] text-white text-[7px] px-2 py-0.5 rounded-full font-f1 font-black uppercase italic">
                                Points Cut-off
                              </span>
                            </div>
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

        {/* Extra: Snelste Ronde (Alleen bij Race) */}
        {type === "race" && (
          <div className="mt-12 p-5 bg-[#161a23] rounded-2xl border border-slate-700/50 shadow-inner">
            <label className="block font-f1 text-[10px] font-black uppercase text-[#e10600] mb-3 tracking-widest italic">
              Snelste Ronde Award
            </label>
            <select 
              className="w-full bg-[#0f111a] border border-slate-800 p-4 rounded-xl text-white font-f1 italic text-sm outline-none focus:border-[#e10600] transition-colors appearance-none cursor-pointer"
              value={fastestLap}
              onChange={(e) => setFastestLap(e.target.value)}
            >
              <option value="">Kies coureur voor de Fastest Lap...</option>
              {drivers.map(d => (
                <option key={d.driver_id} value={d.driver_id}>{d.driver_name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Opslaan Knop */}
        <div className="mt-10">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-[#e10600] hover:bg-white hover:text-[#e10600] disabled:opacity-30 text-white font-f1 font-black italic uppercase py-5 rounded-2xl shadow-[0_10px_30px_rgba(225,6,0,0.2)] transition-all duration-300 tracking-[0.2em] text-sm"
          >
            {saving ? "Data versturen..." : "Voorspelling Bevestigen"}
          </button>
        </div>

      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 14px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0f111a;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1c222d;
          border-radius: 10px;
          border: 4px solid #0f111a;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #e10600;
        }
      `}</style>
    </div>
  );
}