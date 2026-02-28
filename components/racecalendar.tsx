import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

export default async function RaceCalendar() {
  const supabase = await createClient()
  const now = new Date().toISOString()

  // We halen de eerstvolgende 5 races op om de homepage snel en overzichtelijk te houden
  const { data: races } = await supabase
    .from('races')
    .select('*')
    .gt('fp1_start', now)
    .order('fp1_start', { ascending: true })
    .limit(5)

  // Haal ook de voorspellingen op voor de voortgangs-streepjes
  const { data: { user } } = await supabase.auth.getUser()
  
  // We halen alle voorspellingen op voor de getoonde races
  const raceIds = races?.map(r => r.id) || []
  const { data: allPreds } = user && raceIds.length > 0 
    ? await supabase
        .from('predictions_race') // Je kunt dit uitbreiden naar de andere tabellen indien nodig
        .select('race_id')
        .in('race_id', raceIds)
        .eq('user_id', user.id)
    : { data: [] }

  return (
    <div className="divide-y divide-white/5 bg-[#15151e]">
      {races?.map((race) => {
        const hasPrediction = allPreds?.some(p => p.race_id === race.id)
        const raceDate = new Date(race.race_start)
        
        return (
          <Link 
            key={race.id} 
            href={`/races/${race.id}`}
            className="group flex items-center justify-between p-4 hover:bg-[#1c222d] transition-all duration-300"
          >
            <div className="flex items-center gap-5">
              {/* Datum Column */}
              <div className="flex flex-col items-center min-w-[45px]">
                <span className="font-f1 text-[10px] text-slate-500 uppercase leading-none">
                  {raceDate.toLocaleDateString('nl-NL', { month: 'short' })}
                </span>
                <span className="font-f1 text-lg font-black italic text-white leading-none">
                  {raceDate.getDate()}
                </span>
              </div>

              {/* Race Info */}
              <div className="flex flex-col">
                <span className="text-[9px] font-f1 text-[#e10600] uppercase tracking-widest italic leading-none mb-1">
                  Round {race.round}
                </span>
                <span className="font-f1 text-sm md:text-base font-black italic uppercase text-slate-200 group-hover:text-white transition-colors tracking-tight">
                  {race.race_name}
                </span>
              </div>
            </div>

            {/* Status Indicator (De streepjes in het klein) */}
            <div className="flex items-center gap-4">
              <div className="flex gap-1">
                 <div className={`h-1 w-3 rounded-full ${hasPrediction ? 'bg-green-500' : 'bg-slate-800'}`} />
                 <div className={`h-1 w-3 rounded-full bg-slate-800`} /> {/* Mockup voor de andere 2 streepjes */}
                 <div className={`h-1 w-3 rounded-full bg-slate-800`} />
              </div>
              <span className="font-f1 text-[#e10600] text-xl transform translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                →
              </span>
            </div>
          </Link>
        )
      })}
      
      {(!races || races.length === 0) && (
        <div className="p-8 text-center text-slate-600 font-f1 italic uppercase text-[10px] tracking-widest">
          Geen komende GP's gevonden
        </div>
      )}
    </div>
  )
}