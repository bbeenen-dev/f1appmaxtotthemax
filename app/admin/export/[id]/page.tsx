import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';

export const dynamic = "force-dynamic";

export default async function AdminExportPage({ params, searchParams }: any) {
  // 1. Params veilig uitpakken
  const resolvedParams = await params;
  const resolvedSearch = await searchParams;
  const raceId = resolvedParams.id;
  const type = resolvedSearch.type || 'race';
  
  const supabase = await createClient();

  // 2. Race info ophalen
  const { data: race } = await supabase
    .from('races')
    .select('race_name')
    .eq('id', raceId)
    .single();

  // 3. De juiste tabel kiezen op basis van het type
  let tableName = 'predictions_race';
  if (type === 'qualy') tableName = 'predictions_qualifying';
  if (type === 'sprint') tableName = 'predictions_sprint';

  // 4. Voorspellingen ophalen met profielnaam
  const { data: predictions, error: predError } = await supabase
    .from(tableName)
    .select('*, profiles:user_id(username)')
    .eq('race_id', raceId);

  if (predError) {
    return <div className="p-10 text-red-500 font-mono">Database Error: {predError.message}</div>;
  }

  return (
    <div className="min-h-screen bg-white text-black p-6 md:p-10 font-sans print:p-0">
      {/* HEADER */}
      <header className="border-b-4 border-black pb-4 mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black uppercase italic leading-none">{race?.race_name || 'Race ' + raceId}</h1>
          <p className="font-bold text-gray-500 uppercase text-[10px] tracking-widest mt-1">
            Export Type: {type.toUpperCase()} • F1 2026 OFFICIAL
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <Link href="/admin" className="bg-gray-100 text-black px-4 py-2 text-[10px] font-black uppercase rounded">Terug</Link>
          <button onClick={() => window.print()} className="bg-black text-white px-4 py-2 text-[10px] font-black uppercase rounded shadow-lg">Print / PDF</button>
        </div>
      </header>

      {/* DE LIJST */}
      <div className="space-y-4">
        {!predictions || predictions.length === 0 ? (
          <div className="p-10 border-2 border-dashed border-gray-200 text-center text-gray-400 italic rounded-xl">
            Geen voorspellingen gevonden voor {type} bij deze race.
          </div>
        ) : (
          predictions.map((pred: any) => {
            // Logica om de juiste drivers te verzamelen per type
            let displayDrivers: string[] = [];
            if (type === 'qualy') displayDrivers = pred.top_3_drivers || [];
            else if (type === 'sprint') displayDrivers = pred.top_8_drivers || [];
            else {
              // Voor de Main Race: combineer top 10 en bottom 12
              const t10 = Array.isArray(pred.top_10_drivers) ? pred.top_10_drivers : [];
              const b12 = Array.isArray(pred.bottom_12_drivers) ? pred.bottom_12_drivers : [];
              displayDrivers = [...t10, ...b12];
            }

            return (
              <div key={pred.id} className="border-2 border-black p-3 rounded-lg break-inside-avoid">
                <div className="flex justify-between items-center border-b border-gray-200 mb-2 pb-1">
                  <span className="font-black uppercase italic text-sm">{pred.profiles?.username || 'Deelnemer ' + pred.user_id.slice(0,5)}</span>
                  {type === 'race' && (
                    <span className="text-[9px] font-bold border border-black px-2 rounded-full">FL: {pred.fastest_lap_driver || '??'}</span>
                  )}
                </div>

                <div className="grid grid-cols-11 gap-1">
                  {displayDrivers.length > 0 ? (
                    displayDrivers.map((driver, idx) => (
                      <div key={idx} className="flex flex-col items-center border border-gray-100 py-1 bg-gray-50/50">
                        <span className="text-[6px] text-gray-400 font-bold uppercase leading-none">P{idx + 1}</span>
                        <span className="text-[10px] font-black leading-none mt-0.5">{driver}</span>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-11 text-[8px] text-red-400 italic text-center">Data onvolledig voor deze gebruiker</div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <footer className="mt-12 text-[7px] text-gray-300 uppercase font-bold text-center border-t pt-4">
        F1 Admin Export Tool • Generated {new Date().toLocaleDateString()}
      </footer>
    </div>
  );
}