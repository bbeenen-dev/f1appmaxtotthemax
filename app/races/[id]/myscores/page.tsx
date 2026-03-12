"use client";

import { use, useEffect, useState, useMemo } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

export const dynamic = "force-dynamic";

interface ScoreRow {
  posLabel: string;
  prediction: string;
  actual: string;
  points: number;
}

interface ScoreSection {
  title: string;
  rows: ScoreRow[];
  totalPoints: number;
}

export default function MyScoresPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const raceId = resolvedParams.id;
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  const [sections, setSections] = useState<ScoreSection[]>([]);
  const [raceName, setRaceName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const [race, qP, qR, rP, rR, sP, sR, qS, rS, sS] = await Promise.all([
        supabase.from('races').select('race_name').eq('id', raceId).single(),
        supabase.from('predictions_qualifying').select('top_3_drivers').eq('race_id', raceId).eq('user_id', session.user.id).maybeSingle(),
        supabase.from('results_qualifying').select('top_3_drivers').eq('race_id', raceId).maybeSingle(),
        supabase.from('predictions_race').select('top_10_drivers').eq('race_id', raceId).eq('user_id', session.user.id).maybeSingle(),
        supabase.from('results_race').select('top_10_drivers, p11_driver').eq('race_id', raceId).maybeSingle(),
        supabase.from('predictions_sprint').select('top_8_drivers').eq('race_id', raceId).eq('user_id', session.user.id).maybeSingle(),
        supabase.from('results_sprint').select('top_8_drivers').eq('race_id', raceId).maybeSingle(),
        supabase.from('scores_qualifying').select('points').eq('race_id', raceId).eq('user_id', session.user.id).maybeSingle(),
        supabase.from('scores_race').select('points').eq('race_id', raceId).eq('user_id', session.user.id).maybeSingle(),
        supabase.from('scores_sprint').select('points').eq('race_id', raceId).eq('user_id', session.user.id).maybeSingle(),
      ]);

      if (race.data) setRaceName(race.data.race_name);

      const finalSections: ScoreSection[] = [];

      // SPRINT
      if (sP.data?.top_8_drivers) {
        const res = sR.data?.top_8_drivers || [];
        finalSections.push({
          title: "Sprint Race",
          totalPoints: sS.data?.points || 0,
          rows: sP.data.top_8_drivers.map((d: string, i: number) => ({
            posLabel: `P${i + 1}`,
            prediction: d,
            actual: res[i] || "-",
            points: d === res[i] ? 1 : 0
          }))
        });
      }

      // KWALIFICATIE
      if (qP.data?.top_3_drivers) {
        const res = qR.data?.top_3_drivers || [];
        finalSections.push({
          title: "Kwalificatie",
          totalPoints: qS.data?.points || 0,
          rows: qP.data.top_3_drivers.map((d: string, i: number) => ({
            posLabel: `P${i + 1}`,
            prediction: d,
            actual: res[i] || "-",
            points: d === res[i] ? 3 : 0
          }))
        });
      }

      // HOOFDRACE
      if (rP.data?.top_10_drivers) {
        const res = rR.data?.top_10_drivers || [];
        const p11Res = rR.data?.p11_driver;
        
        const raceRows: ScoreRow[] = rP.data.top_10_drivers.map((d: string, i: number) => {
          const predPos = i + 1;
          const actualPos = res.indexOf(d) + 1;
          
          let p = 0;
          if (d === res[i]) {
            p = 5;
          } else if (actualPos > 0 && Math.abs(predPos - actualPos) === 1) {
            p = 2;
          } else if (predPos === 10 && d === p11Res) {
            p = 2; // P11 correctie
          }

          return {
            posLabel: `P${predPos}`,
            prediction: d,
            actual: res[i] || "-",
            points: p
          };
        });

        // P11 Informatieve rij toevoegen
        if (p11Res) {
          raceRows.push({
            posLabel: "P11",
            prediction: "-",
            actual: p11Res,
            points: 0
          });
        }

        finalSections.push({
          title: "Hoofdrace",
          totalPoints: rS.data?.points || 0,
          rows: raceRows
        });
      }

      setSections(finalSections);
      setLoading(false);
    }
    fetchData();
  }, [raceId, supabase]);

  if (loading) return <div className="min-h-screen bg-[#0f111a] flex items-center justify-center font-f1 italic text-[#e10600]">SCORES LADEN...</div>;

  return (
    <div className="min-h-screen bg-[#0f111a] text-white p-4 font-f1 pb-20">
      <div className="max-w-2xl mx-auto">
        <Link href={`/races/${raceId}`} className="text-[#e10600] italic uppercase text-[10px] mb-8 inline-block hover:opacity-70 transition-opacity tracking-widest">
          ← TERUG NAAR RACE
        </Link>
        
        <header className="mb-12 border-b-2 border-white/10 pb-6">
          <h1 className="text-4xl font-black italic uppercase text-white leading-none">{raceName}</h1>
          <p className="text-[#e10600] uppercase italic text-xs mt-2 tracking-widest font-bold">Mijn Resultaten</p>
        </header>

        <div className="space-y-16">
          {sections.map((section, idx) => (
            <section key={idx}>
              <div className="flex justify-between items-end mb-4 px-2">
                <h2 className="text-xl font-black italic uppercase tracking-tight text-white">{section.title}</h2>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Totaal Score</span>
                  <span className="text-3xl font-black italic text-[#e10600] leading-none">{section.totalPoints}</span>
                </div>
              </div>

              <div className="bg-[#161a23] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                <table className="w-full text-left table-fixed border-collapse">
                  <thead>
                    <tr className="text-[10px] uppercase text-slate-400 bg-white/5 border-b border-white/10">
                      <th className="p-4 w-20">Pos</th>
                      <th className="p-4 w-1/3">Voorspelling</th>
                      <th className="p-4 w-1/3">Uitslag</th>
                      <th className="p-4 text-right">Punten</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 uppercase italic font-bold">
                    {section.rows.map((row, i) => (
                      <tr key={i} className="hover:bg-white/[0.03] transition-colors">
                        <td className="p-4 text-white text-sm font-black italic">{row.posLabel}</td>
                        <td className="p-4 text-sm text-white tracking-wide">
                          {row.prediction}
                        </td>
                        <td className="p-4 text-sm text-slate-500 font-medium">
                          {row.actual}
                        </td>
                        <td className={`p-4 text-right font-black text-lg ${row.points > 0 ? 'text-green-500' : 'text-white/20'}`}>
                          {row.points > 0 ? `+${row.points}` : '0'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}