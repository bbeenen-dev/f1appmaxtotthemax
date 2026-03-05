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
    // 1. Data ophalen
    const { data: race } = await supabase.from('races').select('race_name').eq('id', raceId).single();
    
    const tableName = type === 'qualy' ? 'predictions_qualifying' : type === 'sprint' ? 'predictions_sprint' : 'predictions_race';
    const { data: rawPredictions } = await supabase.from(tableName).select('*').eq('race_id', raceId);

    // 2. Haal de nicknames op uit de profiles tabel
    const userIds = rawPredictions?.map(p => p.user_id) || [];
    const { data: profiles } = await supabase.from('profiles').select('id, username').in('id', userIds);

    return (
      <div style={{ backgroundColor: 'white', color: 'black', padding: '40px', fontFamily: 'sans-serif' }}>
        <h1 style={{ textTransform: 'uppercase', marginBottom: '5px' }}>{String(race?.race_name || 'Race Export')}</h1>
        <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase', marginTop: '0' }}>
          Sessie: {String(type)}
        </p>
        <hr style={{ margin: '20px 0', border: '1px solid black' }} />

        {rawPredictions && rawPredictions.map((pred: any) => {
          // Zoek de nickname op basis van de user_id
          const profile = profiles?.find(p => p.id === pred.user_id);
          const nickname = String(profile?.username || 'Onbekende Deelnemer');
          
          // Tijdstip handmatig extraheren uit de ISO string (YYYY-MM-DDTHH:MM:SS)
          // Dit is veiliger dan .toLocaleString()
          let tijdstip = "-";
          if (pred.updated_at) {
            const datePart = String(pred.updated_at).split('T')[0];
            const timePart = String(pred.updated_at).split('T')[1]?.substring(0, 5); // Pakt HH:MM
            tijdstip = `${datePart} om ${timePart}`;
          }
          
          let drivers: any[] = [];
          if (type === 'qualy') drivers = pred.top_3_drivers || [];
          else if (type === 'sprint') drivers = pred.top_8_drivers || [];
          else drivers = [...(pred.top_10_drivers || []), ...(pred.bottom_12_drivers || [])];

          return (
            <div key={pred.id} style={{ marginBottom: '30px', border: '1px solid black', padding: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid black', paddingBottom: '10px', marginBottom: '10px' }}>
                <strong style={{ fontSize: '18px', textTransform: 'uppercase' }}>{nickname}</strong>
                <span style={{ fontSize: '11px', color: '#666' }}>Laatste wijziging: {tijdstip}</span>
              </div>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {drivers.map((d: any, index: number) => (
                  <div key={index} style={{ fontSize: '11px', border: '1px solid #ddd', padding: '6px', backgroundColor: '#f9f9f9', minWidth: '70px', textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', color: 'blue', fontWeight: 'bold', marginBottom: '2px' }}>P{index + 1}</div>
                    <div style={{ fontWeight: '900', textTransform: 'uppercase' }}>{String(d || '-')}</div>
                  </div>
                ))}
                
                {type === 'race' && pred.fastest_lap_driver && (
                  <div style={{ fontSize: '11px', border: '2px solid black', padding: '6px', backgroundColor: '#eee', minWidth: '70px', textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', color: 'black', fontWeight: 'bold', marginBottom: '2px' }}>FL</div>
                    <div style={{ fontWeight: '900', textTransform: 'uppercase' }}>{String(pred.fastest_lap_driver)}</div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        <p style={{ marginTop: '40px', fontSize: '10px', textAlign: 'center', color: '#ccc', textTransform: 'uppercase', letterSpacing: '2px' }}>
          Officieel Export Document • F1 Poule 2026
        </p>
      </div>
    );
  } catch (err: any) {
    return <div style={{ padding: '50px', color: 'red', fontFamily: 'monospace' }}>Fout: {String(err.message)}</div>;
  }
}