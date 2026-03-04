import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';

export default async function AdminExportPage({ params, searchParams }: any) {
  const { id: raceId } = await params;
  const { type } = await searchParams;
  const supabase = await createClient();

  const { data: race } = await supabase.from('races').select('*').eq('id', raceId).single();

  // Data ophalen op basis van type
  let data: any[] = [];
  if (type === 'qualy') {
    const res = await supabase.from('predictions_qualifying').select('*, profiles:user_id(username)').eq('race_id', raceId);
    data = res.data || [];
  } else if (type === 'sprint') {
    const res = await supabase.from('predictions_sprint').select('*, profiles:user_id(username)').eq('race_id', raceId);
    data = res.data || [];
  } else {
    const res = await supabase.from('predictions_race').select('*, profiles:user_id(username)').eq('race_id', raceId);
    data = res.data || [];
  }

  return (
    <div className="min-h-screen bg-white text-black p-10 font-sans">
      <div className="flex justify-between items-end border-b-4 border-black pb-4 mb-8">
        <div>
          <h1 className="text-3xl font-black uppercase italic">{race?.race_name}</h1>
          <p className="font-bold text-gray-500 uppercase text-xs">Export: {type || 'Race'} Grid</p>
        </div>
        <button onClick={() => window.print()} className="print:hidden bg-black text-white px-6 py-2 font-black uppercase italic rounded text-xs">Print PDF</button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {data.length === 0 ? (
          <p className="text-gray-400 italic">Geen voorspellingen gevonden voor dit onderdeel.</p>
        ) : data.map((pred) => (
          <div key={pred.id} className="border-2 border-black p-4 rounded-xl break-inside-avoid">
            <div className="flex justify-between border-b border-gray-200 mb-3 pb-1">
              <span className="font-black uppercase italic text-lg">{pred.profiles?.username}</span>
              {type === 'race' && <span className="font-bold text-xs uppercase">FL: {pred.fastest_lap_driver}</span>}
            </div>

            <div className="flex flex-wrap gap-2">
              {/* Logica voor weergave van de grid */}
              {(type === 'qualy' ? pred.top_3_drivers : 
                type === 'sprint' ? pred.top_8_drivers : 
                [...(pred.top_10_drivers || []), ...(pred.bottom_12_drivers || [])]).map((d: string, i: number) => (
                <div key={i} className="border border-gray-300 px-2 py-1 rounded min-w-[50px] text-center">
                  <div className="text-[7px] text-gray-400 font-bold uppercase">P{i+1}</div>
                  <div className="font-black text-sm">{d}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}