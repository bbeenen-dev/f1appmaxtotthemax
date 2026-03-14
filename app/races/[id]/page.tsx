"use client";

import { use, useEffect, useState, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

export const dynamic = "force-dynamic";

// --- Interfaces ---
interface RaceData {
  id: string;
  race_name: string;
  city_name: string;
  sprint_race_start: string | null;
  qualifying_start: string | null;
  race_start: string | null;
  round: number;
}

export default function RaceCardPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const raceId = resolvedParams.id;
  
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  const [race, setRace] = useState<RaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ qualy: false, sprint: false, race: false });
  
  const [resultsAvailable, setResultsAvailable] = useState({ qualy: false, sprint: false, race: false });
  const [hasAnyResults, setHasAnyResults] = useState(false);
  const [isWeekendFinished, setIsWeekendFinished] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function getInitialData() {
      const { data: raceData } = await supabase
        .from('races')
        .select('*')
        .eq('id', raceId)
        .single();

      if (raceData) {
        setRace(raceData);
        const needsSprint = !!raceData.sprint_race_start;
        
        const [resQ, resR, resS] = await Promise.all([
          supabase.from('results_qualifying').select('id').eq('race_id', raceId).maybeSingle(),
          supabase.from('results_race').select('id').eq('race_id', raceId).maybeSingle(),
          needsSprint 
            ? supabase.from('results_sprint').select('id').eq('race_id', raceId).maybeSingle()
            : Promise.resolve({ data: null })
        ]);

        const qDone = !!resQ.data;
        const rDone = !!resR.data;
        const sDone = needsSprint ? !!resS.data : false;

        setResultsAvailable({ qualy: qDone, race: rDone, sprint: sDone });
        setHasAnyResults(qDone || rDone || sDone);
        setIsWeekendFinished(qDone && rDone && (needsSprint ? sDone : true));
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const [q, s, r] = await Promise.all([
          supabase.from('predictions_qualifying').select('id').eq('race_id', raceId).eq('user_id', session.user.id).maybeSingle(),
          supabase.from('predictions_sprint').select('id').eq('race_id', raceId).eq('user_id', session.user.id).maybeSingle(),
          supabase.from('predictions_race').select('id').eq('race_id', raceId).eq('user_id', session.user.id).maybeSingle(),
        ]);
        setStatus({ qualy: !!q.data, sprint: !!s.data, race: !!r.data });
      }
      setLoading(false);
    }
    getInitialData();
  }, [raceId, supabase]);

  if (loading) return <div className="min-h-screen bg-[#0f111a] flex items-center justify-center font-f1 italic text-[#e10600]">LOADING...</div>;

  const renderCard = (type: 'sprint' | 'qualy' | 'race') => {
    if (type === 'sprint' && race?.sprint_race_start) {
        return <PredictionCard key="sprint" title="Sprint Race" subtitle="Voorspel de Top 8" href={`/races/${raceId}/predict/sprint`} isDone={status.sprint} accentColor="bg-orange-500" />;
    }
    if (type === 'qualy') {
        return <PredictionCard key="qualy" title="Kwalificatie" subtitle="Voorspel de Top 3" href={`/races/${raceId}/predict/qualy`} isDone={status.qualy} accentColor="bg-red-600" />;
    }
    if (type === 'race') {
        return <PredictionCard key="race" title="Hoofd Race" subtitle="Voorspel de Top 10" href={`/races/${raceId}/predict/race`} isDone={status.race} accentColor="bg-[#e10600]" />;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#0f111a] text-white p-4 pb-32 overflow-x-hidden">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8">
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-[#e10600] font-f1 font-black italic text-xl uppercase">Ronde {race?.round}</span>
            <div className="h-[2px] flex-grow bg-slate-800/50"></div>
          </div>
          <h1 className="text-5xl font-f1 font-black italic uppercase leading-tight">{race?.race_name}</h1>
          <p className="text-slate-400 text-xs font-f1 uppercase tracking-[0.3em] mt-3 italic">{race?.city_name}</p>
        </header>

        {/* UITSLAGEN EN SCORES (GROENE RAND) */}
        {hasAnyResults && (
          <Link href={`/races/${raceId}/myscores`} className="w-full mb-8 group relative block">
            <div className="absolute inset-0 bg-green-500/5 blur-xl group-hover:bg-green-500/10 transition-all duration-500" />
            <div className="relative bg-[#161a23] border-2 border-green-500/60 group-hover:border-green-400 p-5 rounded-2xl transition-all duration-300 shadow-2xl overflow-hidden">
              <div className="flex justify-between items-center">
                <div className="text-left">
                  <span className="block text-white font-f1 font-black italic uppercase text-xl leading-none mb-1 group-hover:text-green-400 transition-colors">Uitslagen en mijn scores</span>
                  <span className="block text-slate-500 font-f1 uppercase text-[10px] tracking-widest italic font-bold">
                    {isWeekendFinished ? "Volledig weekend afgerond" : "Voor zover bekend"}
                  </span>
                </div>
                <span className="text-green-400 text-xl font-f1 font-black italic transform group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          </Link>
        )}

        {/* VOORSPELLINGEN LIJST */}
        <div className="grid gap-4 mb-8">
          {!resultsAvailable.sprint && renderCard('sprint')}
          {!resultsAvailable.qualy && renderCard('qualy')}
          {!resultsAvailable.race && renderCard('race')}
          
          {/* LIVE TRACKER */}
          {!isWeekendFinished && (
            <LiveCard title="Live Tracker" subtitle="REAL-TIME • Virtuele Stand" href={`/races/${raceId}/live`} accentColor="#005AFF" />
          )}

          {/* ALLE VOORSPELLINGEN (NU ONDERAAN) */}
          <Link href={`/races/${raceId}/grid`} className="group block relative">
             <div className="relative bg-[#161a23] p-5 rounded-xl border border-slate-800 group-hover:border-[#e10600]/50 transition-all">
                <div className="flex justify-between items-center">
                   <div>
                      <h2 className="text-xl font-f1 font-black italic uppercase text-white group-hover:text-[#e10600] transition-colors">Alle Voorspellingen</h2>
                      <p className="text-slate-400 text-[10px] font-f1 uppercase tracking-[0.2em]">Bekijk wat anderen hebben gekozen</p>
                   </div>
                   <span className="text-[#e10600] text-xl font-f1 font-black italic transform group-hover:translate-x-1 transition-transform">→</span>
                </div>
             </div>
          </Link>
        </div>

        {/* ARCHIEF SECTIE */}
        {hasAnyResults && (
            <div className="mt-12 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xs font-f1 font-black uppercase italic text-slate-600">Afgeronde Sessies</h3>
                    <div className="h-[1px] flex-grow bg-slate-800/40"></div>
                </div>
                <div className="grid gap-4 opacity-70 hover:opacity-100 transition-opacity">
                    {resultsAvailable.sprint && renderCard('sprint')}
                    {resultsAvailable.qualy && renderCard('qualy')}
                    {resultsAvailable.race && renderCard('race')}
                </div>
            </div>
        )}
      </div>
    </div>
  );
}

// --- HELPERS ---
function LiveCard({ title, subtitle, href, accentColor }: { title: string, subtitle: string, href: string, accentColor: string }) {
  return (
    <Link href={href} className="group block relative">
      <div className="relative p-[1px] rounded-xl overflow-hidden transition-all duration-500">
        <div className="absolute inset-0 opacity-10 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `conic-gradient(from_180deg_at_0%_50%, ${accentColor} 0deg, ${accentColor} 40deg, transparent_90deg)` }} />
        <div className="relative bg-[#161a23] p-5 rounded-[calc(0.75rem-1px)] transition-colors group-hover:bg-[#1c222d]">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-f1 font-black italic uppercase leading-none mb-1 text-white group-hover:text-[#005AFF] transition-colors">{title}</h2>
              <div className="flex items-center gap-2">
                <span className="flex h-1.5 w-1.5 rounded-full bg-[#005AFF] animate-pulse"></span>
                <p className="text-slate-400 text-[10px] font-f1 uppercase tracking-[0.2em]">{subtitle}</p>
              </div>
            </div>
            <span className="text-[#005AFF] text-xl font-f1 font-black italic opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">→</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function PredictionCard({ title, subtitle, href, isDone, accentColor }: { title: string, subtitle: string, href: string, isDone: boolean, accentColor: string }) {
  return (
    <Link href={href} className="group block relative">
      <div className="relative p-[1px] rounded-xl overflow-hidden transition-all duration-500">
        <div className="absolute inset-0 bg-[#e10600] opacity-5 group-hover:opacity-40 transition-opacity duration-500" />
        <div className="relative bg-[#161a23] p-5 rounded-[calc(0.75rem-1px)] transition-colors group-hover:bg-[#1c222d]">
          <div className="flex justify-between items-center">
            <div>
              <h2 className={`text-xl font-f1 font-black italic uppercase transition-colors ${isDone ? 'text-green-500' : 'text-white group-hover:text-[#e10600]'}`}>{title}</h2>
              <p className="text-slate-400 text-[10px] font-f1 uppercase tracking-[0.2em]">{subtitle}</p>
            </div>
            {isDone ? (
              <div className="text-green-500">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : (
              <span className="text-[#e10600] text-xl font-f1 font-black italic opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">→</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}