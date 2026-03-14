"use client";

import { use, useEffect, useState, useMemo, Fragment } from 'react';
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

interface GridPrediction {
  user_id: string;
  nickname: string;
  drivers: string[];
  fastest_lap?: string;
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
  const [isChangingTab, setIsChangingTab] = useState(false);
  const [status, setStatus] = useState({ qualy: false, sprint: false, race: false });
  
  // States voor resultaat-checks per sessie
  const [resultsAvailable, setResultsAvailable] = useState({ qualy: false, sprint: false, race: false });
  const [hasAnyResults, setHasAnyResults] = useState(false);
  const [isWeekendFinished, setIsWeekendFinished] = useState(false);

  const [activeTab, setActiveTab] = useState<'sprint' | 'qualy' | 'race'>('qualy');
  const [gridData, setGridData] = useState<GridPrediction[]>([]);
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
        
        // Check per sessie of er resultaten zijn
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
        
        // Weekend is pas klaar als alles wat moet gebeuren ook een resultaat heeft
        setIsWeekendFinished(qDone && rDone && (needsSprint ? sDone : true));
        
        if (raceData.sprint_race_start) {
          setActiveTab('sprint');
        } else {
          setActiveTab('qualy');
        }
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

  useEffect(() => {
    async function fetchGrid() {
      const startTime = activeTab === 'qualy' ? race?.qualifying_start : activeTab === 'sprint' ? race?.sprint_race_start : race?.race_start;
      const isStarted = startTime && new Date(startTime) <= new Date();
      if (!isStarted) { setGridData([]); return; }

      setIsChangingTab(true);
      const tableName = activeTab === 'qualy' ? 'predictions_qualifying' : activeTab === 'sprint' ? 'predictions_sprint' : 'predictions_race';
      const { data: preds } = await supabase.from(tableName).select('*').eq('race_id', raceId);
      
      if (preds) {
        const userIds = preds.map(p => p.user_id);
        const { data: profiles } = await supabase.from('profiles').select('id, nickname').in('id', userIds);
        const formatted = preds.map(p => ({
          user_id: p.user_id,
          nickname: profiles?.find(prof => prof.id === p.user_id)?.nickname || 'Anoniem',
          drivers: activeTab === 'qualy' ? (p.top_3_drivers || []) : activeTab === 'sprint' ? (p.top_8_drivers || []) : [...(p.top_10_drivers || []), ...(p.bottom_12_drivers || [])],
          fastest_lap: p.fastest_lap_driver
        }));
        setGridData(formatted);
      }
      setIsChangingTab(false);
    }
    if (race?.id) fetchGrid();
  }, [activeTab, race?.id, raceId, supabase]);

  const isLocked = (tab: 'sprint' | 'qualy' | 'race') => {
    if (!race) return true;
    const startTime = tab === 'qualy' ? race.qualifying_start : tab === 'sprint' ? race.sprint_race_start : race.race_start;
    return !startTime || new Date(startTime) > now;
  };

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

