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
    const now = new Date();
    const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000).toISOString();
    
    const { data: activeRace, error: raceError } = await supabase
      .from('races')
      .select('id, openf1_session_key, race_start')
      .lte('race_start', fifteenMinutesFromNow) 
      .order('race_start', { ascending: false })
      .limit(1)
      .single();

    if (raceError || !activeRace?.openf1_session_key) {
      return NextResponse.json({ 
        success: true,
        status: "IDLE",
        message: "Geen race die binnenkort start of onlangs gestart is." 
      });
    }

    // --- TIJDSCHECK: 15 min vóór start tot 3 uur na start ---
    const raceStartTime = new Date(activeRace.race_start).getTime();
    const currentTime = now.getTime();
    const vijftienMinutenInMs = 15 * 60 * 1000;
    const drieUurInMs = 3 * 60 * 60 * 1000;

    const isTeVroeg = currentTime < (raceStartTime - vijftienMinutenInMs);
    const isTeLaat = currentTime > (raceStartTime + drieUurInMs);

    if (isTeVroeg || isTeLaat) {
      return NextResponse.json({ 
        success: true, 
        status: "IDLE",
        message: isTeVroeg ? "Race start nog niet." : "Race is al langer dan 3 uur geleden gestart." 
      });
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

    // 4. VERWERK POSITIES VOOR PUNTENTELLING (P1 t/m P20)
    // We maken een map van DriverID -> Werkelijke Positie uit de API
    const driverIdToActualPos: Record<string, number> = {};
    const latestMap: Record<string, number> = {};

    apiData.forEach((entry: any) => {
      const dId = numberToId[String(entry.driver_number)];
      if (dId) {
        driverIdToActualPos[dId] = entry.position; // Slaat bijv. 11 op voor Verstappen
        latestMap[String(entry.driver_number)] = entry.position;
      }
    });

    // 5. SORTEER VOOR OPSLAG (Top 10 of volledig voor weergave)
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

    // 8. BEREKEN DE PUNTEN (Met de P11 correctie)
    const scoreEntries = (allPredictions || []).map(pred => {
      let points = 0;
      const userPreds = (pred.top_10_drivers as string[]) || [];

      userPreds.forEach((driverId, index) => {
        if (!driverId) return;
        
        const predictedPos = index + 1; // P1 = 1, P10 = 10
        const actualPos = driverIdToActualPos[String(driverId)]; // Kan 1 t/m 20 zijn
        
        if (!actualPos) return; // Coureur niet in uitslag (DNF)

        if (actualPos === predictedPos) {
          points += 5; // EXACT: Voorspeld P10, werkelijk P10
        } else {
          const distance = Math.abs(predictedPos - actualPos);
          if (distance === 1) {
            points += 2; // ERNAAST: Voorspeld P10, werkelijk P9 OF P11
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

    // 9. SLA DE VIRTUELE PUNTEN OP
    if (scoreEntries.length > 0) {
      const { error: scoreError } = await supabase
        .from('actual_scores')
        .upsert(scoreEntries, { onConflict: 'user_id, race_id' });
      
      if (scoreError) throw scoreError;
    }

    return NextResponse.json({ 
      success: true, 
      status: "LIVE",
      race: raceId,
      message: `Sync voltooid. P1-P11 logica toegepast.`
    });

  } catch (err: any) {
    console.error("CRITICAL SYNC ERROR:", err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}