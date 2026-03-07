// voorspelpagina met drag and drop

"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

interface Driver {
    driver_id: string;
    driver_name: string;
    team_id: string;
}

interface RaceData {
    sprint_race_start: string | null;
    qualifying_start: string | null;
    race_start: string | null;
    [key: string]: any;
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
    const [race, setRace] = useState<RaceData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isPastDeadline, setIsPastDeadline] = useState(false);

    // --- OPTIMALISATIE 1: Stabiele configuratie ---
    const config = useMemo(() => {
        const configMap: Record<string, { title: string; limit: number; table: string; field: string; timeField: string }> = {
            sprint: {
                title: "Sprint Top 8",
                limit: 8,
                table: "predictions_sprint",
                field: "top_8_drivers",
                timeField: "sprint_race_start", 
            },
            qualy: {
                title: "Qualifying Top 3",
                limit: 3,
                table: "predictions_qualifying",
                field: "top_3_drivers",
                timeField: "qualifying_start",
            },
            race: {
                title: "Grand Prix Top 10",
                limit: 10,
                table: "predictions_race",
                field: "top_10_drivers",
                timeField: "race_start",
            },
        };
        return configMap[type as string] || configMap.race;
    }, [type]);

    // Live deadline check
    useEffect(() => {
        const checkStatus = () => {
            if (race && race[config.timeField]) {
                const deadline = new Date(race[config.timeField]);
                if (new Date() > deadline) {
                    setIsPastDeadline(true);
                }
            }
        };

        const timer = setInterval(checkStatus, 30000);
        checkStatus();

        return () => clearInterval(timer);
    }, [race, config.timeField]);

    // --- OPTIMALISATIE 2: Data ophalen zonder onnodige re-triggers ---
    useEffect(() => {
        let isMounted = true;

        async function fetchData() {
            // Haal race data op
            const { data: raceData } = await supabase
                .from("races")
                .select("*")
                .eq("id", raceId)
                .single();

            if (raceData && isMounted) {
                setRace(raceData);
                if (raceData[config.timeField]) {
                    const deadline = new Date(raceData[config.timeField]);
                    if (new Date() > deadline) {
                        setIsPastDeadline(true);
                    }
                }
            }

            // Haal coureurs op
            const { data: driversData } = await supabase
                .from("drivers")
                .select("driver_id, driver_name, team_id")
                .eq("active", true)
                .order("driver_name", { ascending: true });

            // Haal bestaande voorspelling op
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session?.user && isMounted) {
                const { data: existingPred } = await supabase
                    .from(config.table)
                    .select("*")
                    .eq("race_id", raceId)
                    .eq("user_id", session.user.id)
                    .maybeSingle();

                if (existingPred && driversData) {
                    const savedIds = existingPred[config.field] as string[];
                    
                    if (savedIds) {
                        const reordered = [...driversData].sort((a, b) => {
                            const indexA = savedIds.indexOf(a.driver_id);
                            const indexB = savedIds.indexOf(b.driver_id);
                            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                            if (indexA !== -1) return -1;
                            if (indexB !== -1) return 1;
                            return 0;
                        });
                        setDrivers(reordered);
                    } else {
                        setDrivers(driversData);
                    }
                } else if (driversData) {
                    setDrivers(driversData);
                }
            }

            if (isMounted) {
                setLoading(false);
            }
        }

        fetchData();
        return () => { isMounted = false; };
    }, [raceId, config, supabase]); // config is nu stabiel door useMemo

    const onDragEnd = (result: DropResult) => {
        if (!result.destination || isPastDeadline) return;
        const items = Array.from(drivers);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
        setDrivers(items);
    };

    const handleSave = async () => {
        const now = new Date();
        if (race && race[config.timeField]) {
            const deadline = new Date(race[config.timeField]);
            if (now > deadline) {
                setIsPastDeadline(true);
                alert("Te laat! De sessie is gestart.");
                return;
            }
        }

        setSaving(true);
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
            alert("Je moet ingelogd zijn.");
            setSaving(false);
            return;
        }

        const topDriversIds = drivers.slice(0, config.limit).map((d) => d.driver_id);

        const payload = {
            user_id: session.user.id,
            race_id: parseInt(raceId as string),
            [config.field]: topDriversIds,
            updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
            .from(config.table)
            .upsert(payload, { onConflict: "user_id, race_id" });

        if (error) {
            alert("Fout bij opslaan: " + error.message);
        } else {
            router.push(`/races/${raceId}`);
            router.refresh();
        }
        setSaving(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0f111a] flex items-center justify-center font-f1 text-[#e10600] italic animate-pulse">
                SYNCING WITH PIT WALL...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f111a] text-white p-4 md:p-8 pb-32">
            <div className="max-w-xl mx-auto">
                <div className="sticky top-0 z-[100] bg-[#0f111a] pt-4 pb-6 border-b border-slate-800 mb-8">
                    <div className="flex items-center justify-between gap-4">
                        <header>
                            <button
                                onClick={() => router.back()}
                                className="group flex items-center gap-2 text-slate-500 text-[10px] font-f1 uppercase mb-2 tracking-widest hover:text-[#e10600] transition-colors"
                            >
                                <span className="text-lg">←</span> Terug
                            </button>
                            <h1 className="font-f1 text-2xl font-black italic uppercase tracking-tighter leading-none">
                                Predict <span className="text-[#e10600]">{type}</span>
                            </h1>
                            {isPastDeadline && (
                                <p className="text-[#e10600] font-f1 italic text-[10px] uppercase mt-2 animate-pulse">
                                    🔒 Sessie gestart - Gesloten
                                </p>
                            )}
                        </header>

                        {!isPastDeadline ? (
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-shrink-0 bg-[#e10600] hover:bg-white hover:text-[#e10600] disabled:opacity-30 text-white font-f1 font-black italic uppercase px-6 py-3 rounded-xl shadow-lg transition-all duration-300 tracking-widest text-[10px]"
                            >
                                {saving ? "Storing..." : "Bevestigen"}
                            </button>
                        ) : (
                            <div className="bg-slate-900 border border-slate-800 text-slate-500 font-f1 font-black italic uppercase px-4 py-3 rounded-xl text-[10px]">
                                Gesloten
                            </div>
                        )}
                    </div>
                </div>

                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="drivers" isDropDisabled={isPastDeadline}>
                        {(provided) => (
                            <div {...provided.droppableProps} ref={provided.innerRef} className={`space-y-3 ${isPastDeadline ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                                {drivers.map((driver, index) => {
                                    const isInPointsZone = index < config.limit;
                                    const isLastPointPos = index === config.limit - 1;

                                    return (
                                        <div key={driver.driver_id}>
                                            <Draggable 
                                                draggableId={driver.driver_id} 
                                                index={index} 
                                                isDragDisabled={isPastDeadline}
                                            >
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...(isPastDeadline ? {} : provided.dragHandleProps)}
                                                        className={`relative flex items-center p-4 rounded-xl border transition-all duration-200 ${snapshot.isDragging
                                                                ? "bg-[#1c222d] border-[#e10600] scale-[1.02] z-50 shadow-2xl"
                                                                : isInPointsZone
                                                                    ? "bg-[#161a23] border-slate-700/50 shadow-lg"
                                                                    : "bg-[#161a23] border-slate-800/40"
                                                            }`}
                                                    >
                                                        <div className={`w-10 font-f1 font-black italic text-xl ${isInPointsZone ? "text-[#e10600]" : "text-slate-700"}`}>
                                                            {index + 1}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="font-f1 font-black uppercase italic text-base tracking-tight text-white">
                                                                {driver.driver_name}
                                                            </p>
                                                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest italic">{driver.team_id}</p>
                                                        </div>
                                                        
                                                        {!isPastDeadline && (
                                                            <div className="text-slate-700">
                                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                                                                </svg>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </Draggable>
                                            {isLastPointPos && (
                                                <div className="my-6 flex items-center gap-4">
                                                    <div className="h-[1px] flex-grow bg-gradient-to-r from-transparent via-[#e10600] to-transparent opacity-50"></div>
                                                    <span className="text-[8px] font-f1 font-black italic text-[#e10600] uppercase tracking-widest opacity-70">Points Cut-off</span>
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