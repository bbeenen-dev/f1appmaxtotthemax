import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminExportPage(props: any) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const raceId = params?.id;
  const type = searchParams?.type || 'race';

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
      },
    }
  );

  try {
    const { data: race } = await supabase.from('races').select('race_name').eq('id', raceId).single();
    const tableName = type === 'qualy' ? 'predictions_qualifying' : type === 'sprint' ? 'predictions_sprint' : 'predictions_race';
    
    const { data: rawPredictions, error: predError } = await supabase
      .from(tableName)
      .select('*')
      .eq('race_id', raceId);

    if (predError) throw new Error(predError.message);

    const userIds = rawPredictions?.map(p => p.user_id) || [];
    const { data: profiles } = await supabase.from('profiles').select('id, username').in('id', userIds);

    return (
      <div className="min-h-screen bg-white text-black p-10 font-sans print:p-0">
        <header className="border-b-4 border-black pb-4 mb-8 flex justify-between items-end">
          <h1 className="text-2xl font-black uppercase italic">{race?.race_name || 'RACE'} - {type.toUpperCase()}</h1>
          <button onClick={() => window.print()} className="bg-black text-white px-4 py-2 text-[10px] font-black uppercase print:hidden">Print</button>
        </header>

        <div className="space-y-8">
          {rawPredictions?.map((pred: any) => {
            const nickname = profiles?.find(p => p.id === pred.user_id)?.username || 'Onbekende Deelnemer';
            
            // EXTREEM VEILIGE DATA-EXTRACTIE
            let list: string[] = [];
            if (type === 'qualy') list = Array.isArray(pred.top_3_drivers) ? pred.top_3_drivers : [];
            else if (type === 'sprint') list = Array.isArray(pred.top_8_drivers) ? pred.top_8_drivers : [];
            else {
              const t10 = Array.isArray(pred.top_10_drivers) ? pred.top_10_drivers : [];
              const b12 = Array.isArray(pred.bottom_12_drivers) ? pred.bottom_12_drivers : [];
              list = [...t10, ...b12];
            }

            return (
              <div key={pred.id} className="border-t-2 border-black pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-black uppercase text-lg italic">{nickname}</span>
                  <span className="text-[9px] font-mono text-gray-400">
                    Update: {pred.updated_at ? new Date(pred.updated_at).toLocaleTimeString() : '-'}
                  </span>
                </div>
                
                {/* Geen complexe grid, maar simpele tekst-blokjes met positienummer */}
                <div className="flex flex-wrap gap-2">
                  {list.length > 0 ? list.map((driver, i) => (
                    <div key={i} className="border border-gray-200 px-2 py-1 bg-gray-50 rounded min-w-[60px]">
                      <p className="text-[7px] font-bold text-blue-600 leading-none">P{i+1}</p>
                      <p className="text-[10px] font-black uppercase leading-tight">{driver || '???'}</p>
                    </div>
                  )) : <p className="text-red-500 italic text-xs">Geen data beschikbaar</p>}
                  
                  {type === 'race' && pred.fastest_lap_driver && (
                    <div className="border border-blue-600 px-2 py-1 bg-blue-50 rounded">
                      <p className="text-[7px] font-bold text-blue-600 leading-none">FL</p>
                      <p className="text-[10px] font-black uppercase leading-tight">{pred.fastest_lap_driver}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  } catch (err: any) {
    return <div className="p-20 text-red-500 bg-white">Render Error: {err.message}</div>;
  }
}