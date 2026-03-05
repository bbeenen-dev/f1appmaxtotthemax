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
    // 1. Haal de data op
    const { data: race } = await supabase.from('races').select('race_name').eq('id', raceId).single();
    
    const tableName = type === 'qualy' ? 'predictions_qualifying' : type === 'sprint' ? 'predictions_sprint' : 'predictions_race';
    const { data: rawPredictions } = await supabase.from(tableName).select('*').eq('race_id', raceId);

    const userIds = rawPredictions?.map(p => p.user_id) || [];
    const { data: profiles } = await supabase.from('profiles').select('id, username').in('id', userIds);

    // 2. Data voorbereiden (zuiveren van vreemde objecten)
    const cleanPredictions = rawPredictions?.map(pred => {
      const profile = profiles?.find(p => p.id === pred.user_id);
      
      // Bepaal de lijst met coureurs
      let drivers: string[] = [];
      if (type === 'qualy') drivers = Array.isArray(pred.top_3_drivers) ? pred.top_3_drivers : [];
      else if (type === 'sprint') drivers = Array.isArray(pred.top_8_drivers) ? pred.top_8_drivers : [];
      else {
        const t10 = Array.isArray(pred.top_10_drivers) ? pred.top_10_drivers : [];
        const b12 = Array.isArray(pred.bottom_12_drivers) ? pred.bottom_12_drivers : [];
        drivers = [...t10, ...b12];
      }

      return {
        id: String(pred.id),
        username: String(profile?.username || 'Onbekend'),
        updated: pred.updated_at ? new Date(pred.updated_at).toLocaleTimeString('nl-NL') : '-',
        drivers: drivers.map(d => String(d || '-')),
        fastest_lap: pred.fastest_lap_driver ? String(pred.fastest_lap_driver) : null
      };
    }) || [];

    return (
      <div className="min-h-screen bg-white text-black p-8 font-sans">
        <header className="border-b-2 border-black pb-4 mb-8 flex justify-between items-center">
          <h1 className="text-xl font-black uppercase italic">{race?.race_name} - {type.toUpperCase()}</h1>
          <button onClick={() => window.print()} className="print:hidden border border-black px-4 py-1 text-xs font-bold uppercase">Print PDF</button>
        </header>

        <div className="space-y-8">
          {cleanPredictions.map((pred) => (
            <div key={pred.id} className="border-l-4 border-black pl-4 py-2">
              <div className="flex justify-between items-baseline mb-2">
                <h2 className="font-black uppercase italic text-lg">{pred.username}</h2>
                <span className="text-[10px] font-mono text-gray-400">Update: {pred.updated}</span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {pred.drivers.map((driver, i) => (
                  <div key={i} className="bg-gray-50 border border-gray-200 px-2 py-1 rounded min-w-[55px]">
                    <p className="text-[7px] font-bold text-blue-600">P{i+1}</p>
                    <p className="text-[10px] font-black uppercase">{driver}</p>
                  </div>
                ))}
                {pred.fastest_lap && (
                  <div className="bg-blue-50 border border-blue-200 px-2 py-1 rounded">
                    <p className="text-[7px] font-bold text-blue-600">FL</p>
                    <p className="text-[10px] font-black uppercase">{pred.fastest_lap}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 print:hidden">
          <Link href="/admin" className="text-xs underline font-bold text-gray-400 uppercase">← Terug naar dashboard</Link>
        </div>
      </div>
    );
  } catch (err: any) {
    return <div className="p-20 text-red-500 font-mono">Fout bij genereren: {err.message}</div>;
  }
}