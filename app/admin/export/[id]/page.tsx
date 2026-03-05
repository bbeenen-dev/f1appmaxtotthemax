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
    const { data: rawPredictions } = await supabase
      .from(tableName)
      .select('*')
      .eq('race_id', raceId)
      .order('updated_at', { ascending: false });

    // 4. Haal alle profielen op voor nicknames
    const { data: profiles } = await supabase.from('profiles').select('id, username');

    return (
      <div className="min-h-screen bg-white text-black p-6 font-sans print:p-0">
        {/* HEADER */}
        <header className="border-b-4 border-black pb-4 mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black uppercase italic leading-none">{race?.race_name || 'Race'}</h1>
            <p className="font-bold text-gray-400 uppercase text-[10px] tracking-widest mt-2 italic">
              Official {type.toUpperCase()} Grid • Season 2026
            </p>
          </div>
          <div className="flex gap-2 print:hidden">
            <Link href="/admin" className="bg-gray-100 px-4 py-2 text-[10px] font-black uppercase rounded border border-black hover:bg-gray-200">
              ← Dashboard
            </Link>
            <button onClick={() => window.print()} className="bg-black text-white px-4 py-2 text-[10px] font-black uppercase rounded shadow-lg active:scale-95">
              Print / PDF
            </button>
          </div>
        </header>

        {/* DEELNEMERS LIJST */}
        <div className="grid grid-cols-1 gap-6">
          {rawPredictions && rawPredictions.length > 0 ? (
            rawPredictions.map((pred: any) => {
              const profile = profiles?.find(p => p.id === pred.user_id);
              const nickname = profile?.username || 'Anonieme Coureur';
              const lastUpdate = pred.updated_at ? new Date(pred.updated_at).toLocaleString('nl-NL', {
                day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
              }) : 'Onbekend';

              // Verzamel de juiste drivers
              let drivers: string[] = [];
              if (type === 'qualy') drivers = pred.top_3_drivers || [];
              else if (type === 'sprint') drivers = pred.top_8_drivers || [];
              else drivers = [...(pred.top_10_drivers || []), ...(pred.bottom_12_drivers || [])];

              return (
                <div key={pred.id} className="border-2 border-black rounded-xl overflow-hidden break-inside-avoid shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  {/* Participant Header */}
                  <div className="bg-black text-white p-3 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter block leading-none mb-1">Nickname</span>
                      <h3 className="text-lg font-black uppercase italic leading-none">{nickname}</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter block leading-none mb-1">Laatste Wijziging</span>
                      <span className="text-xs font-mono font-bold">{lastUpdate}</span>
                    </div>
                  </div>

                  {/* Drivers Grid */}
                  <div className="p-4 bg-white grid grid-cols-4 sm:grid-cols-6 md:grid-cols-11 gap-2">
                    {drivers.map((driver, idx) => (
                      <div key={idx} className="flex flex-col items-center border border-gray-200 rounded-lg py-2 bg-gray-50/50">
                        <span className="text-[8px] font-black text-[#005aff] leading-none mb-1 italic">P{idx + 1}</span>
                        <span className="text-[11px] font-black uppercase text-gray-800 tracking-tight">{driver || '-'}</span>
                      </div>
                    ))}
                    {type === 'race' && (
                      <div className="flex flex-col items-center border-2 border-[#005aff] rounded-lg py-2 bg-[#005aff]/5 col-span-1">
                         <span className="text-[8px] font-black text-[#005aff] leading-none mb-1 italic">FL</span>
                         <span className="text-[11px] font-black uppercase text-[#005aff] tracking-tight">{pred.fastest_lap_driver || '-'}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center p-20 border-2 border-dashed border-gray-200 rounded-3xl text-gray-400 font-bold uppercase italic">
              Geen voorspellingen gevonden voor deze race.
            </div>
          )}
        </div>

        {/* FOOTER */}
        <footer className="mt-12 pt-6 border-t border-gray-100 text-center">
           <p className="text-[8px] font-black text-gray-300 uppercase tracking-[0.5em]">
             End of Document • F1 Poule 2026 • Race ID: {raceId}
           </p>
        </footer>

        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body { background: white; }
            .print\\:hidden { display: none; }
            @page { margin: 1cm; size: A4; }
          }
        `}} />
      </div>
    );
  } catch (err: any) {
    return <div className="p-20 text-red-500 font-mono">Fout: {err.message}</div>;
  }
}