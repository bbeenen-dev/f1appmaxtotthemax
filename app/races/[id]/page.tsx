"use client";

import { use, useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

export const dynamic = "force-dynamic";

interface RaceData {
  id: string;
  race_name: string;
  city_name: string;
  sprint_race_start: string | null;
  round: number;
}

interface PredictionStatus {
  qualy: boolean;
  sprint: boolean;
  race: boolean;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function RaceCardPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const raceId = resolvedParams.id;
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [race, setRace] = useState<RaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [status, setStatus] = useState<PredictionStatus>({
    qualy: false,
    sprint: false,
    race: false
  });

  useEffect(() => {
    let isMounted = true;

    async function getRaceAndStatus() {
      if (!raceId || String(raceId).includes('%')) return;

      try {
        setLoading(true);
        
        const { data: raceData, error: raceError } = await supabase
          .from('races')
          .select('id, race_name, city_name, sprint_race_start, round')
          .eq('id', raceId)
          .single();

        if (raceError) throw raceError;
        if (isMounted) setRace(raceData);

        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;

        if (user && isMounted) {
          const [qualyCheck, sprintCheck, raceCheck] = await Promise.all([
            supabase.from('predictions_qualifying').select('id').eq('race_id', raceId).eq('user_id', user.id).maybeSingle(),
            supabase.from('predictions_sprint').select('id').eq('race_id', raceId).eq('user_id', user.id).maybeSingle(),
            supabase.from('predictions_race').select('id').eq('race_id', raceId).eq('user_id', user.id).maybeSingle(),
          ]);

          if (isMounted) {
            setStatus({
              qualy: !!qualyCheck.data,
              sprint: !!sprintCheck.data,
              race: !!raceCheck.data
            });
          }
        }
      } catch (err: any) {
        if (isMounted) setDbError(err.message || "Er ging iets mis.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    getRaceAndStatus();
    return () => { isMounted = false; };
  }, [raceId, supabase]);

  if (loading) return (
    <div className="min-h-screen bg-[#0f111a] flex items-center justify-center">
      <div className="text-[#e10600] font-f1 font-black italic animate-pulse text-2xl tracking-widest uppercase">
        Loading Data...
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f111a] text-white p-4 md:p-8 pb-32">
      <div className="max-w-2xl mx-auto">
        
        <Link href="/races" className="group flex items-center gap-2 text-slate-500 text-[10px] font-f1 uppercase mb-8 tracking-[0.2em] hover:text-[#e10600] transition-colors">
          <span className="text-lg transition-transform group-hover:-translate-x-1">←</span> Terug naar Kalender
        </Link>

        <header className="mb-12 relative">
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-[#e10600] font-f1 font-black italic text-xl uppercase tracking-tighter">
              Round {race?.round}
            </span>
            <div className="h-[2px] flex-grow bg-slate-800/50"></div>
          </div>
          <h1 className="text-5xl md:text-6xl font-f1 font-black italic uppercase text-white leading-none tracking-tighter">
            {race?.race_name}
          </h1>
          <p className="text-slate-400 text-xs font-f1 uppercase tracking-[0.3em] mt-3 italic">
            {race?.city_name} • Predict
          </p>

          <div className="absolute -right-2 -top-6 font-f1 text-6xl md:text-8xl font-black italic text-white/[0.02] select-none pointer-events-none uppercase whitespace-nowrap overflow-hidden max-w-full">
            {race?.race_name}
          </div>
        </header>

        {dbError && (
          <div className="mb-6 p-4 bg-red-900/10 border border-red-900/50 rounded-xl text-red-500 text-[10px] font-f1 uppercase tracking-widest italic text-center">
            {dbError}
          </div>
        )}

        <div className="grid gap-6">
          {/* VOLGORDE AANGEPAST: SPRINT -> QUALY -> RACE */}
          
          {/* 1. SPRINT (Indien van toepassing) */}
          {race?.sprint_race_start && (
            <PredictionCard 
              title="Sprint Race" 
              subtitle="Short Burst Points"
              href={`/races/${raceId}/predict/sprint`}
              isDone={status.sprint}
              accentColor="bg-orange-500"
            />
          )}

          {/* 2. QUALIFYING */}
          <PredictionCard 
            title="Qualifying" 
            subtitle="Top 3 Shootout"
            href={`/races/${raceId}/predict/qualy`}
            isDone={status.qualy}
            accentColor="bg-red-600"
          />

          {/* 3. GRAND PRIX */}
          <PredictionCard 
            title="Grand Prix" 
            subtitle="Main Event Top 10"
            href={`/races/${raceId}/predict/race`}
            isDone={status.race}
            accentColor="bg-[#e10600]"
          />
        </div>
      </div>
    </div>
  );
}

function PredictionCard({ title, subtitle, href, isDone, accentColor }: { 
  title: string, subtitle: string, href: string, isDone: boolean, accentColor: string 
}) {
  return (
    <Link href={href} className="group block relative">
      <div className="relative p-[1px] rounded-2xl overflow-hidden transition-all duration-500">
        
        {/* Subtiele F1 Border - Geen groen meer in de randen */}
        <div className="absolute inset-0 bg-[conic-gradient(from_180deg_at_0%_50%,#e10600_0deg,#e10600_40deg,transparent_90deg)] opacity-20 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Kaart Inhoud - Altijd donkergrijs */}
        <div className="relative bg-[#161a23] p-6 rounded-[calc(1rem-1px)] transition-colors group-hover:bg-[#1c222d]">
          <div className="flex justify-between items-center">
            <div>
              {/* Titel kleurt groen bij voltooiing, anders wit/rood op hover */}
              <h2 className={`text-2xl font-f1 font-black italic uppercase leading-none mb-1 transition-colors ${isDone ? 'text-green-500' : 'text-white group-hover:text-[#e10600]'}`}>
                {title}
              </h2>
              <p className="text-slate-500 text-[9px] font-f1 uppercase tracking-[0.2em]">{subtitle}</p>
            </div>

            <div className="flex items-center gap-4">
              {isDone ? (
                <div className="flex items-center gap-2">
                  {/* Woord Ready in groen */}
                  <span className="font-f1 text-[10px] text-green-500 font-bold italic tracking-tighter uppercase">Ready</span>
                  {/* Vinkje in groen (zonder zwarte cirkel voor cleaner effect) */}
                  <div className="text-green-500">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              ) : (
                <span className="text-[#e10600] text-2xl font-f1 font-black italic opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                  →
                </span>
              )}
            </div>
          </div>

          {/* De accent-lijn onderaan: kleurt groen bij klaar, anders de accentkleur */}
          <div className={`absolute bottom-0 left-6 right-6 h-[2px] transition-transform duration-500 scale-x-0 group-hover:scale-x-100 ${isDone ? 'bg-green-500' : accentColor}`} />
        </div>
      </div>
    </Link>
  );
}