"use client";

import { useEffect, useRef, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

interface Race {
  id: number;
  round: number;
  race_name: string;
  city_name: string;
  race_start: string;
  fp1_start: string;
  fp2_start: string;
  fp3_start: string;
  qualifying_start: string;
  sprint_race_start?: string;
  has_sprint: boolean;
}

interface Prediction {
  race_id: number;
  type: 'race' | 'qualy' | 'sprint';
}

export default function CalendarPage() {
  const [races, setRaces] = useState<Race[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: racesData } = await supabase.from('races').select('*').order('round', { ascending: true });
      
      if (racesData) setRaces(racesData);

      if (user) {
        const [racePreds, qualiPreds, sprintPreds] = await Promise.all([
          supabase.from('predictions_race').select('race_id').eq('user_id', user.id),
          supabase.from('predictions_qualifying').select('race_id').eq('user_id', user.id),
          supabase.from('predictions_sprint').select('race_id').eq('user_id', user.id),
        ]);

        const all: Prediction[] = [];
        racePreds.data?.forEach(p => all.push({ race_id: p.race_id, type: 'race' }));
        qualiPreds.data?.forEach(p => all.push({ race_id: p.race_id, type: 'qualy' }));
        sprintPreds.data?.forEach(p => all.push({ race_id: p.race_id, type: 'sprint' }));
        setPredictions(all);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (!loading && races.length > 0) {
      const now = new Date();
      const nextRaceIndex = races.findIndex(r => new Date(r.race_start) > now);
      
      if (nextRaceIndex !== -1) {
        setTimeout(() => {
          const element = document.getElementById(`race-card-${races[nextRaceIndex].id}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
    }
  }, [loading, races]);

  // Helper voor tijdnotatie met correcte tijdzone conversie
  const formatSessionTime = (dateStr: string | null) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    
    const day = date.toLocaleDateString('nl-NL', { 
      weekday: 'short', 
      timeZone: 'Europe/Amsterdam' 
    }).replace('.', '');

    const time = date.toLocaleTimeString('nl-NL', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false,
      timeZone: 'Europe/Amsterdam' 
    });

    return `${day.charAt(0).toUpperCase() + day.slice(1)} ${time}`;
  };

  const formatDateRange = (fp1: string, race: string) => {
    if (!fp1 || !race) return "";
    const start = new Date(fp1);
    const end = new Date(race);
    const month = end.toLocaleDateString('nl-NL', { month: 'short' });
    return start.getMonth() === end.getMonth()
      ? `${start.getDate()}-${end.getDate()} ${month}`
      : `${start.getDate()} ${start.toLocaleDateString('nl-NL', { month: 'short' })} - ${end.getDate()} ${month}`;
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0f111a] flex items-center justify-center font-f1 italic text-[#e10600]">
      KALENDER LADEN...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f111a] text-white flex flex-col">
      <header className="sticky top-0 z-[60] bg-[#0f111a]/90 backdrop-blur-xl border-b border-white/10 p-6 md:p-10 shadow-2xl">
        <div className="max-w-5xl mx-auto">
          <div className="w-16 md:w-24 h-1 bg-[#e10600] mb-4 shadow-[0_0_15px_rgba(225,6,0,0.5)]"></div>
          <h1 className="font-f1 text-3xl md:text-6xl font-black italic uppercase tracking-tighter">
            F1 Kalender <span className="text-slate-500">2026</span>
          </h1>
        </div>
      </header>

      <main className="flex-1 p-6 md:p-12 pb-32">
        <div className="max-w-5xl mx-auto grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {races.map((race: Race) => {
            const preds = predictions.filter(p => p.race_id === race.id);
            const hasQualy = preds.some(p => p.type === 'qualy');
            const hasRace = preds.some(p => p.type === 'race');
            const hasSprint = preds.some(p => p.type === 'sprint');
            const needsSprint = race.has_sprint;
            const isComplete = needsSprint ? (hasQualy && hasRace && hasSprint) : (hasQualy && hasRace);

            return (
              <Link 
                key={race.id} 
                id={`race-card-${race.id}`}
                href={`/races/${race.id}`} 
                className="group relative p-[1px] rounded-3xl transition-all duration-500 overflow-hidden block hover:shadow-[0_0_20px_rgba(225,6,0,0.15)]"
              >
                <div className={`absolute inset-0 transition-opacity duration-500 ${
                  isComplete 
                    ? 'bg-[conic-gradient(from_180deg_at_0%_50%,#22c55e_0deg,#22c55e_40deg,transparent_90deg)] opacity-100' 
                    : 'bg-[conic-gradient(from_180deg_at_0%_50%,#e10600_0deg,#e10600_40deg,transparent_90deg)] opacity-40 group-hover:opacity-100'
                }`} />
                
                <div className="relative bg-[#161a23] rounded-[calc(1.5rem-1px)] p-6 h-full flex flex-col transition-colors group-hover:bg-[#1c222d]">
                  <div className="flex justify-between items-start mb-4">
                    <span className={`font-f1 ${isComplete ? 'text-green-500' : 'text-slate-500'} uppercase text-[10px] tracking-widest leading-none`}>
                      Round {race.round}
                    </span>
                    {isComplete && (
                      <div className="bg-green-500/20 text-green-500 p-1 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  <h2 className="font-f1 text-2xl font-black italic uppercase mb-1 leading-tight tracking-tight text-white group-hover:text-[#e10600] transition-colors">
                    {race.race_name}
                  </h2>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <p className="text-slate-400 font-f1 font-black uppercase text-xs tracking-wider italic">
                      {race.city_name}
                    </p>
                    <span className="text-slate-700 text-xs">•</span>
                    <p className="text-slate-400 font-f1 text-[10px] font-bold uppercase tracking-widest italic">
                      {formatDateRange(race.fp1_start, race.race_start)}
                    </p>
                  </div>

                  {/* TIJDENSCHEMA GRID - Toegevoegd zoals in de NextEventCard */}
                  <div className="grid grid-cols-5 gap-1 mb-8 pt-4 border-t border-white/5">
                    <div className="flex flex-col">
                      <span className="text-[7px] text-slate-500 uppercase font-black">FP1</span>
                      <span className="text-xs text-white font-f1 italic font-bold">{formatSessionTime(race.fp1_start)}</span>
                    </div>

                    {race.has_sprint ? (
                      <>
                        <div className="flex flex-col">
                          <span className="text-[7px] text-orange-500 uppercase font-black">SQ</span>
                          <span className="text-xs text-white font-f1 italic font-bold">{formatSessionTime(race.fp2_start)}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[7px] text-orange-500 uppercase font-black">Sprint</span>
                          <span className="text-xs text-white font-f1 italic font-bold">{formatSessionTime(race.sprint_race_start || null)}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex flex-col">
                          <span className="text-[7px] text-slate-500 uppercase font-black">FP2</span>
                          <span className="text-xs text-white font-f1 italic font-bold">{formatSessionTime(race.fp2_start)}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[7px] text-slate-500 uppercase font-black">FP3</span>
                          <span className="text-xs text-white font-f1 italic font-bold">{formatSessionTime(race.fp3_start)}</span>
                        </div>
                      </>
                    )}

                    <div className="flex flex-col">
                      <span className="text-[7px] text-[#e10600] uppercase font-black">Qualy</span>
                      <span className="text-xs text-white font-f1 italic font-bold">{formatSessionTime(race.qualifying_start)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[7px] text-[#e10600] uppercase font-black">Race</span>
                      <span className="text-xs text-white font-f1 italic font-bold">{formatSessionTime(race.race_start)}</span>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-auto relative z-10">
                    {needsSprint && (
                      <div className="flex flex-col gap-1">
                        <span className="text-[7px] text-slate-600 uppercase font-black tracking-tighter">Sprint</span>
                        <div className={`h-1.5 w-10 rounded-full transition-all duration-500 ${hasSprint ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.3)]' : 'bg-slate-800'}`} />
                      </div>
                    )}
                    <div className="flex flex-col gap-1">
                      <span className="text-[7px] text-slate-600 uppercase font-black tracking-tighter">Qualy</span>
                      <div className={`h-1.5 w-10 rounded-full transition-all duration-500 ${hasQualy ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.3)]' : 'bg-slate-800'}`} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[7px] text-slate-600 uppercase font-black tracking-tighter">Race</span>
                      <div className={`h-1.5 w-10 rounded-full transition-all duration-500 ${hasRace ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.3)]' : 'bg-slate-800'}`} />
                    </div>
                  </div>
                </div>
                
                <div className={`absolute -right-2 -bottom-4 font-f1 text-8xl font-black italic transition-colors select-none pointer-events-none opacity-[0.03] uppercase ${
                  isComplete ? 'text-green-500' : 'text-white'
                }`}>
                  {race.round}
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}