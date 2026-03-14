"use client";

import { use, useEffect, useState, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

interface GridPrediction {
  user_id: string;
  nickname: string;
  drivers: string[];
  fastest_lap?: string;
}

export default function GridPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const raceId = resolvedParams.id;
  const router = useRouter();
  
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  const [activeTab, setActiveTab] = useState<'sprint' | 'qualy' | 'race'>('qualy');
  const [gridData, setGridData] = useState<GridPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [race, setRace] = useState<any>(null);

  useEffect(() => {
    async function loadRace() {
      const { data } = await supabase.from('races').select('*').eq('id', raceId).single();
      setRace(data);
    }
    loadRace();
  }, [raceId, supabase]);

  useEffect(() => {
    async function fetchGrid() {
      if (!race) return;
      setLoading(true);
      
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
      setLoading(false);
    }
    fetchGrid();
  }, [activeTab, race, raceId, supabase]);

  const isLocked = (tab: 'sprint' | 'qualy' | 'race') => {
    if (!race) return true;
    const startTime = tab === 'qualy' ? race.qualifying_start : tab === 'sprint' ? race.sprint_race_start : race.race_start;
    return !startTime || new Date(startTime) > new Date();
  };

  return (
    <div className="min-h-screen bg-[#0f111a] text-white p-4">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => router.back()} className="mb-6 text-[#e10600] font-f1 font-black italic uppercase flex items-center gap-2">
          ← Terug naar Race
        </button>

        <header className="mb-8">
          <h1 className="text-3xl font-f1 font-black italic uppercase leading-tight">Voorspellingen Overzicht</h1>
          <p className="text-slate-400 text-sm font-f1 uppercase tracking-widest">{race?.race_name}</p>
        </header>

        <section className="bg-[#161a23] rounded-2xl p-4 md:p-6 border border-slate-800 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex gap-1 bg-[#0f111a] p-1 rounded-full border border-slate-800">
              {(['sprint', 'qualy', 'race'] as const).map((t) => (
                (t !== 'sprint' || race?.sprint_race_start) && (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    className={`px-4 py-2 rounded-full text-[11px] font-f1 font-black uppercase transition-all flex items-center gap-1.5 ${activeTab === t ? 'bg-[#e10600] text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                  >
                    {isLocked(t) && <span>🔒</span>} {t}
                  </button>
                )
              ))}
            </div>
          </div>

          <div className={`transition-opacity duration-300 ${loading ? 'opacity-50' : 'opacity-100'}`}>
            {isLocked(activeTab) ? (
              <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-xl">
                <span className="text-4xl mb-4">🔒</span>
                <p className="font-f1 font-black uppercase italic text-slate-500">Nog niet zichtbaar</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="sticky left-0 z-20 bg-[#161a23] px-3 py-4 text-xs font-f1 uppercase text-slate-500 min-w-[120px]">Deelnemer</th>
                      {gridData[0]?.drivers.map((_, i) => (
                        <th key={i} className="px-3 py-4 text-xs font-f1 uppercase text-[#e10600] text-center font-black min-w-[70px]">P{i+1}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/20">
                    {gridData.map((row) => (
                      <tr key={row.user_id} className="hover:bg-white/5 transition-colors">
                        <td className="sticky left-0 z-20 bg-[#161a23] px-3 py-5 text-sm font-f1 font-black italic uppercase text-white truncate border-r border-slate-800/30">
                          {row.nickname}
                        </td>
                        {row.drivers.map((d, i) => (
                          <td key={i} className="px-3 py-5 text-xs font-f1 font-bold text-center uppercase text-slate-300">{d || '-'}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}