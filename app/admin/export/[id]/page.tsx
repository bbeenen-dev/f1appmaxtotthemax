import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function AdminExportPage(props: any) {
  // 1. Params direct awaiten
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
    const { data: rawPredictions } = await supabase.from(tableName).select('*').eq('race_id', raceId);

    const userIds = rawPredictions?.map(p => p.user_id) || [];
    const { data: profiles } = await supabase.from('profiles').select('id, username').in('id', userIds);

    // 3. De meest simpele render denkbaar
    return (
      <div style={{ backgroundColor: 'white', color: 'black', padding: '40px', fontFamily: 'sans-serif' }}>
        <h1 style={{ textTransform: 'uppercase' }}>{String(race?.race_name || 'Race Export')}</h1>
        <p style={{ fontSize: '12px', color: 'gray' }}>Type: {String(type)}</p>
        <hr style={{ margin: '20px 0', border: '1px solid black' }} />

        {rawPredictions && rawPredictions.map((pred: any) => {
          const profile = profiles?.find(p => p.id === pred.user_id);
          const name = String(profile?.username || 'Deelnemer');
          const date = pred.updated_at ? String(pred.updated_at).split('T')[0] : '-';
          
          // Stel de lijst samen
          let drivers: any[] = [];
          if (type === 'qualy') drivers = pred.top_3_drivers || [];
          else if (type === 'sprint') drivers = pred.top_8_drivers || [];
          else drivers = [...(pred.top_10_drivers || []), ...(pred.bottom_12_drivers || [])];

          return (
            <div key={pred.id} style={{ marginBottom: '30px', borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{name}</strong>
                <span style={{ fontSize: '10px' }}>Datum: {date}</span>
              </div>
              
              <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {drivers.map((d: any, index: number) => (
                  <div key={index} style={{ fontSize: '11px', border: '1px solid #ccc', padding: '5px' }}>
                    <span style={{ color: 'blue', fontWeight: 'bold' }}>P{index + 1}:</span> {String(d)}
                  </div>
                ))}
                {type === 'race' && pred.fastest_lap_driver && (
                  <div style={{ fontSize: '11px', border: '1px solid blue', padding: '5px' }}>
                    <span style={{ color: 'blue', fontWeight: 'bold' }}>FL:</span> {String(pred.fastest_lap_driver)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  } catch (err: any) {
    return <div style={{ padding: '50px', color: 'red' }}>Fout: {String(err.message)}</div>;
  }
}