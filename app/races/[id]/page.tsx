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

    const supabase = useMemo(() => createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ), []);

    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [race, setRace] = useState<RaceData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isPastDeadline, setIsPastDeadline] = useState(false);
    
    // Cruciaal voor Next.js 15: voorkom hydration mismatches
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const config = useMemo(() => {
        const configMap: Record<string, { title: string; limit: number; table: string; field: string; timeField: string }> = {
            sprint: { title: "Sprint Top 8", limit: 8, table: "predictions_sprint", field: "top_8_drivers", timeField: "sprint_race_start" },
            qualy: { title: "Qualifying Top 3", limit: 3, table: "predictions_qualifying", field: "top_3_drivers", timeField: "qualifying_start" },
            race: { title: "Grand Prix Top 10", limit: 10, table: "predictions_race", field: "top_10_drivers", timeField: "race_start" },
        };
        return configMap[type as string] || configMap.race;
    }, [type]);

    useEffect(() => {
        let isMounted = true;

        async function fetchData() {
            // Stap 1: Haal alles parallel op om 'waterval' renders te voorkomen
            const [raceRes, driversRes, sessionRes] = await Promise.all([
                supabase.from("races").select("*").eq("id", raceId).single(),
                supabase.from("drivers").select("driver_id, driver_name, team_id").eq("active", true).order("driver_name", { ascending: true }),
                supabase.auth.getSession()
            ]);

            if (!isMounted) return;

            // Stap 2: Bereken deadline status
            if (raceRes.data) {
                setRace(raceRes.data);
                const deadline = new Date(raceRes.data[config.timeField]);
                if (new Date() > deadline) setIsPastDeadline(true);
            }

            let currentDrivers = driversRes.data || [];
            const session = sessionRes.data.session;

            // Stap 3: Haal voorspelling op indien ingelogd
            if (session?.user) {
                const { data: existingPred } = await supabase
                    .from(config.table)
                    .select("*")
                    .eq("race_id", raceId)
                    .eq("user_id", session.user.id)
                    .maybeSingle();

                if (existingPred && existingPred[config.field]) {
                    const savedIds = existingPred[config.field] as string[];
                    currentDrivers = [...currentDrivers].sort((a, b) => {
                        const indexA = savedIds.indexOf(a.driver_id);
                        const indexB = savedIds.indexOf(b.driver_id);
                        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                        if (indexA !== -1) return -1;
                        if (indexB !== -1) return 1;
                        return 0;
                    });
                }
            }

            // Stap 4: Update state in één keer
            setDrivers(currentDrivers);
            setLoading(false);
        }

        fetchData();
        return () => { isMounted = false; };
    }, [raceId, config, supabase]);

    const onDragEnd = (result: DropResult) => {
        if (!result.destination || isPastDeadline) return;
        const items = Array.from(drivers);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
        setDrivers(items);
    };

    const handleSave = async () => {
        setSaving(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
            alert("Log in om op te slaan.");
            setSaving(false);
            return;
        }

        const payload = {
            user_id: session.user.id,
            race_id: parseInt(raceId as string),
            [config.field]: drivers.slice(0, config.limit).map(d => d.driver_id),
            updated_at: new Date().toISOString(),
        };

        const { error } = await supabase.from(config.table).upsert(payload, { onConflict: "user_id, race_id" });
        if (error) alert(error.message);
        else router.refresh();
        setSaving(false);
    };

    // Laadscherm zonder pulse op de hele pagina om visuele rust te houden
    if (!mounted || loading) {
        return (
            <div className="min-h-screen bg-[#0f111a] flex items-center justify-center font-f1 text-[#e10600] italic">
                <span className="animate-pulse tracking-widest">SYNCING WITH PIT WALL...</span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f111a] text-white p-4 md:p-8 pb-32">
            <div className="max-w-xl mx-auto">
                <div className="sticky top-0 z-[100] bg-[#0f111a] pt-4 pb-6 border-b border-slate-800 mb-8">
                    <div className="flex items-center justify-between gap-4">
                        <header>
                            <button onClick={() => router.back()} className="group flex items-center gap-2 text-slate-500 text-[10px] font-f1 uppercase mb-2 tracking-widest hover:text-[#e10600] transition-colors">
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

                        <button
                            onClick={handleSave}
                            disabled={saving || isPastDeadline}
                            className="flex-shrink-0 bg-[#e10600] hover:bg-white hover:text-[#e10600] disabled:opacity-30 text-white font-f1 font-black italic uppercase px-6 py-3 rounded-xl shadow-lg transition-all duration-300 tracking-widest text-[10px]"
                        >
                            {saving ? "Storing..." : isPastDeadline ? "Gesloten" : "Bevestigen"}
                        </button>
                    </div>
                </div>

                {/* Belangrijk: Render DragDropContext alleen op de client om flikkering te voorkomen */}
                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="drivers-list" isDropDisabled={isPastDeadline}>
                        {(provided) => (
                            <div 
                                {...provided.droppableProps} 
                                ref={provided.innerRef} 
                                className={`space-y-3 transition-opacity duration-500 ${isPastDeadline ? 'opacity-60 grayscale-[0.5]' : 'opacity-100'}`}
                            >
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
                                                        className={`relative flex items-center p-4 rounded-xl border transition-all duration-200 ${
                                                            snapshot.isDragging
                                                                ? "bg-[#1c222d] border-[#e10600] scale-[1.02] z-50 shadow-2xl"
                                                                : "bg-[#161a23] border-slate-800/40"
                                                        } ${isInPointsZone && !snapshot.isDragging ? "border-slate-700/50 shadow-lg" : ""}`}
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