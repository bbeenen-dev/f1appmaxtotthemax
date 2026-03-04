import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();

  try {
    // 1. BEPAAL DE HUIDIGE RACE
    const today = new Date().toISOString();
    const { data: currentRace, error: raceError } = await supabase
      .from('races')
      .select('id')
      .lte('date_start', today)
      .gte('date_end', today)
      .single();

    // Voor testdoeleinden: als er geen race is vandaag, pakken we ID 1
    const raceId = currentRace?.id || 1;

    // 2. HAAL DE ALLERLAATSTE SESSIE-DATA (LIVE)
    const sessionRes = await fetch(`https://api.openf1.org/v1/sessions?status=active&session_name=Race`);
    const sessions = await sessionRes.json();
    const sessionKey = sessions[0]?.session_key || 'latest';

    // 3. HAAL DE DRIVER MAPPING (Nummer -> ID zoals 'VER')
    const { data: dbDrivers, error: driverError } = await supabase
      .from('drivers')
      .select('driver_id, driver_number');

    if (driverError) throw new Error(`Drivers niet gevonden: ${driverError.message}`);

    const numberToId: Record<string, string> = {};
    dbDrivers?.forEach(d => {
      if (d.driver_number) numberToId[String(d.driver_number)] = String(d.driver_id);
    });

    // 4. HAAL LIVE POSITIES VAN OPENF1
    const response = await fetch(`https://api.openf1.org/v1/position?session_key=${sessionKey}`);
    const apiData = await response.json();

    if (!apiData || !Array.isArray(apiData) || apiData.length === 0) {
      return NextResponse.json({ success: false, message: "Geen live data op dit moment" });
    }

    // 5. VERWERK POSITIES (Laatste positie per driver_number)
    const latestMap: Record<string, number> = {};
    apiData.forEach((entry: any) => {
      latestMap[String(entry.driver_number)] = entry.position;
    });

    const sortedIds = Object.entries(latestMap)
      .sort(([, posA], [, posB]) => posA - posB)
      .map(([num]) => numberToId[num])
      .filter(Boolean);

    // 6. UPDATE DATABASE: Baanstand (actual_results)
    const { error: upsertResError } = await supabase
      .from('actual_results')
      .upsert({
        race_id: raceId,
        live_positions: sortedIds,
        last_updated: new Date().toISOString()
      }, { onConflict: 'race_id' });

    if (upsertResError) throw new Error(`Fout bij updaten actual_results: ${upsertResError.message}`);

    // 7. HAAL VOORSPELLINGEN EN BEREKEN SCORES
    const { data: allPredictions, error: predError } = await supabase
      .from('predictions_race')
      .select('user_id, top_10_drivers')
      .eq('race_id', raceId);

    if (predError) throw new Error(`Voorspellingen niet gevonden: ${predError.message}`);

    const scoreEntries = (allPredictions || []).map(pred => {
      let points = 0;
      const userPreds = (pred.top_10_drivers as string[]) || [];
      
      userPreds.forEach((driverId, index) => {
        const actualPos = sortedIds.indexOf(driverId);
        if (actualPos === index) {
          points += 5; // Exact
        } else if (actualPos !== -1 && Math.abs(index - actualPos) === 1) {
          points += 2; // 1 plek verschil
        }
      });

      return { 
        user_id: pred.user_id, 
        race_id: raceId, 
        points, 
        updated_at: new Date().toISOString() 
      };
    });

    // 8. UPDATE DATABASE: Virtuele scores (actual_scores)
    if (scoreEntries.length > 0) {
      const { error: upsertScoreError } = await supabase
        .from('actual_scores')
        .upsert(scoreEntries, { onConflict: 'user_id, race_id' });
      
      if (upsertScoreError) throw new Error(`Fout bij updaten actual_scores: ${upsertScoreError.message}`);
    }

    return NextResponse.json({ 
      success: true, 
      session: sessionKey, 
      race: raceId,
      updated_drivers: sortedIds.length 
    });

  } catch (err: any) {
    console.error("Sync Error:", err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}