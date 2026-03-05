import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';

export const dynamic = "force-dynamic";

export default async function AdminExportPage(props: any) {
  // 1. Veilig de parameters ophalen
  const params = await props.params;
  const searchParams = await props.searchParams;
  
  const raceId = params?.id;
  const type = searchParams?.type || 'race';

  // 2. Basis check
  if (!raceId) {
    return <div className="p-20 text-black bg-white">Fout: Geen Race ID gevonden.</div>;
  }

  try {
    const supabase = await createClient();

    // 3. Alleen even de race naam ophalen als test
    const { data: race, error: raceError } = await supabase
      .from('races')
      .select('race_name')
      .eq('id', raceId)
      .single();

    if (raceError) {
       return <div className="p-20 text-black bg-white">Supabase Fout: {raceError.message}</div>;
    }

    return (
      <div className="min-h-screen bg-white text-black p-10 font-sans">
        <h1 className="text-2xl font-bold uppercase italic">Export Test</h1>
        <p className="mt-4">Gekozen Race ID: <strong>{raceId}</strong></p>
        <p>Race Naam uit database: <strong>{race?.race_name}</strong></p>
        <p>Type: <strong>{type}</strong></p>
        <hr className="my-8" />
        <Link href="/admin" className="text-blue-600 underline text-sm uppercase font-bold">
          ← Terug naar Admin
        </Link>
      </div>
    );
  } catch (err: any) {
    return (
      <div className="p-20 text-red-600 bg-white">
        <h1 className="font-bold">Kritieke Render Fout:</h1>
        <p className="font-mono text-xs">{err.message}</p>
      </div>
    );
  }
}