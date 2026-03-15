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
    // We kijken 15 minuten in de toekomst
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
        message: "Geen race gevonden met een geldige session key." 
      });
    }

    // --- TIJDSCHECK: Verruimd naar 24 uur voor naderhand syncen ---
    const raceStartTime = new Date(activeRace.race_start).getTime();
    const currentTime = now.getTime();
    const vijftienMinutenInMs = 15 * 60 * 1000;
    const vierentwintigUurInMs = 24 * 60 * 60 * 1000; // Verhoogd van 3 naar 24 uur

    const isTeVroeg = currentTime < (raceStartTime - vijftienMinutenInMs);
    const isTeLaat = currentTime > (raceStartTime + vierentwintigUurInMs);

    if (isTeVroeg || isTeLaat) {
      return NextResponse.json({ 
        success: true, 
        status: "IDLE",
        message: isTeVroeg ? "Race start nog niet." : "Race is langer dan 24 uur geleden gestart." 
      });
    }

    const sessionKey = activeRace.openf1_session_key;
    const raceId = activeRace.id;

    // 2. HAAL DE COUREURS OP
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

    // 3. HAAL DE LIVE DATA (Gecorrigeerd: positions met een 's' en backticks)
    const response = await fetch(`https://api.openf1.org/v1/positions?session_key=${sessionKey}`);
    
    if (!response.ok) {
      throw new Error(`OpenF1 API status fout: ${response.status}`);
    }

    const apiData = await response.json();

    if (!apiData || !Array.isArray(apiData) || apiData.length === 0) {
      return NextResponse.json({ 
        success: true, 
        status: "LIVE_NO_DATA", 
        message: "API verbonden, maar geen posities beschikbaar voor deze sessie." 
      });
    }

    // 4. VERWERK POSITIES
    const driverIdToActualPos: Record<string, number> = {};
    const latestMap: Record<string, number> = {};

    apiData.forEach((entry: any) => {
      const dId = numberToId[String(entry.driver_number)];
      if (dId) {
        driverIdToActualPos[dId] = entry.position;
        latestMap[String(entry.driver_number)] = entry.position;
      }
    });

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

    // 7. HAAL VOORSPELLINGEN OP
    const { data: allPredictions, error: predError } = await supabase
      .from('predictions_race')
      .select('user_id, top_10_drivers')
      .eq('race_id', raceId);

    if (predError) throw predError;

    // 8. BEREKEN PUNTEN
    const scoreEntries = (allPredictions || []).map(pred => {
      let points = 0;
      const userPreds = (pred.top_10_drivers as string[]) || [];

      userPreds.forEach((driverId, index) => {
        if (!driverId) return;
        
        const predictedPos = index + 1;
        const actualPos = driverIdToActualPos[String(driverId)];
        
        if (!actualPos) return;

        if (actualPos === predictedPos) {
          points += 5; 
        } else {
          const distance = Math.abs(predictedPos - actualPos);
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

    // 9. SLA SCORES OP
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
      message: `Sync voltooid voor sessie ${sessionKey}.`
    });

  } catch (err: any) {
    console.error("CRITICAL SYNC ERROR:", err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}