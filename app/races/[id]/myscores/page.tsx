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
      const sPredArr = sP.data?.top_8_drivers || [];
      const sResArr = sR.data?.top_8_drivers || [];
      if (sPredArr.length > 0) {
        finalSections.push({
          title: "Sprint Race",
          totalPoints: sS.data?.points || 0,
          rows: sPredArr.map((d: string, i: number) => ({
            posLabel: `P${i + 1}`,
            prediction: d,
            actual: sResArr[i] || "-",
            points: d === sResArr[i] ? 1 : 0
          }))
        });
      }

      // KWALIFICATIE - FIX HIER:
      const qPredArr = qP.data?.top_3_drivers || [];
      const qResArr = qR.data?.top_3_drivers || [];
      if (qPredArr.length > 0) {
        finalSections.push({
          title: "Kwalificatie",
          totalPoints: qS.data?.points || 0,
          rows: qPredArr.map((d: string, i: number) => ({
            posLabel: `P${i + 1}`,
            prediction: d,
            actual: qResArr[i] || "-",
            points: d === qResArr[i] ? 3 : 0
          }))
        });
      }

      // HOOFDRACE
      const rPredArr = rP.data?.top_10_drivers || [];
      const rResArr = rR.data?.top_10_drivers || [];
      const p11Res = rR.data?.p11_driver;
      if (rPredArr.length > 0) {
        finalSections.push({
          title: "Hoofdrace",
          totalPoints: rS.data?.points || 0,
          rows: rPredArr.map((d: string, i: number) => {
            const predPos = i + 1;
            const actualPos = rResArr.indexOf(d) + 1;
            
            let p = 0;
            if (d === rResArr[i]) p = 5;
            else if (actualPos > 0 && Math.abs(predPos - actualPos) === 1) p = 2;
            else if (predPos === 10 && d === p11Res) p = 2;

            return {
              posLabel: `P${predPos}`,
              prediction: d,
              actual: rResArr[i] || "-",
              points: p
            };
          })
        });
      }

      setSections(finalSections);
      setLoading(false);
    }
    fetchData();
  }, [raceId, supabase]);

  if (loading) return <div className="min-h-screen bg-[#0f111a] flex items-center justify-center font-f1 italic text-[#e10600]">RESULTATEN LADEN...</div>;

  return (
    <div className="min-h-screen bg-[#0f111a] text-white p-4 font-f1 pb-20">
      <div className="max-w-xl mx-auto">
        <Link href={`/races/${raceId}`} className="text-[#e10600] italic uppercase text-[10px] mb-6 block border border-[#e10600]/20 w-fit px-3 py-1 rounded-full">
          ← Terug naar Race
        </Link>
        
        <h1 className="text-3xl font-black italic uppercase mb-10 border-l-4 border-[#e10600] pl-4">{raceName}</h1>

        <div className="space-y-12">
          {sections.map((section, idx) => (
            <section key={idx}>
              <div className="flex justify-between items-end mb-3 px-2">
                <h2 className="text-lg font-black italic uppercase">{section.title}</h2>
                <span className="text-xl font-black italic text-[#e10600]">{section.totalPoints} PT</span>
              </div>

              <div className="bg-[#161a23] rounded-2xl overflow-hidden border border-white/5 shadow-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[10px] uppercase text-slate-500 bg-white/5">
                      <th className="p-4 w-16">Pos</th>
                      <th className="p-4">Voorspelling</th>
                      <th className="p-4 text-center w-24">Punten</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {section.rows.map((row, i) => (
                      <tr key={i} className="text-sm">
                        <td className="p-4 font-black text-slate-600 italic text-xs tracking-tighter">{row.posLabel}</td>
                        <td className="p-4 uppercase font-bold italic">
                          <span className={row.points > 0 ? "text-white" : "text-slate-500"}>{row.prediction}</span>
                          <div className="text-[9px] text-white/10 font-normal not-italic lowercase">Uitslag: {row.actual}</div>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`font-black italic ${row.points > 0 ? 'text-green-500' : 'text-slate-800'}`}>
                            {row.points > 0 ? `+${row.points}` : '0'}
                          </span>
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