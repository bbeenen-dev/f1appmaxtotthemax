import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  // 0. BEVEILIGING: Controleer de CRON_SECRET
  const providedKey = searchParams.get('key');
  const expectedKey = process.env.CRON_SECRET;

  if (!expectedKey || providedKey !== expectedKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. DYNAMISCHE RACE ZOEKEN
    // We zoeken de race waarvan de datum vandaag is (of de dichtstbijzijnde actieve race)
    const now = new Date().toISOString().split('T')[0];
    
    const { data: activeRace, error: raceError } = await supabase
      .from('races')
      .select('id, openf1_session_key')
      .lte('race_start', now) // Datum is vandaag of in het verleden
      .order('race_start', { ascending: false })
      .limit(1)
      .single();

    if (raceError || !activeRace?.openf1_session_key) {
      throw new Error(`Geen actieve race gevonden met een OpenF1 session key.`);
    }

    const sessionKey = activeRace.openf1_session_key;
    const raceId = activeRace.id;

    // 2. HAAL DE COUREURS OP UIT JE DATABASE
    const { data: dbDrivers, error: driverError } = await supabase
      .from('drivers')
      .select('driver_id, driver_number');

    if (driverError) throw new Error(`Drivers ophalen mislukt: ${driverError.message}`);

    const numberToId: Record<string, string> = {};
    dbDrivers?.forEach(d => {
      if (d.driver_number !== null) {
        numberToId[String(d.driver_number)] = String(d.driver_id);
      }
    });

    // 3. HAAL DE LIVE DATA VAN DE OPENF1 API
    const response = await fetch(`https://api.openf1.org/v1/position?session_key=${sessionKey}`);
    const apiData = await response.json();

    if (!apiData || !Array.isArray(apiData)) {
      throw new Error("Geen geldige data ontvangen van OpenF1 API");
    }

    // 4. VERWERK POSITIES: Pak de laatste bekende positie per coureur
    const latestMap: Record<string, number> = {};
    apiData.forEach((entry: any) => {
      latestMap[String(entry.driver_number)] = entry.position;
    });

    // 5. SORTEER EN VERTAAL NAAR JOUW CODES ('VER', 'SAI', etc.)
    const sortedIds: string[] = Object.entries(latestMap)
      .sort(([, posA], [, posB]) => posA - posB)
      .map(([num]) => numberToId[num])
      .filter(id => id !== undefined);

    // 6. UPDATE 'actual_results'
    const { error: resError } = await supabase
      .from('actual_results')
      .upsert({
        race_id: raceId,
        live_positions: sortedIds,
        last_updated: new Date().toISOString()
      }, { onConflict: 'race_id' });

    if (resError) throw resError;

    // 7. HAAL ALLE VOORSPELLINGEN OP
    const { data: allPredictions, error: predError } = await supabase
      .from('predictions_race')
      .select('user_id, top_10_drivers')
      .eq('race_id', raceId);

    if (predError) throw predError;

    // 8. BEREKEN DE PUNTEN PER GEBRUIKER
    const scoreEntries = (allPredictions || []).map(pred => {
      let points = 0;
      const userPreds = (pred.top_10_drivers as string[]) || [];

      userPreds.forEach((driverId, index) => {
        if (!driverId) return;
        const actualPos = sortedIds.findIndex(id => String(id) === String(driverId));
        
        if (actualPos === index) {
          points += 5; // Exact
        } else if (actualPos !== -1) {
          const distance = Math.abs(index - actualPos);
          if (distance === 1) points += 2; // Ernaast
        }
      });

      return {
        user_id: pred.user_id,
        race_id: raceId,
        points: points,
        updated_at: new Date().toISOString()
      };
    });

    // 9. SLA DE VIRTUELE PUNTEN OP
    if (scoreEntries.length > 0) {
      const { error: scoreError } = await supabase
        .from('actual_scores')
        .upsert(scoreEntries, { onConflict: 'user_id, race_id' });
      
      if (scoreError) throw scoreError;
    }

    return NextResponse.json({ 
      success: true, 
      race: raceId,
      session: sessionKey,
      message: `Sync voltooid voor race ${raceId}.`
    });

  } catch (err: any) {
    console.error("CRITICAL SYNC ERROR:", err.message);
    return NextResponse.json({ 
      success: false, 
      error: err.message 
    }, { status: 500 });
  }
}