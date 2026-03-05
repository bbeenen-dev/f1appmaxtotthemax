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
  qualy_start: string | null;
  race_start: string | null;
  round: number;
}

interface PredictionStatus {
  qualy: boolean;
  sprint: boolean;
  race: boolean;
}

interface GridPrediction {
  user_id: string;
  nickname: string;
  drivers: string[];
  fastest_lap?: string;
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
  const [status, setStatus] = useState<PredictionStatus>({ qualy: false, sprint: false, race: false });
  
  // Grid States
  const [activeTab, setActiveTab] = useState<'qualy' | 'sprint' | 'race'>('race');
  const [gridData, setGridData] = useState<GridPrediction[]>([]);
  const [now, setNow] = useState(new Date());

  // Timer om de 'lock' status live bij te werken
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function getData() {
      if (!raceId || String(raceId).includes('%')) return;
      try {
        setLoading(true);
        
        // 1. Race info inclusief alle starttijden
        const { data: raceData, error: raceError } = await supabase
          .from('races')
          .select('id, race_name, city_name, sprint_race_start, qualy_start, race_start, round')
          .eq('id', raceId)
          .single();

        if (raceError) throw raceError;
        if (isMounted) setRace(raceData);

        // 2. Eigen voorspellingsstatus
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && isMounted) {
          const [q, s, r] = await Promise.all([
            supabase.from('predictions_qualifying').select('id').eq('race_id', raceId).eq('user_id', session.user.id).maybeSingle(),
            supabase.from('predictions_sprint').select('id').eq('race_id', raceId).eq('user_id', session.user.id).maybeSingle(),
            supabase.from('predictions_race').select('id').eq('race_id', raceId).eq('user_id', session.user.id).maybeSingle(),
          ]);
          setStatus({ qualy: !!q.data, sprint: !!s.data, race: !!r.data });
        }

        // 3. Grid Data ophalen voor het actieve tabblad
        const tableName = activeTab === 'qualy' ? 'predictions_qualifying' : activeTab === 'sprint' ? 'predictions_sprint' : 'predictions_race';
        const { data: preds } = await supabase.from(tableName).select('*').eq('race_id', raceId);
        
        if (preds) {
          const userIds = preds.map(p => p.user_id);
          const { data: profiles } = await supabase.from('profiles').select('id, nickname').in('id', userIds);
          
          const formattedGrid = preds.map(p => ({
            user_id: p.user_id,
            nickname: profiles?.find(prof => prof.id === p.user_id)?.nickname || 'Anoniem',
            drivers: activeTab === 'qualy' ? (p.top_3_drivers || []) : activeTab === 'sprint' ? (p.top_8_drivers || []) : [...(p.top_10_drivers || []), ...(p.bottom_12_drivers || [])],
            fastest_lap: p.fastest_lap_driver
          }));
          if (isMounted) setGridData(formattedGrid);
        }

      } catch (err: any) {
        if (isMounted) setDbError(err.message || "Er ging iets mis.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    getData();
    return () => { isMounted = false; };
  }, [raceId, activeTab, supabase]);

