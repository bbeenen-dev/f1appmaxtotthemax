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
  sprint_race_start?: string;
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

  // Effect voor de initiële focus op de volgende race en infinite scroll setup
  useEffect(() => {
    if (!loading && races.length > 0 && scrollContainerRef.current) {
      const now = new Date();
      // Zoek de eerstvolgende race (waar race_start in de toekomst ligt)
      const nextRaceIndex = races.findIndex(r => new Date(r.race_start) > now);
      const targetIndex = nextRaceIndex !== -1 ? nextRaceIndex : 0;
      
      const container = scrollContainerRef.current;
      const cards = container.querySelectorAll('.race-card');
      if (cards[targetIndex]) {
        const card = cards[targetIndex] as HTMLElement;
        container.scrollTop = card.offsetTop - 150; // Beetje margin van de top-header
      }
    }
  }, [loading, races]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = container;

    // Oneindig scrollen logica: 
    // Als we de helft (einde van de eerste set) passeren, spring terug
    if (scrollTop + clientHeight >= scrollHeight - 5) {
        container.scrollTop = 5; // Terug naar boven
    } else if (scrollTop <= 0) {
        container.scrollTop = (scrollHeight / 2) - clientHeight; // Naar het midden
    }
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

  // We verdubbelen de lijst voor het infinite effect
  const displayRaces = [...races, ...races];

  if (loading) return <div className="min-h-screen bg-[#0f111a] flex items-center justify-center font-f1 italic text-[#e10600]">KALENDER LADEN...</div>;

  return (
    <div className="h-screen bg-[#0f111a] flex flex-col overflow-hidden">
      {/* STICKY HEADER */}
      <header className="z-50 bg-[#0f111a]/80 backdrop-blur-md p-6 border-b border-white/5 shadow-2xl shrink-0">
        <div className="max-w-5xl mx-auto">
          <div className="w-16 h-1 bg-[#e10600] mb-3"></div>
          <h1 className="font-f1 text-3xl md:text-5xl font-black italic uppercase tracking-tighter text-white">
            F1 Kalender <span className="text-slate-600">2026</span>
          </h1>
        </div>
      </header>

      {/* SCROLLABLE CONTENT */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth px-4 pb-40"
      >
        <div className="max-w-5xl mx-auto py-8 space-y-4">
          {displayRaces.map((race, idx) => {
            const preds = predictions.filter(p => p.race_id === race.id);
            const hasQualy = preds.some(p => p.type === 'qualy');
            const hasRace = preds.some(p => p.type === 'race');
            const hasSprint = preds.some(p => p.type === 'sprint');
            const needsSprint = !!race.sprint_race_start;
            const isComplete = needsSprint ? (hasQualy && hasRace && hasSprint) : (hasQualy && hasRace);

            return (
              <Link 
                key={`${race.id}-${idx}`} 
                href={`/races/${race.id}`} 
                className="race-card group relative p-[1px] rounded-3xl transition-all duration-500 overflow-hidden block"
              >
                <div className={`absolute inset-0 ${
                  isComplete 
                    ? 'bg-green-500/20' 
                    : 'bg-white/5'
                } group-hover:bg-[#e10600]/20 transition-colors`} />
                
                <div className="relative bg-[#161a23] rounded-[calc(1.5rem-1px)] p-6 flex justify-between items-center transition-colors group-hover:bg-[#1c222d]">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-[#e10600] font-f1 font-black text-xs italic tracking-tighter">R{race.round}</span>
                      <h2 className="font-f1 text-xl md:text-2xl font-black italic uppercase leading-tight text-white group-hover:text-[#e10600] transition-colors">
                        {race.race_name}
                      </h2>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <p className="text-slate-400 font-f1 font-black uppercase text-[10px] tracking-wider italic">
                        {race.city_name}
                      </p>
                      <span className="text-slate-700 text-xs">•</span>
                      <p className="text-slate-500 font-f1 text-[10px] font-bold uppercase tracking-widest italic">
                        {formatDateRange(race.fp1_start, race.race_start)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                     <div className={`h-2 w-2 rounded-full ${hasQualy ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-slate-800'}`} title="Qualy" />
                     {needsSprint && <div className={`h-2 w-2 rounded-full ${hasSprint ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-slate-800'}`} title="Sprint" />}
                     <div className={`h-2 w-2 rounded-full ${hasRace ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-slate-800'}`} title="Race" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      
      {/* Gradient overlay voor dat wiel-effect aan de onderkant */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0f111a] to-transparent pointer-events-none z-40" />
    </div>
  );
}