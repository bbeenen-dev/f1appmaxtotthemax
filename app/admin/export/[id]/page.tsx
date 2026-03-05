import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';

export const dynamic = "force-dynamic";

export default async function AdminExportPage(props: any) {
  // 1. Veilig de parameters ophalen (zoals in de geslaagde test)
  const params = await props.params;
  const searchParams = await props.searchParams;
  
  const raceId = params?.id;
  const type = searchParams?.type || 'race';

  if (!raceId) {
    return <div className="p-20 text-black bg-white font-sans">Fout: Geen Race ID gevonden.</div>;
  }

  try {
    const supabase = await createClient();

    // 2. Race info ophalen
    const { data: race, error: raceError } = await supabase
      .from('races')
      .select('race_name')
      .eq('id', raceId)
      .single();

    if (raceError) throw new Error(`Race niet gevonden: ${raceError.message}`);

    // 3. Tabel bepalen op basis van type
    let tableName = 'predictions_race';
    if (type === 'qualy') tableName = 'predictions_qualifying';
    if (type === 'sprint') tableName = 'predictions_sprint';

    // 4. Voorspellingen ophalen
    const { data: rawPredictions, error: predError } = await supabase
      .from(tableName)
      .select('*')
      .eq('race_id', raceId);

    if (predError) throw new Error(`Data fout in ${tableName}: ${predError.message}`);

    // 5. Gebruikersnamen ophalen uit de profiles tabel
    const userIds = rawPredictions?.map(p => p.user_id) || [];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', userIds);

    // 6. Data samenvoegen
    const predictions = rawPredictions?.map(pred => ({
      ...pred,
      username: profiles?.find(p => p.id === pred.user_id)?.username || 'Onbekende Deelnemer'
    })) || [];

    return (
      <div className="min-h-screen bg-white text-black p-6 md:p-10 font-sans print:p-0">
        {/* HEADER */}
        <header className="border-b-4 border-black pb-4 mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-black uppercase italic leading-none">{race?.race_name}</h1>
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

        {/* LIJST MET VOORSPELLINGEN */}
        <div className="space-y-4">
          {predictions.length === 0 ? (
            <div className="p-20 border-2 border-dashed border-gray-100 text-center text-gray-300 italic rounded-3xl">
              Geen voorspellingen gevonden voor {type}.
            </div>
          ) : (
            predictions.map((pred: any) => {
              // Bepaal welke coureurs getoond moeten worden per type
              let displayDrivers: string[] = [];
              if (type === 'qualy') {
                displayDrivers = pred.top_3_drivers || [];
              } else if (type === 'sprint') {
                displayDrivers = pred.top_8_drivers || [];
              } else {
                // Combineer top 10 en bottom 12 voor de volledige race
                const t10 = Array.isArray(pred.top_10_drivers) ? pred.top_10_drivers : [];
                const b12 = Array.isArray(pred.bottom_12_drivers) ? pred.bottom_12_drivers : [];
                displayDrivers = [...t10, ...b12];
              }

              return (
                <div key={pred.id} className="border-2 border-black p-4 rounded-xl break-inside-avoid shadow-sm bg-white">
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
                  
                  {/* Grid layout: 11 kolommen breed voor een compact overzicht */}
                  <div className="grid grid-cols-11 gap-1">
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

        <footer className="mt-12 text-[7px] text-gray-300 uppercase font-black text-center border-t border-gray-100 pt-6 tracking-[0.2em]">
            F1 Poule Admin Tool • Generated {new Date().toLocaleDateString()}
        </footer>

        {/* CSS voor print optimalisatie */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body { background: white; padding: 0; }
            .print\\:hidden { display: none; }
            @page { margin: 1cm; size: A4; }
            .shadow-sm { shadow: none; }
          }
        `}} />
      </div>
    );
  } catch (err: any) {
    return (
      <div className="min-h-screen bg-white p-20 flex flex-col items-center justify-center text-center font-sans">
        <h2 className="text-red-600 font-black uppercase italic text-3xl mb-4">Data Fout</h2>
        <div className="bg-red-50 p-6 rounded-2xl border border-red-100 max-w-md">
          <p className="text-xs text-red-800 font-mono break-words">{err.message}</p>
        </div>
        <Link href="/admin" className="text-black font-black uppercase italic text-sm mt-8 underline decoration-red-500">
          Terug naar Admin
        </Link>
      </div>
    );
  }
}