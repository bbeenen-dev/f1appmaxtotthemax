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
  qualifying_start: string | null;
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
  
  const [activeTab, setActiveTab] = useState<'sprint' | 'qualy' | 'race'>('qualy');
  const [gridData, setGridData] = useState<GridPrediction[]>([]);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // 1. Haal race info en eigen status op (slechts één keer bij laden)
  useEffect(() => {
    let isMounted = true;
    async function getInitialData() {
      if (!raceId || String(raceId).includes('%')) return;
      try {
        const { data: raceData } = await supabase
          .from('races')
          .select('id, race_name, city_name, sprint_race_start, qualifying_start, race_start, round')
          .eq('id', raceId)
          .single();

        if (isMounted && raceData) {
          setRace(raceData);
          // Alleen de tab op sprint zetten als die er is EN we nog op de standaard (qualy) staan
          if (raceData.sprint_race_start) {
            setActiveTab('sprint');
          }
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && isMounted) {
          const [q, s, r] = await Promise.all([
            supabase.from('predictions_qualifying').select('id').eq('race_id', raceId).eq('user_id', session.user.id).maybeSingle(),
            supabase.from('predictions_sprint').select('id').eq('race_id', raceId).eq('user_id', session.user.id).maybeSingle(),
            supabase.from('predictions_race').select('id').eq('race_id', raceId).eq('user_id', session.user.id).maybeSingle(),
          ]);
          setStatus({ qualy: !!q.data, sprint: !!s.data, race: !!r.data });
        }
      } catch (err: any) {
        if (isMounted) setDbError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    getInitialData();
    return () => { isMounted = false; };
  }, [raceId, supabase]);

  // 2. Haal grid data op (telkens als de tab verandert)
  useEffect(() => {
    let isMounted = true;
    async function getGridData() {
      if (!raceId) return;
      try {
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
      } catch (e) {}
    }
    getGridData();
    return () => { isMounted = false; };
  }, [activeTab, raceId, supabase]);

  const isLocked = (tab: 'sprint' | 'qualy' | 'race') => {
    if (!race) return true;
    const startTime = tab === 'qualy' ? race.qualifying_start : tab === 'sprint' ? race.sprint_race_start : race.race_start;
    if (!startTime) return true;
    return new Date(startTime) > now;
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0f111a] flex items-center justify-center">
      <div className="text-[#e10600] font-f1 font-black italic animate-pulse text-2xl tracking-widest uppercase text-center">Loading...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f111a] text-white p-4 md:p-8 pb-32 overflow-x-hidden">
      <div className="max-w-2xl mx-auto">
        
        <Link href="/races" className="group flex items-center gap-2 text-slate-500 text-[10px] font-f1 uppercase mb-6 tracking-[0.2em] hover:text-[#e10600]">
          <span className="text-lg transition-transform group-hover:-translate-x-1">←</span> Kalender
        </Link>

        <header className="mb-8">
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-[#e10600] font-f1 font-black italic text-xl uppercase tracking-tighter">Round {race?.round}</span>
            <div className="h-[2px] flex-grow bg-slate-800/50"></div>
          </div>
          <h1 className="text-5xl md:text-6xl font-f1 font-black italic uppercase text-white leading-none tracking-tighter italic">{race?.race_name}</h1>
          <p className="text-slate-400 text-xs font-f1 uppercase tracking-[0.3em] mt-3 italic">{race?.city_name}</p>
        </header>

        <div className="grid gap-4 mb-4">
          {race?.sprint_race_start && (
            <PredictionCard title="Sprint Race" href={`/races/${raceId}/predict/sprint`} isDone={status.sprint} accentColor="bg-orange-500" />
          )}
          <PredictionCard title="Qualifying" href={`/races/${raceId}/predict/qualy`} isDone={status.qualy} accentColor="bg-red-600" />
          <PredictionCard title="Grand Prix" href={`/races/${raceId}/predict/race`} isDone={status.race} accentColor="bg-[#e10600]" />
          <LiveCard title="Live Tracker" href={`/races/${raceId}/live`} accentColor="#005AFF" />
        </div>

        <section className="mt-8 bg-[#161a23] rounded-2xl p-4 md:p-6 border border-slate-800/50 shadow-2xl relative w-[96vw] ml-[calc(50%-48vw)] md:w-full md:ml-0">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-f1 font-black italic uppercase tracking-tighter text-white">Voorspellingen</h2>
            
            <div className="flex gap-1 bg-[#0f111a] p-1 rounded-full border border-slate-800">
              {(['sprint', 'qualy', 'race'] as const).map((t) => (
                (t !== 'sprint' || race?.sprint_race_start) && (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    className={`px-4 py-2 rounded-full text-[11px] font-f1 font-black uppercase transition-all flex items-center gap-1.5 ${activeTab === t ? 'bg-[#e10600] text-white shadow-lg scale-105' : 'text-slate-500 hover:text-white'}`}
                  >
                    {isLocked(t) && <span className="text-[12px]">🔒</span>}
                    {t}
                  </button>
                )
              ))}
            </div>
          </div>

          {isLocked(activeTab) ? (
            <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-xl bg-[#0f111a]/50">
              <div className="text-2xl mb-2 opacity-30 text-slate-400">🔒</div>
              <h3 className="text-[13px] font-f1 font-black uppercase italic text-slate-400 tracking-widest text-center px-4">
                Beschikbaar vanaf start sessie
              </h3>
            </div>
          ) : (
            <div className="relative overflow-x-auto scrollbar-hide -mx-2 px-2">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="sticky left-0 z-20 bg-[#161a23] px-3 py-3 text-[9px] font-f1 uppercase text-slate-500 min-w-[110px] shadow-[8px_0_12px_-5px_rgba(0,0,0,0.4)]">Deelnemer</th>
                    {gridData[0]?.drivers.map((_, i) => (
                      <th key={i} className="px-3 py-3 text-[9px] font-f1 uppercase text-[#e10600] text-center min-w-[65px]">P{i+1}</th>
                    ))}
                    {activeTab === 'race' && <th className="px-3 py-3 text-[9px] font-f1 uppercase text-blue-500 text-center min-w-[65px]">F-Lap</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/20">
                  {gridData.map((row) => (
                    <tr key={row.user_id} className="group hover:bg-white/5 transition-colors">
                      <td className="sticky left-0 z-20 bg-[#161a23] px-3 py-4 text-xs font-f1 font-black italic uppercase text-white truncate border-r border-slate-800/30 shadow-[8px_0_12px_-5px_rgba(0,0,0,0.4)] group-hover:text-[#e10600]">
                        {row.nickname}
                      </td>
                      {row.drivers.map((d, i) => (
                        <td key={i} className="px-3 py-4 text-[10px] font-f1 font-bold text-center uppercase text-slate-400">{d || '-'}</td>
                      ))}
                      {activeTab === 'race' && (
                        <td className="px-3 py-4 text-[10px] font-f1 font-bold text-center uppercase text-blue-400">{row.fastest_lap || '-'}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function LiveCard({ title, href, accentColor }: { title: string, href: string, accentColor: string }) {
  return (
    <Link href={href} className="group block relative">
      <div className="relative p-[1px] rounded-xl overflow-hidden transition-all duration-500">
        <div className="absolute inset-0 opacity-10 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `conic-gradient(from_180deg_at_0%_50%, ${accentColor} 0deg, ${accentColor} 40deg, transparent_90deg)` }} />
        <div className="relative bg-[#161a23] p-5 rounded-[calc(0.75rem-1px)] transition-colors group-hover:bg-[#1c222d]">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-f1 font-black italic uppercase leading-none text-white group-hover:text-[#005AFF] transition-colors">{title}</h2>
            <span className="text-[#005AFF] text-xl font-f1 font-black italic opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">→</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function PredictionCard({ title, href, isDone, accentColor }: { title: string, href: string, isDone: boolean, accentColor: string }) {
  return (
    <Link href={href} className="group block relative">
      <div className="relative p-[1px] rounded-xl overflow-hidden transition-all duration-500">
        <div className="absolute inset-0 bg-[#e10600] opacity-5 group-hover:opacity-40 transition-opacity duration-500" />
        <div className="relative bg-[#161a23] p-5 rounded-[calc(0.75rem-1px)] transition-colors group-hover:bg-[#1c222d]">
          <div className="flex justify-between items-center">
            <h2 className={`text-xl font-f1 font-black italic uppercase leading-none transition-colors ${isDone ? 'text-green-500' : 'text-white group-hover:text-[#e10600]'}`}>{title}</h2>
            {isDone ? (
              <div className="text-green-500">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
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