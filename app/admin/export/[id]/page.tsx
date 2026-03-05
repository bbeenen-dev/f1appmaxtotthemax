import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminExportPage(props: any) {
  // 1. Params veilig binnenhalen
  const params = await props.params;
  const searchParams = await props.searchParams;
  const raceId = params?.id;
  const type = searchParams?.type || 'race';

  // 2. De meest simpele client-instelling voor Next.js 15
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  try {
    // 3. Data ophalen (Race naam)
    const { data: race } = await supabase
      .from('races')
      .select('race_name')
      .eq('id', raceId)
      .single();

    // 4. Tabel bepalen
    let tableName = 'predictions_race';
    if (type === 'qualy') tableName = 'predictions_qualifying';
    if (type === 'sprint') tableName = 'predictions_sprint';

    // 5. Voorspellingen ophalen
    const { data: rawPredictions, error: predError } = await supabase
      .from(tableName)
      .select('*')
      .eq('race_id', raceId);

    if (predError) throw predError;

    return (
      <div className="min-h-screen bg-white text-black p-10 font-sans">
        <header className="border-b-2 border-black pb-4 mb-6 flex justify-between items-center">
          <h1 className="text-xl font-black uppercase italic">
            {race?.race_name || 'Race'} - {type}
          </h1>
          <Link href="/admin" className="text-[10px] font-bold uppercase border border-black px-2 py-1 print:hidden">
            Terug
          </Link>
        </header>

        <div className="space-y-4">
          {rawPredictions && rawPredictions.length > 0 ? (
            rawPredictions.map((pred: any) => (
              <div key={pred.id} className="border border-gray-200 p-3 rounded shadow-sm">
                <p className="font-bold text-[10px] mb-2 text-gray-400 uppercase">User ID: {pred.user_id.slice(0, 8)}</p>
                <div className="flex flex-wrap gap-1">
                  {(pred.top_10_drivers || pred.top_3_drivers || pred.top_8_drivers || []).map((d: string, i: number) => (
                    <span key={i} className="bg-gray-100 text-[10px] px-2 py-1 rounded font-mono border border-gray-200 uppercase">
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-400 italic">Geen voorspellingen gevonden.</p>
          )}
        </div>
      </div>
    );
  } catch (err: any) {
    return (
      <div className="p-20 bg-white text-red-500 font-mono text-xs">
        Fout bij laden: {err.message}
      </div>
    );
  }
}