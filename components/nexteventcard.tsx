import { createClient } from '@/utils/supabase/server';
import { headers } from 'next/headers';
import Link from 'next/link';

interface Prediction {
  race_id: number;
  type: 'race' | 'qualy' | 'sprint';
}

export default async function NextEventCard() {
  await headers();
  const supabase = await createClient();
  
  // We berekenen een 'buffer tijd': 3 uur in het verleden.
  // Hierdoor blijft de race op de homepage staan tot 3 uur na de officiële starttijd.
  const bufferTime = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();

  // 1. Haal de eerstvolgende race op op basis van de race_start (zondag)
  const { data: race } = await supabase
    .from('races')
    .select('*')
    .gt('race_start', bufferTime) 
    .order('race_start', { ascending: true })
    .limit(1)
    .single();

  if (!race) return <div className="p-8 text-slate-500 font-f1 italic">Geen komende races gevonden...</div>;

  // 2. Haal voorspellingen op voor deze specifieke race
  const { data: { user } } = await supabase.auth.getUser();
  let preds: Prediction[] = [];

  if (user) {
    const [racePreds, qualiPreds, sprintPreds] = await Promise.all([
      supabase.from('predictions_race').select('race_id').eq('user_id', user.id).eq('race_id', race.id),
      supabase.from('predictions_qualifying').select('race_id').eq('user_id', user.id).eq('race_id', race.id),
      supabase.from('predictions_sprint').select('race_id').eq('user_id', user.id).eq('race_id', race.id),
    ]);

    if (racePreds.data?.length) preds.push({ race_id: race.id, type: 'race' });
    if (qualiPreds.data?.length) preds.push({ race_id: race.id, type: 'qualy' });
    if (sprintPreds.data?.length) preds.push({ race_id: race.id, type: 'sprint' });
  }

  const hasQualy = preds.some(p => p.type === 'qualy');
  const hasRace = preds.some(p => p.type === 'race');
  const hasSprint = preds.some(p => p.type === 'sprint');
  const needsSprint = !!race.sprint_race_start;
  const isComplete = needsSprint ? (hasQualy && hasRace && hasSprint) : (hasQualy && hasRace);

  const formatDateRange = (fp1: string, raceStart: string) => {
    const start = new Date(fp1);
    const end = new Date(raceStart);
    const month = end.toLocaleDateString('nl-NL', { month: 'short' });
    return `${start.getDate()}-${end.getDate()} ${month}`;
  };

  return (
    <Link 
      href={`/races/${race.id}`} 
      className="relative p-6 h-full min-h-[160px] flex flex-col justify-between overflow-hidden group/card"
    >
      <div className="flex justify-between items-start mb-2">
        <span className={`font-f1 ${isComplete ? 'text-green-500' : 'text-[#e10600]'} uppercase text-xs tracking-[0.2em] font-black italic`}>
          Round {race.round} • {new Date(race.race_start) > new Date() ? 'Next Event' : 'Live / Recent'}
        </span>
        
        {isComplete && (
          <div className="text-green-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>

      <div className="relative z-10">
        <h2 className="font-f1 text-3xl md:text-4xl font-black italic uppercase leading-none tracking-tighter mb-1 group-hover/card:text-[#e10600] transition-colors text-white">
          {race.race_name}
        </h2>
        <div className="flex items-center gap-2">
          <p className="text-slate-300 font-bold uppercase text-xs tracking-widest italic font-f1">
            {race.city_name}
          </p>
          <span className="text-slate-700">•</span>
          <p className="text-slate-400 text-sm font-bold uppercase italic font-f1">
            {formatDateRange(race.fp1_start, race.race_start)}
          </p>
        </div>
      </div>

      <div className="flex gap-3 mt-6 relative z-10">
        <div className="flex flex-col gap-1">
          <span className="text-[8px] text-slate-600 uppercase font-black tracking-tighter">Qualy</span>
          <div className={`h-1.5 w-12 rounded-full transition-all duration-500 ${hasQualy ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.3)]' : 'bg-slate-800'}`} />
        </div>
        {needsSprint && (
          <div className="flex flex-col gap-1">
            <span className="text-[8px] text-slate-600 uppercase font-black tracking-tighter">Sprint</span>
            <div className={`h-1.5 w-12 rounded-full transition-all duration-500 ${hasSprint ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.3)]' : 'bg-slate-800'}`} />
          </div>
        )}
        <div className="flex flex-col gap-1">
          <span className="text-[8px] text-slate-600 uppercase font-black tracking-tighter">Race</span>
          <div className={`h-1.5 w-12 rounded-full transition-all duration-500 ${hasRace ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.3)]' : 'bg-slate-800'}`} />
        </div>
      </div>

      {/* Achtergrondtekst subtieler gemaakt */}
      <div className="absolute -right-4 -bottom-8 font-f1 text-[100px] font-black italic text-white/[0.03] select-none pointer-events-none uppercase whitespace-nowrap">
        {race.race_name}
      </div>
    </Link>
  );
}