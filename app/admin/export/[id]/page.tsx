import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';

export const dynamic = "force-dynamic";

export default async function AdminExportPage({ params, searchParams }: any) {
  // 1. Params veilig uitpakken voor Next.js 15+
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

  // 4. Voorspellingen ophalen (Zonder de relationele select om de cache-error te voorkomen)
  const { data: rawPredictions, error: predError } = await supabase
    .from(tableName)
    .select('*')
    .eq('race_id', raceId);

  if (predError) {
    return <div className="p-10 text-red-500 font-mono italic">Database Error: {predError.message}</div>;
  }

  // 5. Profielnamen handmatig ophalen en koppelen
  const userIds = rawPredictions?.map(p => p.user_id) || [];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username')
    .in('id', userIds);

  const predictions = rawPredictions?.map(pred => ({
    ...pred,
    username: profiles?.find(p => p.id === pred.user_id)?.username || 'Onbekende Deelnemer'
  }));

  return (
    <div className="min-h-screen bg-white text-black p-6 md:p-10 font-sans print:p-0">
      {/* PRINT-VRIENDELIJKE HEADER */}
      <header className="border-b-4 border-black pb-4 mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black uppercase italic leading-none">{race?.race_name || 'Race ' + raceId}</h1>
          <p className="font-bold text-gray-400 uppercase text-[9px] tracking-[0.3em] mt-2">
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

      {/* DE LIJST MET VOORSPELLINGEN */}
      <div className="space-y-4">
        {!predictions || predictions.length === 0 ? (
          <div className="p-20 border-2 border-dashed border-gray-100 text-center text-gray-300 italic rounded-3xl">
            Geen voorspellingen gevonden voor {type} bij deze race.
          </div>
        ) : (
          predictions.map((pred: any) => {
            // Logica om de juiste drivers te verzamelen per type
            let displayDrivers: string[] = [];
            if (type === 'qualy') displayDrivers = pred.top_3_drivers || [];
            else if (type === 'sprint') displayDrivers = pred.top_8_drivers || [];
            else {
              const t10 = Array.isArray(pred.top_10_drivers) ? pred.top_10_drivers : [];
              const b12 = Array.isArray(pred.bottom_12_drivers) ? pred.bottom_12_drivers : [];
              displayDrivers = [...t10, ...b12];
            }

            return (
              <div key={pred.id} className="border-2 border-black p-4 rounded-xl break-inside-avoid shadow-sm">
                <div className="flex justify-between items-center border-b border-gray-100 mb-3 pb-1">
                  <span className="font-black uppercase italic text-base tracking-tighter">{pred.username}</span>
                  {type === 'race' && (
                    <span className="text-[9px] font-black bg-black text-white px-2 py-0.5 rounded italic">
                      FL: {pred.fastest_lap_driver || 'N/A'}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-11 gap-1">
                  {displayDrivers.length > 0 ? (
                    displayDrivers.map((driver, idx) => (
                      <div key={idx} className="flex flex-col items-center border border-gray-50 py-1.5 bg-gray-50/30 rounded">
                        <span className="text-[6px] text-gray-400 font-bold uppercase leading-none mb-0.5">P{idx + 1}</span>
                        <span className="text-[10px] font-black leading-none">{driver}</span>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-11 text-[8px] text-red-400 italic text-center py-2">Data onvolledig voor deze gebruiker</div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <footer className="mt-12 text-[7px] text-gray-300 uppercase font-black text-center border-t border-gray-100 pt-6 tracking-[0.2em]">
        End of Data Report • F1 Poule 2026 • Verified Admin Export
      </footer>

      {/* Kleine CSS fix voor printing */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { background: white; padding: 0; }
          .print\\:hidden { display: none; }
          @page { margin: 1.5cm; }
        }
      `}} />
    </div>
  );
}