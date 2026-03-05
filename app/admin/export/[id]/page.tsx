import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';

export const dynamic = "force-dynamic";

export default async function AdminExportPage(props: any) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  
  const raceId = params?.id;
  const type = searchParams?.type || 'race';

  if (!raceId) {
    return <div className="p-20 bg-white text-black">Geen Race ID.</div>;
  }

  const supabase = await createClient();

  // 1. Haal de data op in losse stappen met extra checks
  const { data: race } = await supabase.from('races').select('race_name').eq('id', raceId).single();

  let tableName = 'predictions_race';
  if (type === 'qualy') tableName = 'predictions_qualifying';
  if (type === 'sprint') tableName = 'predictions_sprint';

  const { data: rawPredictions, error: predError } = await supabase
    .from(tableName)
    .select('*')
    .eq('race_id', raceId);

  if (predError) return <div className="p-20 bg-white text-red-500">DB Fout: {predError.message}</div>;

  // 2. Haal profielen op
  const userIds = rawPredictions?.map(p => p.user_id) || [];
  const { data: profiles } = await supabase.from('profiles').select('id, username').in('id', userIds);

  return (
    <div className="min-h-screen bg-white text-black p-8 font-sans print:p-0">
      <header className="border-b-4 border-black pb-4 mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black uppercase italic">{race?.race_name || 'Race'}</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{type} OVERZICHT 2026</p>
        </div>
        <button onClick={() => window.print()} className="print:hidden bg-black text-white px-6 py-2 rounded-lg font-bold uppercase text-[10px]">
          Opslaan als PDF
        </button>
      </header>

      <div className="space-y-6">
        {rawPredictions?.map((pred: any) => {
          const username = profiles?.find(p => p.id === pred.user_id)?.username || 'Onbekend';
          
          // VEILIGE DATA VERZAMELING
          let drivers: string[] = [];
          try {
            if (type === 'qualy') drivers = Array.isArray(pred.top_3_drivers) ? pred.top_3_drivers : [];
            else if (type === 'sprint') drivers = Array.isArray(pred.top_8_drivers) ? pred.top_8_drivers : [];
            else {
                const t10 = Array.isArray(pred.top_10_drivers) ? pred.top_10_drivers : [];
                const b12 = Array.isArray(pred.bottom_12_drivers) ? pred.bottom_12_drivers : [];
                drivers = [...t10, ...b12];
            }
          } catch (e) { drivers = []; }

          return (
            <div key={pred.id} className="border-2 border-black p-4 rounded-xl break-inside-avoid">
              <div className="flex justify-between border-b mb-3 pb-1 border-gray-100">
                <span className="font-black uppercase italic">{username}</span>
                {type === 'race' && <span className="text-[10px] font-bold italic">FL: {pred.fastest_lap_driver || '-'}</span>}
              </div>
              
              <div className="flex flex-wrap gap-1">
                {drivers.length > 0 ? drivers.map((d, i) => (
                  <div key={i} className="border border-gray-100 bg-gray-50 px-2 py-1 rounded flex flex-col items-center min-w-[45px]">
                    <span className="text-[6px] text-gray-400 font-bold">P{i+1}</span>
                    <span className="text-[9px] font-black uppercase">{d || '?'}</span>
                  </div>
                )) : <span className="text-[10px] text-red-500 italic">Geen coureurs ingevuld</span>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 print:hidden">
        <Link href="/admin" className="text-gray-400 text-[10px] font-bold uppercase underline">← Terug naar dashboard</Link>
      </div>
    </div>
  );
}