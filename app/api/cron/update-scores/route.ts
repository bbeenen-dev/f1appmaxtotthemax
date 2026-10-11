import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Zorg ervoor dat Next.js deze route nooit statisch probeert te bouwen/pre-renderen
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Check of de vereiste omgevingsvariabelen aanwezig zijn
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Supabase omgevingsvariabelen ontbreken in de runtime omgeving." },
        { status: 500 }
      );
    }

    // Initialiseer de Supabase client pas binnen de request handler
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // ------------------------------------------------------------------------
    // STAP 1: Haal de actieve sessie op van OpenF1 om de actieve race te bepalen
    // ------------------------------------------------------------------------
    const sessionRes = await fetch("https://api.openf1.org/v1/sessions?session_key=latest");
    const sessionData = await sessionRes.json();

    if (!Array.isArray(sessionData) || sessionData.length === 0) {
      return NextResponse.json({ message: "Geen actieve F1 sessie gevonden via OpenF1" }, { status: 200 });
    }

    const currentSession = sessionData[0];
    const sessionYear = currentSession.year;
    const sessionLocation = currentSession.location || currentSession.country_name;

    // ------------------------------------------------------------------------
    // STAP 2: Zoek de overeenkomstige race_id op in jouw Supabase 'races' tabel
    // ------------------------------------------------------------------------
    let activeRace: { id: number; name?: string; circuit_name?: string } | null = null;

    const { data: raceMatch } = await supabaseAdmin
      .from("races")
      .select("id, name, circuit_name")
      .eq("year", sessionYear)
      .ilike("circuit_name", `%${sessionLocation}%`)
      .maybeSingle();

    activeRace = raceMatch;

    if (!activeRace) {
      const { data: fallbackRace } = await supabaseAdmin
        .from("races")
        .select("id, name, circuit_name")
        .eq("year", sessionYear)
        .ilike("name", `%${sessionLocation}%`)
        .maybeSingle();

      activeRace = fallbackRace;
    }

    if (!activeRace) {
      return NextResponse.json({ 
        error: "Kon actieve race niet matchen met jouw 'races' tabel", 
        openF1Location: sessionLocation,
        year: sessionYear
      }, { status: 404 });
    }

    const raceId: number = activeRace.id;

    // ------------------------------------------------------------------------
    // STAP 3: Haal actieve coureurs op via OpenF1 voor de DYNAMISCHE mapping
    // ------------------------------------------------------------------------
    const driversRes = await fetch("https://api.openf1.org/v1/drivers?session_key=latest");
    const rawDrivers = await driversRes.json();

    if (!Array.isArray(rawDrivers) || rawDrivers.length === 0) {
      return NextResponse.json({ message: "Geen actieve coureurdata beschikbaar via OpenF1" });
    }

    const DRIVER_MAP: Record<string, number> = {};
    rawDrivers.forEach((d: any) => {
      if (d.name_acronym && d.driver_number) {
        DRIVER_MAP[d.name_acronym] = d.driver_number;
      }
    });

    // ------------------------------------------------------------------------
    // STAP 4: Haal de nieuwste F1 posities op via OpenF1
    // ------------------------------------------------------------------------
    const posRes = await fetch("https://api.openf1.org/v1/position?session_key=latest");
    const rawPositions = await posRes.json();

    if (!Array.isArray(rawPositions) || rawPositions.length === 0) {
      return NextResponse.json({ message: "Geen F1 positiedata beschikbaar" });
    }

    const latestPositions = new Map<number, number>();
    rawPositions.forEach((p: any) => {
      latestPositions.set(p.driver_number, p.position);
    });

    // ------------------------------------------------------------------------
    // STAP 5: Haal voorspellingen op uit Supabase voor deze specifieke race_id
    // ------------------------------------------------------------------------
    const { data: predictions, error: predError } = await supabaseAdmin
      .from("predictions_race")
      .select("user_id, top_10_drivers")
      .eq("race_id", raceId);

    if (predError || !predictions) {
      return NextResponse.json({ error: "Fout bij ophalen voorspellingen", details: predError }, { status: 500 });
    }

    // ------------------------------------------------------------------------
    // STAP 6: Bereken punten per gebruiker
    // ------------------------------------------------------------------------
    const scoreUpdates = predictions.map((pred: any) => {
      let points = 0;
      const top10: string[] = pred.top_10_drivers || [];

      top10.forEach((driverCode: string, index: number) => {
        const predictedPosition = index + 1;
        const driverNumber = DRIVER_MAP[driverCode];

        if (driverNumber) {
          const actualPosition = latestPositions.get(driverNumber);

          if (actualPosition !== undefined) {
            const diff = Math.abs(predictedPosition - actualPosition);

            if (diff === 0) {
              points += 5;
            } else if (diff === 1) {
              points += 2;
            }
          }
        }
      });

      return {
        race_id: raceId,
        user_id: pred.user_id,
        points: points,
        updated_at: new Date().toISOString()
      };
    });

    // ------------------------------------------------------------------------
    // STAP 7: Schrijf de berekende live-scores weg naar 'actual_scores'
    // ------------------------------------------------------------------------
    const { error: upsertError } = await supabaseAdmin
      .from("actual_scores")
      .upsert(scoreUpdates, { onConflict: "race_id,user_id" });

    if (upsertError) {
      return NextResponse.json({ error: "Fout bij opslaan van scores", details: upsertError }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      matchedRaceId: raceId,
      matchedRaceName: activeRace.name || sessionLocation,
      updatedUsers: scoreUpdates.length,
      mappedDrivers: Object.keys(DRIVER_MAP).length
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}