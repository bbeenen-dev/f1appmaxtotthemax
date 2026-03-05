import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminExportPage(props: any) {
  // 1. Params uitpakken (Next.js 15 stijl)
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
    // 2. Data ophalen
    const { data: race } = await supabase.from('races').select('race_name').eq('id', raceId).single();
    
    const tableName = type === 'qualy' ? 'predictions_qualifying' : type === 'sprint' ? 'predictions_sprint' : 'predictions_race';
    const { data: rawPredictions, error: predError } = await supabase
      .from(tableName)
      .select('*')
      .eq('race_id', raceId);

    if (predError) throw new Error("Database fout: " + predError.message);

    // 3. Alleen profielen ophalen van deelnemers die daadwerkelijk in de lijst staan
    const userIds = rawPredictions?.map(p => p.user_id) || [];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', userIds);

    return (
      <div className="min-h-screen bg-white text-black p-4 md:p-10 font-sans print:p-0">
        {/* HEADER */}
        <header className="border-b-4 border-black pb-4 mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-black uppercase italic leading-none">{race?.race_name || 'RACE EXPORT'}</h1>
            <p className="font-bold text-gray-400 uppercase text-[9px] tracking-widest mt-2 italic">
              OFFICIAL {type.toUpperCase()} GRID • SEASON 2026
            </p>
          </div>
          <div className="flex gap-2 print:hidden">
            <Link href="/admin" className="bg-gray-100 border border-black px-4 py-2 text-[10px] font-black uppercase rounded hover:bg-gray-200 transition-all">
              ← Dashboard
            </Link>
            <button 
              onClick={() => window.print()} 
              className="bg-black text-white px-5 py-2 text-[10px] font-black uppercase rounded shadow-lg active:scale-95 transition-all"
            >
              Print / PDF
            </button>
          </div>
        </header>

        {/* LIJST MET DEELNEMERS */}
        <div className="space-y-6">
          {!rawPredictions || rawPredictions.length === 0 ? (
            <div className="p-20 text-center border-2 border-dashed border-gray-100 text-gray-300 font-bold uppercase italic rounded-3xl">
              Geen voorspellingen gevonden.
            </div>
          ) : (
            rawPredictions.map((pred: any) => {
              const username = profiles?.find(p => p.id === pred.user_id)?.username || 'Deelnemer';
              
              // Veilig tijdstip formatteren
              let lastUpdate = '-';
              if (pred.updated_at) {
                try {
                  lastUpdate = new Date(pred.updated_at).toLocaleString('nl-NL', {
                    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                  });
                } catch (e) { lastUpdate = 'Formaatfout'; }
              }

              // Drivers bepalen op basis van sessietype
              let drivers: string[] = [];
              if (type === 'qualy') drivers = pred.top_3_drivers || [];
              else if (type === 'sprint') drivers = pred.top_8_drivers || [];
              else drivers = [...(pred.top_10_drivers || []), ...(pred.bottom_12_drivers || [])];

              return (
                <div key={pred.id} className="border-2 border-black rounded-lg overflow-hidden break-inside-avoid shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
                  {/* Participant Header met Nickname & Tijd */}
                  <div className="bg-black text-white p-2 px-4 flex justify-between items-center">
                    <span className="font-black uppercase italic text-sm tracking-tight">{username}</span>
                    <span className="text-[8px] font-mono text-gray-400 uppercase">Gepost: {lastUpdate}</span>
                  </div>

                  {/* Posities Grid */}
                  <div className="p-3 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-11 gap-1.5">
                    {drivers.length > 0 ? (
                      drivers.map((driver, idx) => (
                        <div key={idx} className="flex flex-col items-center border border-gray-100 py-1.5 bg-gray-50/50 rounded">
                          <span className="text-[7px] font-black text-[#005aff] leading-none mb-0.5 italic">P{idx + 1}</span>
                          <span className="text-[9px] font-black uppercase text-gray-800 leading-none">{driver || '-'}</span>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full py-2 text-[9px] text-red-500 italic text-center uppercase font-bold">Geen data ingevuld</div>
                    )}
                    
                    {/* Fastest Lap Indicator */}
                    {type === 'race' && (
                      <div className="flex flex-col items-center border-2 border-blue-500 py-1.5 bg-blue-50/50 rounded">
                        <span className="text-[7px] font-black text-blue-600 leading-none mb-0.5 italic">FL</span>
                        <span className="text-[9px] font-black uppercase text-blue-900 leading-none">{pred.fastest_lap_driver || '-'}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <footer className="mt-12 pt-6 border-t border-gray-100 text-center text-[8px] font-black text-gray-300 uppercase tracking-[0.4em]">
           Race ID: {raceId} • Verified Admin Report
        </footer>

        {/* CSS voor print-vriendelijkheid */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body { background: white; padding: 0; }
            .print\\:hidden { display: none; }
            @page { margin: 1cm; size: A4; }
          }
        `}} />
      </div>
    );
  } catch (err: any) {
    return (
      <div className="min-h-screen bg-white p-20 flex flex-col items-center justify-center text-center font-sans">
        <h2 className="text-red-600 font-black uppercase italic text-2xl mb-2">Systeemfout</h2>
        <p className="text-xs text-gray-500 font-mono bg-gray-50 p-4 rounded border max-w-lg">{err.message}</p>
        <Link href="/admin" className="mt-6 text-black font-bold uppercase underline text-sm">Terug naar Dashboard</Link>
      </div>
    );
  }
}