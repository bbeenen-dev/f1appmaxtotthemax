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
    // 1. Haal race info op
    const { data: race } = await supabase.from('races').select('race_name').eq('id', raceId).single();

    // 2. Bepaal tabel
    let tableName = 'predictions_race';
    if (type === 'qualy') tableName = 'predictions_qualifying';
    if (type === 'sprint') tableName = 'predictions_sprint';

    // 3. Haal voorspellingen op
    const { data: rawPredictions, error: pError } = await supabase
      .from(tableName)
      .select('*')
      .eq('race_id', raceId);

    if (pError) throw pError;

    // 4. Haal ALLEEN de profielen op die we nodig hebben (voorkomt wit scherm)
    const userIds = rawPredictions?.map(p => p.user_id) || [];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', userIds);

    return (
      <div className="min-h-screen bg-white text-black p-6 font-sans print:p-0">
        <header className="border-b-4 border-black pb-4 mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-black uppercase italic leading-none">{race?.race_name || 'Race'}</h1>
            <p className="font-bold text-gray-400 uppercase text-[9px] tracking-widest mt-2 italic">
              {type.toUpperCase()} GRID • 2026
            </p>
          </div>
          <button onClick={() => window.print()} className="bg-black text-white px-4 py-2 text-[10px] font-black uppercase rounded print:hidden">
            Print / PDF
          </button>
        </header>

        <div className="space-y-6">
          {rawPredictions?.map((pred: any) => {
            const nickname = profiles?.find(p => p.id === pred.user_id)?.username || 'Onbekend';
            const lastUpdate = pred.updated_at ? new Date(pred.updated_at).toLocaleString('nl-NL', {
              day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
            }) : '-';

            let drivers: string[] = [];
            if (type === 'qualy') drivers = pred.top_3_drivers || [];
            else if (type === 'sprint') drivers = pred.top_8_drivers || [];
            else drivers = [...(pred.top_10_drivers || []), ...(pred.bottom_12_drivers || [])];

            return (
              <div key={pred.id} className="border-2 border-black rounded shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] break-inside-avoid">
                <div className="bg-black text-white p-2 flex justify-between items-center px-4">
                  <span className="font-black uppercase italic">{nickname}</span>
                  <span className="text-[9px] font-mono">Update: {lastUpdate}</span>
                </div>
                
                <div className="p-3 grid grid-cols-5 sm:grid-cols-11 gap-1">
                  {drivers.map((d, i) => (
                    <div key={i} className="border border-gray-200 bg-gray-50 flex flex-col items-center py-1 rounded">
                      <span className="text-[7px] font-bold text-blue-600">P{i+1}</span>
                      <span className="text-[10px] font-black uppercase">{d || '-'}</span>
                    </div>
                  ))}
                  {type === 'race' && pred.fastest_lap_driver && (
                    <div className="border border-blue-500 bg-blue-50 flex flex-col items-center py-1 rounded">
                      <span className="text-[7px] font-bold text-blue-600">FL</span>
                      <span className="text-[10px] font-black uppercase text-blue-700">{pred.fastest_lap_driver}</span>
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
    return <div className="p-20 bg-white text-red-500 font-mono">Render Error: {err.message}</div>;
  }
}