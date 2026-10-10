import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Gebruik Service Role key voor schrijf- en leesrechten vanuit de backend
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    // ------------------------------------------------------------------------
    // STAP 1: Haal de actieve sessie op van OpenF1 om de actieve race te bepalen
    // ------------------------------------------------------------------------
    const sessionRes = await fetch("https://api.openf1.org/v1/sessions?session_key=latest");
    const sessionData = await sessionRes.json();

    if (!Array.isArray(sessionData) || sessionData.length === 0) {
      return NextResponse.json({ message: "Geen actieve F1 sessie gevonden via OpenF1" }, { status: 404 });
    }

    const currentSession = sessionData[0]; // Bijv. { location: "Singapore", year: 2026, session_name: "Race" }
    const sessionYear = currentSession.year;
    const sessionLocation = currentSession.location || currentSession.country_name;

    // ------------------------------------------------------------------------
    // STAP 2: Zoek de overeenkomstige race_id op in jouw Supabase 'races' tabel
    // ------------------------------------------------------------------------
    let activeRace: { id: number; name?: string; circuit_name?: string } | null = null;

    // Poging 1: Match op circuit_name
    const { data: raceMatch } = await supabaseAdmin
      .from("races")
      .select("id, name, circuit_name")
      .eq("year", sessionYear)
      .ilike("circuit_name", `%${sessionLocation}%`)
      .maybeSingle();

    activeRace = raceMatch;

    // Poging 2 (Fallback): Match op race name als poging 1 geen resultaat geeft
    if (!activeRace) {
      const { data: fallbackRace } = await supabaseAdmin
        .from("races")
        .select("id, name, circuit_name")
        .eq("season_year", sessionYear)
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

    const raceId: number = activeRace.id; // Jouw interne integer race_id!

    // ------------------------------------------------------------------------
    // STAP 3: Haal actieve coureurs op via OpenF1 voor de DYNAMISCHE mapping
    // ------------------------------------------------------------------------
    const driversRes = await fetch("https://api.openf1.org/v1/drivers?session_key=latest");
    const rawDrivers = await driversRes.json();

    if (!Array.isArray(rawDrivers) || rawDrivers.length === 0) {
      return NextResponse.json({ message: "Geen actieve coureurdata beschikbaar via OpenF1" });
    }

    // Bouw de dynamische DRIVER_MAP op (bijv. { "VER": 1, "NOR": 4, "HAM": 44 })
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

    // Bewaar per driver_number alleen de meest recente positie
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
    // STAP 6: Bereken punten per gebruiker (5pt voor exact goed, 2pt voor 1 plek verschil)
    // ------------------------------------------------------------------------
    const scoreUpdates = predictions.map((pred: any) => {
      let points = 0;
      const top10: string[] = pred.top_10_drivers || [];

      top10.forEach((driverCode: string, index: number) => {
        const predictedPosition = index + 1; // Index 0 = P1, Index 1 = P2 ... Index 9 = P10
        const driverNumber = DRIVER_MAP[driverCode];

        if (driverNumber) {
          const actualPosition = latestPositions.get(driverNumber);

          if (actualPosition !== undefined) {
            const diff = Math.abs(predictedPosition - actualPosition);

            if (diff === 0) {
              // Exact goed voorspeld
              points += 5;
            } else if (diff === 1) {
              // 1 plek verschil (bijv. voorspeld op P10, staat P9 of P11)
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