import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';

export const dynamic = "force-dynamic";

export default async function AdminExportPage(props: { 
  params: Promise<{ id: string }>, 
  searchParams: Promise<{ type?: string }> 
}) {
  // 1. Params en SearchParams ALTIJD eerst awaiten (Cruciaal voor de Digest/Hydration error)
  const params = await props.params;
  const searchParams = await props.searchParams;
  
  const raceId = params.id;
  const type = searchParams.type || 'race';
  
  const supabase = await createClient();

  try {
    // 2. Race info ophalen
    const { data: race, error: raceError } = await supabase
      .from('races')
      .select('race_name')
      .eq('id', raceId)
      .single();

    if (raceError) throw new Error(`Race niet gevonden: ${raceError.message}`);

    // 3. De juiste tabel kiezen
    let tableName = 'predictions_race';
    if (type === 'qualy') tableName = 'predictions_qualifying';
    if (type === 'sprint') tableName = 'predictions_sprint';

    // 4. Voorspellingen ophalen
    const { data: rawPredictions, error: predError } = await supabase
      .from(tableName)
      .select('*')
      .eq('race_id', raceId);

    if (predError) throw new Error(`Data fout in ${tableName}: ${predError.message}`);

    // 5. Profielnamen handmatig ophalen (om Schema Cache/Relation errors te omzeilen)
    const userIds = rawPredictions?.map(p => p.user_id) || [];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', userIds);

    // 6. Data combineren voor weergave
    const predictions = rawPredictions?.map(pred => ({
      ...pred,
      username: profiles?.find(p => p.id === pred.user_id)?.username || 'Onbekende Deelnemer'
    })) || [];

    return (
      <div className="min-h-screen bg-white text-black p-6 md:p-10 font-sans print:p-0">
        <header className="border-b-4 border-black pb-4 mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-black uppercase italic leading-none">{race?.race_name || 'Race ' + raceId}</h1>
            <p className="font-bold text-gray-400 uppercase text-[9px] tracking-widest mt-2">
              OFFICIAL {type.toUpperCase()} EXPORT • SEASON 2026
            </p>
          </div>
          <div className="flex gap-2 print:hidden">
            <Link href="/admin" className="bg-gray-100 text-black px-4 py-2 text-[10px] font-black uppercase rounded-lg hover:bg-gray-200 transition-colors">
              ← Dashboard
            </Link>
            <button 
              onClick={() => window.print()} 
              className="bg-black text-white px-5 py-2 text-[10px] font-black uppercase rounded-lg shadow-xl active:scale-95 transition-all"
            >
              PDF Opslaan / Print
            </button>
          </div>
        </header>

        <div className="space-y-4">
          {predictions.length === 0 ? (
            <div className="p-20 border-2 border-dashed border-gray-100 text-center text-gray-300 italic rounded-3xl">
              Geen voorspellingen gevonden voor {type}.
            </div>
          ) : (
            predictions.map((pred: any) => {
              // Bepaal welke coureurs getoond moeten worden
              let displayDrivers: string[] = [];
              if (type === 'qualy') {
                displayDrivers = pred.top_3_drivers || [];
              } else if (type === 'sprint') {
                displayDrivers = pred.top_8_drivers || [];
              } else {
                const t10 = Array.isArray(pred.top_10_drivers) ? pred.top_10_drivers : [];
                const b12 = Array.isArray(pred.bottom_12_drivers) ? pred.bottom_12_drivers : [];
                displayDrivers = [...t10, ...b12];
              }

              return (
                <div key={pred.id} className="border-2 border-black p-4 rounded-xl break-inside-avoid shadow-sm">
                  <div className="flex justify-between items-center border-b border-gray-100 mb-3 pb-1">
                    <span className="font-black uppercase italic text-base tracking-tighter">
                      {pred.username}
                    </span>
                    {type === 'race' && (
                      <span className="text-[9px] font-black bg-black text-white px-2 py-0.5 rounded italic">
                        FL: {pred.fastest_lap_driver || 'N/A'}
                      </span>
                    )}
                  </div>
                  
                  {/* Grid layout past zich aan: 11 kolommen voor de race, flexibeler voor de rest */}
                  <div className={`grid ${displayDrivers.length > 10 ? 'grid-cols-11' : 'grid-cols-8'} gap-1`}>
                    {displayDrivers.map((driver, idx) => (
                      <div key={idx} className="flex flex-col items-center border border-gray-50 py-1.5 bg-gray-50/30 rounded">
                        <span className="text-[6px] text-gray-400 font-bold uppercase leading-none mb-0.5">P{idx + 1}</span>
                        <span className="text-[10px] font-black leading-none">{driver}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer voor PDF export */}
        <footer className="mt-12 text-[7px] text-gray-300 uppercase font-black text-center border-t border-gray-100 pt-6 tracking-[0.2em]">
            End of Data Report • F1 Poule 2026 • Verified Admin Export
        </footer>

        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body { background: white; padding: 0; }
            .print\\:hidden { display: none; }
            @page { margin: 1.5cm; }
          }
        `}} />
      </div>
    );
  } catch (e: any) {
    return (
      <div className="min-h-screen bg-white p-20 flex flex-col items-center justify-center text-center font-sans">
        <h2 className="text-red-600 font-black uppercase italic text-3xl mb-4">Systeemfout</h2>
        <div className="bg-red-50 p-6 rounded-2xl border border-red-100 max-w-md">
          <p className="text-xs text-red-800 font-mono break-words">{e.message}</p>
        </div>
        <Link href="/admin" className="text-black font-black uppercase italic text-sm mt-8 underline decoration-red-500">
          Terug naar Admin
        </Link>
      </div>
    );
  }
}