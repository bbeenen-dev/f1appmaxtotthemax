
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

  const [enabled, setEnabled] = useState(false);



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

      table: "predictions_qualifying",

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

      const { data: driversData } = await supabase

        .from("drivers")

        .select("driver_id, driver_name, team_id")

        .eq("active", true)

        .order("driver_name", { ascending: true });

     

      if (driversData) setDrivers(driversData);



      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {

        const { data: existingPred } = await supabase

          .from(config.table)

          .select("*")

          .eq("race_id", raceId)

          .eq("user_id", session.user.id)

          .maybeSingle();



        if (existingPred) {

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

        }

      }



      setLoading(false);

      setEnabled(true);

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

       

        {/* Sticky Header & Save Button */}

        <div className="sticky top-0 z-[100] bg-[#0f111a] pt-4 pb-6 border-b border-slate-800 mb-8">

          <div className="flex items-center justify-between gap-4">

            <header>

              <button onClick={() => router.back()} className="group flex items-center gap-2 text-slate-500 text-[10px] font-f1 uppercase mb-2 tracking-widest hover:text-[#e10600] transition-colors">

                <span className="text-lg">←</span> Terug

              </button>

              <h1 className="font-f1 text-2xl font-black italic uppercase tracking-tighter leading-none">

                Predict <span className="text-[#e10600]">{type}</span>

              </h1>

            </header>



            <button

              onClick={handleSave}

              disabled={saving}

              className="flex-shrink-0 bg-[#e10600] hover:bg-white hover:text-[#e10600] disabled:opacity-30 text-white font-f1 font-black italic uppercase px-6 py-3 rounded-xl shadow-lg transition-all duration-300 tracking-widest text-[10px]"

            >

              {saving ? "Opslaan..." : "Bevestigen"}

            </button>

          </div>

        </div>



        {/* Drag & Drop Area */}

        <DragDropContext onDragEnd={onDragEnd}>

          <Droppable droppableId="drivers">

            {(provided) => (

              <div

                {...provided.droppableProps}

                ref={provided.innerRef}

                className="space-y-3"

              >

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

                              <p className="font-f1 font-black uppercase italic text-sm tracking-tight text-white">

                                {driver.driver_name}

                              </p>

                              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest italic">

                                {driver.team_id}

                              </p>

                            </div>



                            <div className="text-slate-700">

                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />

                              </svg>

                            </div>

                          </div>

                        )}

                      </Draggable>



                      {/* Fijne rode lijn na de laatste puntenpositie */}

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