  // Lock helper
  const isLocked = (tab: 'qualy' | 'sprint' | 'race') => {
    if (!race) return true;
    const startTime = tab === 'qualy' ? race.qualy_start : tab === 'sprint' ? race.sprint_race_start : race.race_start;
    if (!startTime) return true;
    return new Date(startTime) > now;
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0f111a] flex items-center justify-center">
      <div className="text-[#e10600] font-f1 font-black italic animate-pulse text-2xl tracking-widest uppercase">
        Loading...
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f111a] text-white p-4 md:p-8 pb-32">
      <div className="max-w-2xl mx-auto">
        
        <Link href="/races" className="group flex items-center gap-2 text-slate-500 text-[10px] font-f1 uppercase mb-8 tracking-[0.2em] hover:text-[#e10600] transition-colors">
          <span className="text-lg transition-transform group-hover:-translate-x-1">←</span> Kalender
        </Link>

        <header className="mb-12 relative">
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-[#e10600] font-f1 font-black italic text-xl uppercase tracking-tighter">Round {race?.round}</span>
            <div className="h-[2px] flex-grow bg-slate-800/50"></div>
          </div>
          <h1 className="text-5xl md:text-6xl font-f1 font-black italic uppercase text-white leading-none tracking-tighter">
            {race?.race_name}
          </h1>
          <p className="text-slate-400 text-xs font-f1 uppercase tracking-[0.3em] mt-3 italic">{race?.city_name}</p>
        </header>

        {dbError && (
          <div className="mb-6 p-4 bg-red-900/10 border border-red-900/50 rounded-xl text-red-500 text-[10px] font-f1 uppercase tracking-widest italic text-center">
            {dbError}
          </div>
        )}

        <div className="grid gap-6">
          {race?.sprint_race_start && (
            <PredictionCard title="Sprint Race" subtitle="Short Burst Points • Top 8" href={`/races/${raceId}/predict/sprint`} isDone={status.sprint} accentColor="bg-orange-500" />
          )}

          <PredictionCard title="Qualifying" subtitle="Top 3 Shootout" href={`/races/${raceId}/predict/qualy`} isDone={status.qualy} accentColor="bg-red-600" />

          <PredictionCard title="Grand Prix" subtitle="Main Event • Top 10 + FL" href={`/races/${raceId}/predict/race`} isDone={status.race} accentColor="bg-[#e10600]" />

          <div className="h-[1px] w-full bg-slate-800/50 my-4" />

          <LiveCard title="Live Tracker" subtitle="Virtual Standing • Real-time Updates" href={`/races/${raceId}/live`} accentColor="#005AFF" />

          {/* --- GRID OVERVIEW SECTIE --- */}
          <section className="mt-12 bg-[#161a23] rounded-3xl p-6 border border-slate-800/50 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-xl font-f1 font-black italic uppercase tracking-tighter text-white">The Grid</h2>
                <p className="text-[8px] text-slate-500 font-f1 uppercase tracking-widest italic">Compare predictions</p>
              </div>
              <div className="flex gap-1 bg-[#0f111a] p-1 rounded-full border border-slate-800">
                {(['qualy', 'sprint', 'race'] as const).map((t) => (
                  (t !== 'sprint' || race?.sprint_race_start) && (
                    <button
                      key={t}
                      onClick={() => setActiveTab(t)}
                      className={`px-3 py-1.5 rounded-full text-[9px] font-f1 font-bold uppercase transition-all flex items-center gap-1.5 ${activeTab === t ? 'bg-[#e10600] text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                    >
                      {isLocked(t) && <span className="text-[10px]">🔒</span>}
                      {t}
                    </button>
                  )
                ))}
              </div>
            </div>

            {isLocked(activeTab) ? (
              <div className="py-16 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-2xl bg-[#0f111a]/50">
                <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-4 text-xl">🔒</div>
                <h3 className="text-[10px] font-f1 font-black uppercase italic text-slate-400 tracking-widest">Data is classified</h3>
                <p className="text-[8px] font-f1 text-slate-600 uppercase mt-2">Openbaar zodra de {activeTab} begint</p>
              </div>
            ) : (
              <div className="relative overflow-x-auto scrollbar-hide -mx-2">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="sticky left-0 z-20 bg-[#161a23] px-4 py-3 text-[9px] font-f1 uppercase text-slate-500 min-w-[120px] shadow-[10px_0_15px_-5px_rgba(0,0,0,0.5)]">Deelnemer</th>
                      {gridData[0]?.drivers.map((_, i) => (
                        <th key={i} className="px-3 py-3 text-[9px] font-f1 uppercase text-[#e10600] text-center min-w-[70px] whitespace-nowrap">Pos {i+1}</th>
                      ))}
                      {activeTab === 'race' && <th className="px-3 py-3 text-[9px] font-f1 uppercase text-blue-500 text-center min-w-[70px]">F-Lap</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/30">
                    {gridData.length > 0 ? gridData.map((row) => (
                      <tr key={row.user_id} className="group hover:bg-white/5 transition-colors">
                        <td className="sticky left-0 z-20 bg-[#161a23] px-4 py-5 text-xs font-f1 font-black italic uppercase text-white truncate border-r border-slate-800/50 shadow-[10px_0_15px_-5px_rgba(0,0,0,0.5)] group-hover:text-[#e10600] transition-colors">
                          {row.nickname}
                        </td>
                        {row.drivers.map((d, i) => (
                          <td key={i} className="px-3 py-5 text-[10px] font-f1 font-bold text-center uppercase text-slate-400 whitespace-nowrap">
                            {d || '-'}
                          </td>
                        ))}
                        {activeTab === 'race' && (
                          <td className="px-3 py-5 text-[10px] font-f1 font-bold text-center uppercase text-blue-400 font-mono">
                            {row.fastest_lap || '-'}
                          </td>
                        )}
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={15} className="py-12 text-center text-[10px] text-slate-500 uppercase font-f1 italic">Nog geen data beschikbaar</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {!isLocked(activeTab) && (
              <div className="mt-6 flex items-center justify-center gap-3">
                <div className="h-[1px] w-8 bg-slate-800" />
                <span className="text-[8px] font-f1 text-slate-500 uppercase tracking-widest italic animate-pulse">Scroll or swipe to see full grid →</span>
                <div className="h-[1px] w-8 bg-slate-800" />
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

// Sub-components
function LiveCard({ title, subtitle, href, accentColor }: { title: string, subtitle: string, href: string, accentColor: string }) {
  return (
    <Link href={href} className="group block relative">
      <div className="relative p-[1px] rounded-2xl overflow-hidden transition-all duration-500">
        <div className="absolute inset-0 opacity-20 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `conic-gradient(from_180deg_at_0%_50%, ${accentColor} 0deg, ${accentColor} 40deg, transparent_90deg)` }} />
        <div className="relative bg-[#161a23] p-6 rounded-[calc(1rem-1px)] transition-colors group-hover:bg-[#1c222d]">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-f1 font-black italic uppercase leading-none mb-1 text-white group-hover:text-[#005AFF] transition-colors">{title}</h2>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-[#005AFF] animate-pulse"></span>
                <p className="text-slate-500 text-[9px] font-f1 uppercase tracking-[0.2em]">{subtitle}</p>
              </div>
            </div>
            <span className="text-[#005AFF] text-2xl font-f1 font-black italic opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">→</span>
          </div>
          <div className="absolute bottom-0 left-6 right-6 h-[2px] transition-transform duration-500 scale-x-0 group-hover:scale-x-100" style={{ backgroundColor: accentColor }} />
        </div>
      </div>
    </Link>
  );
}

function PredictionCard({ title, subtitle, href, isDone, accentColor }: { title: string, subtitle: string, href: string, isDone: boolean, accentColor: string }) {
  return (
    <Link href={href} className="group block relative">
      <div className="relative p-[1px] rounded-2xl overflow-hidden transition-all duration-500">
        <div className="absolute inset-0 bg-[conic-gradient(from_180deg_at_0%_50%,#e10600_0deg,#e10600_40deg,transparent_90deg)] opacity-20 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative bg-[#161a23] p-6 rounded-[calc(1rem-1px)] transition-colors group-hover:bg-[#1c222d]">
          <div className="flex justify-between items-center">
            <div>
              <h2 className={`text-2xl font-f1 font-black italic uppercase leading-none mb-1 transition-colors ${isDone ? 'text-green-500' : 'text-white group-hover:text-[#e10600]'}`}>{title}</h2>
              <p className="text-slate-500 text-[9px] font-f1 uppercase tracking-[0.2em]">{subtitle}</p>
            </div>
            {isDone ? (
              <div className="flex items-center gap-2">
                <span className="font-f1 text-[10px] text-green-500 font-bold italic tracking-tighter uppercase">Ready</span>
                <div className="text-green-500">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
              </div>
            ) : (
              <span className="text-[#e10600] text-2xl font-f1 font-black italic opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">→</span>
            )}
          </div>
          <div className={`absolute bottom-0 left-6 right-6 h-[2px] transition-transform duration-500 scale-x-0 group-hover:scale-x-100 ${isDone ? 'bg-green-500' : accentColor}`} />
        </div>
      </div>
    </Link>
  );
}