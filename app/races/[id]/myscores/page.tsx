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
        supabase.from('results_race').select('top_11_drivers').eq('race_id', raceId).maybeSingle(),
        supabase.from('predictions_sprint').select('top_8_drivers').eq('race_id', raceId).eq('user_id', session.user.id).maybeSingle(),
        supabase.from('results_sprint').select('top_8_drivers').eq('race_id', raceId).maybeSingle(),
        supabase.from('scores_qualifying').select('points').eq('race_id', raceId).eq('user_id', session.user.id).maybeSingle(),
        supabase.from('scores_race').select('points').eq('race_id', raceId).eq('user_id', session.user.id).maybeSingle(),
        supabase.from('scores_sprint').select('points').eq('race_id', raceId).eq('user_id', session.user.id).maybeSingle(),
      ]);

      if (race.data) setRaceName(race.data.race_name);

      const finalSections: ScoreSection[] = [];

      if (sP.data?.top_8_drivers) {
        const res = sR.data?.top_8_drivers || [];
        finalSections.push({
          title: "Sprint Race",
          totalPoints: sS.data?.points || 0,
          rows: sP.data.top_8_drivers.map((d: string, i: number) => ({
            posLabel: `${i + 1}`,
            prediction: d,
            actual: res[i] || "-",
            points: d === res[i] ? 1 : 0
          }))
        });
      }

      if (qP.data?.top_3_drivers) {
        const res = qR.data?.top_3_drivers || [];
        finalSections.push({
          title: "Kwalificatie",
          totalPoints: qS.data?.points || 0,
          rows: qP.data.top_3_drivers.map((d: string, i: number) => ({
            posLabel: `${i + 1}`,
            prediction: d,
            actual: res[i] || "-",
            points: d === res[i] ? 3 : 0
          }))
        });
      }

      if (rP.data?.top_10_drivers) {
        const fullRes = rR.data?.top_11_drivers || [];
        const p11Res = fullRes[10];

        const raceRows: ScoreRow[] = rP.data.top_10_drivers.map((d: string, i: number) => {
          const predPos = i + 1;
          const actualPos = fullRes.indexOf(d) + 1;
          
          let p = 0;
          if (d === fullRes[i]) {
            p = 5;
          } else if (actualPos > 0 && Math.abs(predPos - actualPos) === 1) {
            p = 2;
          }

          return {
            posLabel: `${predPos}`,
            prediction: d,
            actual: fullRes[i] || "-",
            points: p
          };
        });

        if (p11Res) {
          raceRows.push({
            posLabel: "11",
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
    <div className="min-h-screen bg-[#0f111a] text-white p-4 font-f1 pb-20 uppercase">
      <div className="max-w-2xl mx-auto">
        <Link href={`/races/${raceId}`} className="text-[#e10600] italic uppercase text-[10px] mb-8 inline-block hover:opacity-70 transition-opacity tracking-widest">
          ← TERUG NAAR RACE
        </Link>
        
        <header className="mb-8 border-b-2 border-white/10 pb-6">
          <h1 className="text-3xl font-black italic text-white leading-none">{raceName}</h1>
          <p className="text-[#e10600] text-[10px] mt-2 tracking-widest font-bold">Mijn Resultaten</p>
        </header>

        <div className="space-y-12">
          {sections.map((section, idx) => (
            <section key={idx}>
              <div className="flex justify-between items-end mb-3 px-1">
                <h2 className="text-lg font-black italic tracking-tight text-white">{section.title}</h2>
                <div className="flex flex-col items-end">
                  <span className="text-[9px] text-slate-500 font-bold tracking-widest">TOTAAL</span>
                  <span className="text-2xl font-black italic text-[#e10600] leading-none">{section.totalPoints}</span>
                </div>
              </div>

              <div className="bg-[#161a23] rounded-xl overflow-hidden border border-white/10 shadow-2xl">
                <table className="w-full text-left table-fixed border-collapse">
                  <thead>
                    <tr className="text-[10px] text-slate-400 bg-white/5 border-b border-white/10">
                      <th className="py-3 px-2 w-10 text-center">#</th>
                      <th className="py-3 px-2 w-[40%]">VOORSPELLD</th>
                      <th className="py-3 px-2 w-[40%]">UITSLAG</th>
                      <th className="py-3 px-2 w-10 text-center text-[#e10600]">P</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 italic font-bold">
                    {section.rows.map((row, i) => (
                      <tr key={i} className="hover:bg-white/[0.03] transition-colors">
                        <td className="py-4 px-2 text-white text-xs font-black text-center">{row.posLabel}</td>
                        <td className="py-4 px-2 text-xs text-white tracking-tight truncate">
                          {row.prediction}
                        </td>
                        <td className="py-4 px-2 text-xs text-slate-500 font-medium truncate">
                          {row.actual}
                        </td>
                        <td className={`py-4 px-2 text-center font-black text-sm ${row.points > 0 ? 'text-green-500' : 'text-white/10'}`}>
                          {row.points > 0 ? row.points : '0'}
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