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
  const now = new Date().toISOString();

  // 1. Haal de eerstvolgende race op
  const { data: race } = await supabase
    .from('races')
    .select('*')
    .gt('fp1_start', now)
    .order('fp1_start', { ascending: true })
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
        <span className={`font-f1 ${isComplete ? 'text-green-500' : 'text-[#e10600]'} uppercase text-[10px] tracking-[0.2em]`}>
          Round {race.round} • Next Event
        </span>
        {isComplete && (
          <div className="bg-green-500/20 text-green-500 p-1 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>

      <div className="relative z-10">
        <h2 className="font-f1 text-3xl md:text-4xl font-black italic uppercase leading-none tracking-tighter mb-1 group-hover/card:text-[#e10600] transition-colors">
          {race.race_name}
        </h2>
        <div className="flex items-center gap-2">
          <p className="text-slate-300 font-bold uppercase text-xs tracking-widest italic">
            {race.city_name}
          </p>
          <span className="text-slate-700">•</span>
          {/* AANGEPAST: text-xs naar text-sm en slate-500 naar slate-400 voor betere zichtbaarheid */}
          <p className="text-slate-400 text-sm font-bold uppercase italic">
            {formatDateRange(race.fp1_start, race.race_start)}
          </p>
        </div>
      </div>

      <div className="flex gap-3 mt-6 relative z-10">
        <div className="flex flex-col gap-1">
          <span className="text-[8px] text-slate-600 uppercase font-black tracking-tighter">Qualy</span>
          <div className={`h-1.5 w-12 rounded-full transition-colors ${hasQualy ? 'bg-green-500' : 'bg-slate-800'}`} />
        </div>
        {needsSprint && (
          <div className="flex flex-col gap-1">
            <span className="text-[8px] text-slate-600 uppercase font-black tracking-tighter">Sprint</span>
            <div className={`h-1.5 w-12 rounded-full transition-colors ${hasSprint ? 'bg-green-500' : 'bg-slate-800'}`} />
          </div>
        )}
        <div className="flex flex-col gap-1">
          <span className="text-[8px] text-slate-600 uppercase font-black tracking-tighter">Race</span>
          <div className={`h-1.5 w-12 rounded-full transition-colors ${hasRace ? 'bg-green-500' : 'bg-slate-800'}`} />
        </div>
      </div>

      <div className="absolute -right-4 -bottom-8 font-f1 text-[100px] font-black italic text-white/[0.03] select-none pointer-events-none uppercase whitespace-nowrap">
        {race.race_name}
      </div>
    </Link>
  );
}