        {/* SUBTIELE SCORE KNOP */}
        {hasAnyResults && (
          <Link 
            href={`/races/${raceId}/myscores`}
            className="w-full mb-8 group relative block"
          >
            <div className="absolute inset-0 bg-green-500/5 blur-xl group-hover:bg-green-500/10 transition-all duration-500" />
            
            <div className="relative bg-[#161a23] border border-green-500/20 group-hover:border-green-500/50 p-5 rounded-2xl transition-all duration-300 shadow-2xl overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                    <span className="text-4xl italic font-black font-f1">F1</span>
                </div>
                
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300 border border-green-500/20">
                    🏆
                  </div>
                  <div className="text-left">
                    <span className="block text-white font-f1 font-black italic uppercase text-xl leading-none mb-1 group-hover:text-green-400 transition-colors">
                      Uitslagen en mijn scores
                    </span>
                    <span className="block text-slate-500 font-f1 uppercase text-[10px] tracking-widest italic font-bold">
                      {isWeekendFinished ? "Volledig weekend afgerond" : "Voor zover bekend"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <span className="hidden sm:inline text-green-500/50 group-hover:text-green-400 font-f1 font-black italic text-xs transition-all transform group-hover:translate-x-1">DETAILS →</span>
                   <span className="sm:hidden text-green-400 text-xl">→</span>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* ACTIEVE VOORSPELLINGEN */}
        <div className="grid gap-4 mb-8">
          {!resultsAvailable.sprint && renderCard('sprint')}
          {!resultsAvailable.qualy && renderCard('qualy')}
          {!resultsAvailable.race && renderCard('race')}
          
          {!isWeekendFinished && (
            <LiveCard title="Live Tracker" subtitle="REAL-TIME • Virtuele Stand" href={`/races/${raceId}/live`} accentColor="#005AFF" />
          )}
        </div>

        <section className="bg-[#161a23] rounded-2xl p-4 md:p-6 border border-slate-800/50 w-[96vw] ml-[calc(50%-48vw)] md:w-full md:ml-0">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-f1 font-black italic uppercase text-white">Voorspellingen</h2>
            <div className="flex gap-1 bg-[#0f111a] p-1 rounded-full border border-slate-800">
              {(['sprint', 'qualy', 'race'] as const).map((t) => (
                (t !== 'sprint' || race?.sprint_race_start) && (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    className={`px-4 py-2 rounded-full text-[11px] font-f1 font-black uppercase transition-all flex items-center gap-1.5 ${activeTab === t ? 'bg-[#e10600] text-white shadow-lg scale-105' : 'text-slate-500 hover:text-white'}`}
                  >
                    {isLocked(t) && <span>🔒</span>} {t}
                  </button>
                )
              ))}
            </div>
          </div>

          <div className={`transition-opacity duration-300 ${isChangingTab ? 'opacity-50' : 'opacity-100'}`}>
            {isLocked(activeTab) ? (
              <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-xl bg-[#0f111a]/50">
                <span className="text-2xl mb-2 opacity-30">🔒</span>
                <h3 className="text-[13px] font-f1 font-black uppercase italic text-slate-400 text-center px-4">Beschikbaar vanaf start sessie</h3>
              </div>
            ) : (
              <div className="relative overflow-x-auto scrollbar-hide -mx-2 px-2">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="sticky left-0 z-20 bg-[#161a23] px-3 py-4 text-xs font-f1 uppercase text-slate-500 min-w-[120px] shadow-[8px_0_12px_-5px_rgba(0,0,0,0.4)]">Deelnemer</th>
                      {gridData[0]?.drivers.map((_, i) => (
                        <th key={i} className="px-3 py-4 text-xs font-f1 uppercase text-[#e10600] text-center font-black min-w-[70px]">P{i+1}</th>
                      ))}
                      {activeTab === 'race' && <th className="px-3 py-4 text-xs font-f1 uppercase text-blue-500 text-center font-black min-w-[70px]">F-Lap</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/20">
                    {gridData.length > 0 ? gridData.map((row) => (
                      <tr key={row.user_id} className="group hover:bg-white/5 transition-colors">
                        <td className="sticky left-0 z-20 bg-[#161a23] px-3 py-5 text-sm font-f1 font-black italic uppercase text-white truncate border-r border-slate-800/30 shadow-[8px_0_12px_-5px_rgba(0,0,0,0.4)] group-hover:text-[#e10600]">
                          {row.nickname}
                        </td>
                        {row.drivers.map((d, i) => (
                          <td key={i} className="px-3 py-5 text-xs font-f1 font-bold text-center uppercase text-slate-300 tracking-wider">{d || '-'}</td>
                        ))}
                        {activeTab === 'race' && <td className="px-3 py-5 text-xs font-f1 font-bold text-center uppercase text-blue-400 tracking-wider">{row.fastest_lap || '-'}</td>}
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={15} className="py-10 text-center text-xs text-slate-500 font-f1 italic uppercase tracking-widest">Wachten op data...</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

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