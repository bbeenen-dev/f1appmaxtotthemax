import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';

export default async function AdminExportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: raceId } = await params;
  const supabase = await createClient();

  // Haal race details en alle voorspellingen op
  const [raceRes, racePreds, qualyPreds, sprintPreds] = await Promise.all([
    supabase.from('races').select('race_name, city_name').eq('id', raceId).single(),
    supabase.from('predictions_race').select('*, profiles:user_id(username)').eq('race_id', raceId),
    supabase.from('predictions_qualifying').select('*, profiles:user_id(username)').eq('race_id', raceId),
    supabase.from('predictions_sprint').select('*, profiles:user_id(username)').eq('race_id', raceId),
  ]);

  const race = raceRes.data;

  return (
    <div className="min-h-screen bg-white text-black p-4 md:p-10 font-sans print:p-0">
      <header className="border-b-4 border-black pb-4 mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black uppercase italic leading-none">{race?.race_name}</h1>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{race?.city_name} • 2026 Prediction Export</p>
        </div>
        <button onClick={() => window.print()} className="print:hidden bg-black text-white px-4 py-2 text-[10px] font-black uppercase italic rounded">
          Download PDF
        </button>
      </header>

      <div className="space-y-12">
        {/* RACE VOORSPELLINGEN (22 POSITIES) */}
        <section>
          <h2 className="text-xl font-black uppercase italic mb-4 bg-black text-white px-3 py-1 inline-block">Grand Prix • Top 22</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {racePreds.data?.map((pred) => (
              <div key={pred.user_id} className="border-2 border-black p-4 rounded-lg break-inside-avoid">
                <div className="flex justify-between items-center mb-3 border-b border-black pb-1">
                  <span className="font-black uppercase italic">{pred.profiles?.username}</span>
                  <span className="text-[10px] font-bold uppercase">FL: {pred.fastest_lap_driver}</span>
                </div>
                <div className="grid grid-cols-11 gap-1">
                  {pred.top_10_drivers.concat(pred.bottom_12_drivers || []).map((d: string, i: number) => (
                    <div key={i} className="flex flex-col items-center border border-gray-100 py-1">
                      <span className="text-[7px] text-gray-400 font-bold">P{i + 1}</span>
                      <span className="text-[10px] font-black">{d}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* QUALY & SPRINT COMPACT */}
        <div className="grid grid-cols-2 gap-8">
          <section>
            <h2 className="text-sm font-black uppercase italic mb-3 underline">Qualifying (Top 3)</h2>
            <div className="space-y-2">
              {qualyPreds.data?.map(p => (
                <div key={p.id} className="text-[10px] border-b border-gray-100 flex justify-between">
                  <span className="font-bold uppercase">{p.profiles?.username}</span>
                  <span className="font-black italic">{p.top_3_drivers?.join(' - ')}</span>
                </div>
              ))}
            </div>
          </section>

          {sprintPreds.data && sprintPreds.data.length > 0 && (
            <section>
              <h2 className="text-sm font-black uppercase italic mb-3 underline">Sprint (Top 8)</h2>
              <div className="space-y-2">
                {sprintPreds.data?.map(p => (
                  <div key={p.id} className="text-[10px] border-b border-gray-100 flex justify-between">
                    <span className="font-bold uppercase">{p.profiles?.username}</span>
                    <span className="font-black italic text-right">{p.top_8_drivers?.join(', ')}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}