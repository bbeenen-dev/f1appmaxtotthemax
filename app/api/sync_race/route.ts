import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  
  // CONFIGURATIE: Voor de test gebruiken we de Zandvoort sessie
  const sessionKey = 9165; 
  const raceId = 1; // Zorg dat dit ID bestaat in je 'races' tabel

  try {
    // 1. HAAL DE COUREURS OP UIT JE DATABASE (Mapping van Nummer naar ID zoals 'VER')
    const { data: dbDrivers, error: driverError } = await supabase
      .from('drivers')
      .select('driver_id, driver_number');

    if (driverError) throw new Error(`Drivers ophalen mislukt: ${driverError.message}`);

    // Maak een opzoek-object: { "1": "VER", "44": "HAM" }
    const numberToId: Record<string, string> = {};
    dbDrivers?.forEach(d => {
      if (d.driver_number !== null) {
        numberToId[String(d.driver_number)] = String(d.driver_id);
      }
    });

    // 2. HAAL DE LIVE DATA VAN DE OPENF1 API
    const response = await fetch(`https://api.openf1.org/v1/position?session_key=${sessionKey}`);
    const apiData = await response.json();

    if (!apiData || !Array.isArray(apiData)) {
      throw new Error("Geen geldige data ontvangen van OpenF1 API");
    }

    // 3. VERWERK POSITIES: Pak de laatste bekende positie per coureur
    const latestMap: Record<string, number> = {};
    apiData.forEach((entry: any) => {
      latestMap[String(entry.driver_number)] = entry.position;
    });

    // 4. SORTEER EN VERTAAL NAAR JOUW CODES ('VER', 'SAI', etc.)
    const sortedIds: string[] = Object.entries(latestMap)
      .sort(([, posA], [, posB]) => posA - posB)
      .map(([num]) => numberToId[num])
      .filter(id => id !== undefined); // Filter coureurs die niet in je DB staan

    // 5. UPDATE 'actual_results' (De huidige stand op de baan)
    const { error: resError } = await supabase
      .from('actual_results')
      .upsert({
        race_id: raceId,
        live_positions: sortedIds,
        last_updated: new Date().toISOString()
      }, { onConflict: 'race_id' });

    if (resError) throw resError;

    // 6. HAAL ALLE VOORSPELLINGEN OP VOOR DEZE RACE
    const { data: allPredictions, error: predError } = await supabase
      .from('predictions_race')
      .select('user_id, top_10_drivers')
      .eq('race_id', raceId);

    if (predError) throw predError;

    // 7. BEREKEN DE PUNTEN PER GEBRUIKER
    const scoreEntries = (allPredictions || []).map(pred => {
      let points = 0;
      // Forceer naar string array en filter eventuele null waardes
      const userPreds = (pred.top_10_drivers as string[]) || [];

      userPreds.forEach((driverId, index) => {
        if (!driverId) return;

        // Zoek de index in de actuele stand (gebruik String vergelijking)
        const actualPos = sortedIds.findIndex(id => String(id) === String(driverId));
        
        if (actualPos === index) {
          // Exacte positie match
          points += 5;
        } else if (actualPos !== -1) {
          // Check of ze er 1 plek naast zitten
          const distance = Math.abs(index - actualPos);
          if (distance === 1) {
            points += 2;
          }
        }
      });

      return {
        user_id: pred.user_id,
        race_id: raceId,
        points: points,
        updated_at: new Date().toISOString()
      };
    });

    // 8. SLA DE VIRTUELE PUNTEN OP IN 'actual_scores'
    if (scoreEntries.length > 0) {
      const { error: scoreError } = await supabase
        .from('actual_scores')
        .upsert(scoreEntries, { onConflict: 'user_id, race_id' });
      
      if (scoreError) throw scoreError;
    }

    // 9. RESULTAAT TERUGSTUREN
    return NextResponse.json({ 
      success: true, 
      message: `Sync voltooid. ${scoreEntries.length} gebruikers gescoord.`,
      baan_stand_p1: sortedIds[0],
      aantal_gepusht: sortedIds.length
    });

  } catch (err: any) {
    console.error("CRITICAL SYNC ERROR:", err.message);
    return NextResponse.json({ 
      success: false, 
      error: err.message 
    }, { status: 500 });
  }
}