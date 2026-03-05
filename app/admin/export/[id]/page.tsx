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
    // 1. Race en voorspellingen ophalen
    const { data: race } = await supabase.from('races').select('race_name').eq('id', raceId).single();
    
    const tableName = type === 'qualy' ? 'predictions_qualifying' : type === 'sprint' ? 'predictions_sprint' : 'predictions_race';
    const { data: rawPredictions } = await supabase.from(tableName).select('*').eq('race_id', raceId);

    // 2. Nicknames ophalen uit de profiles tabel (kolom: nickname)
    const userIds = rawPredictions?.map(p => p.user_id) || [];
    const { data: profiles } = await supabase.from('profiles').select('id, nickname').in('id', userIds);

    return (
      <div style={{ backgroundColor: 'white', color: 'black', padding: '40px', fontFamily: 'sans-serif' }}>
        <h1 style={{ textTransform: 'uppercase', marginBottom: '5px' }}>{String(race?.race_name || 'Race Export')}</h1>
        <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase', marginTop: '0' }}>
          Sessie: {String(type)}
        </p>
        <hr style={{ margin: '20px 0', border: '1px solid black' }} />

        {rawPredictions && rawPredictions.map((pred: any) => {
          // Zoek de juiste nickname op basis van de user_id
          const profile = profiles?.find(p => p.id === pred.user_id);
          const displayNickname = String(profile?.nickname || 'Onbekende Deelnemer');
          
          // Tijdstip formateren (YYYY-MM-DD om HH:MM)
          let tijdstip = "-";
          if (pred.updated_at) {
            const datePart = String(pred.updated_at).split('T')[0];
            const timePart = String(pred.updated_at).split('T')[1]?.substring(0, 5);
            tijdstip = `${datePart} om ${timePart}`;
          }
          
          let drivers: any[] = [];
          if (type === 'qualy') drivers = pred.top_3_drivers || [];
          else if (type === 'sprint') drivers = pred.top_8_drivers || [];
          else drivers = [...(pred.top_10_drivers || []), ...(pred.bottom_12_drivers || [])];

          return (
            <div key={pred.id} style={{ marginBottom: '30px', border: '1px solid black', padding: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid black', paddingBottom: '10px', marginBottom: '10px' }}>
                <strong style={{ fontSize: '20px', textTransform: 'uppercase', color: '#e10600' }}>{displayNickname}</strong>
                <span style={{ fontSize: '12px', color: '#666' }}>Ingezonden op: {tijdstip}</span>
              </div>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {drivers.map((d: any, index: number) => (
                  <div key={index} style={{ fontSize: '11px', border: '1px solid #ddd', padding: '6px', backgroundColor: '#f9f9f9', minWidth: '75px', textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', color: '#666', fontWeight: 'bold', marginBottom: '2px' }}>P{index + 1}</div>
                    <div style={{ fontWeight: '900', textTransform: 'uppercase' }}>{String(d || '-')}</div>
                  </div>
                ))}
                
                {type === 'race' && pred.fastest_lap_driver && (
                  <div style={{ fontSize: '11px', border: '2px solid #e10600', padding: '6px', backgroundColor: '#fff', minWidth: '75px', textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', color: '#e10600', fontWeight: 'bold', marginBottom: '2px' }}>FASTEST LAP</div>
                    <div style={{ fontWeight: '900', textTransform: 'uppercase' }}>{String(pred.fastest_lap_driver)}</div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        <footer style={{ marginTop: '50px', borderTop: '1px solid #eee', paddingTop: '10px', fontSize: '10px', textAlign: 'center', color: '#999' }}>
          GEGENEREERD OP {new Date().toLocaleString('nl-NL')} • F1 POULE EXPORT SYSTEM
        </footer>
      </div>
    );
  } catch (err: any) {
    return <div style={{ padding: '50px', color: 'red' }}>Systeemfout: {String(err.message)}</div>;
  }
}