import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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
    // STAP 1: Haal de data op
    const { data: rawPredictions, error } = await supabase
      .from(type === 'qualy' ? 'predictions_qualifying' : type === 'sprint' ? 'predictions_sprint' : 'predictions_race')
      .select('user_id, updated_at')
      .eq('race_id', raceId);

    if (error) return <div className="p-20 bg-white text-red-500">Supabase Error: {error.message}</div>;

    // STAP 2: Toon alleen het aantal gevonden records (GEEN MAP)
    return (
      <div className="min-h-screen bg-white text-black p-10 font-mono text-xs">
        <h1 className="text-xl font-bold mb-4">DIAGNOSTIC MODE</h1>
        <p>Race ID: {raceId}</p>
        <p>Type: {type}</p>
        <p>Aantal voorspellingen gevonden: <strong>{rawPredictions?.length || 0}</strong></p>
        <hr className="my-4 border-black" />
        <p className="mb-4 text-blue-600">Als je dit ziet, werkt de data-ophaling. We gaan nu kijken of de data corrupt is:</p>
        <pre className="bg-gray-100 p-4 overflow-auto max-h-[400px]">
          {JSON.stringify(rawPredictions, null, 2)}
        </pre>
      </div>
    );
  } catch (err: any) {
    return <div className="p-20 bg-white text-red-500 italic">Kritieke Render Fout: {err.message}</div>;
  }
}