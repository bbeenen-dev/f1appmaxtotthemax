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
  
  const bufferTime = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();

  const { data: race } = await supabase
    .from('races')
    .select('*')
    .gt('race_start', bufferTime) 
    .order('race_start', { ascending: true })
    .limit(1)
    .single();

  if (!race) return <div className="p-8 text-slate-500 font-f1 italic">Geen komende races gevonden...</div>;

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
  const needsSprint = !!race.has_sprint;
  const isComplete = needsSprint ? (hasQualy && hasRace && hasSprint) : (hasQualy && hasRace);

  // Helper voor tijdnotatie (bijv: Vr 14:30)
  const formatSessionTime = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const day = date.toLocaleDateString('nl-NL', { weekday: 'short' }).replace('.', '');
    const time = date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
    return `${day.charAt(0).toUpperCase() + day.slice(1)} ${time}`;
  };

  const formatDateRange = (fp1: string, raceStart: string) => {
    const start = new Date(fp1);
    const end = new Date(raceStart);
    const month = end.toLocaleDateString('nl-NL', { month: 'short' });
    return `${start.getDate()}-${end.getDate()} ${month}`;
  };

  return (
    <Link 
      href={`/races/${race.id}`} 
      className="relative p-6 h-full min-h-[160px] flex flex-col justify-between overflow-hidden group/card border border-white/5 rounded-3xl bg-[#161a23]"
    >
      <div className="flex justify-between items-start mb-2">
        <span className={`font-f1 ${isComplete ? 'text-green-500' : 'text-[#e10600]'} uppercase text-xs tracking-[0.2em] font-black italic`}>
          Round {race.round} • {new Date(race.race_start) > new Date() ? 'Next Event' : 'Live / Recent'}
        </span>
        
        {isComplete && (
          <div className="text-green-500 bg-green-500/10 p-1 rounded-full">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>

      <div className="relative z-10 mb-4">
        <h2 className="font-f1 text-3xl md:text-4xl font-black italic uppercase leading-none tracking-tighter mb-1 group-hover/card:text-[#e10600] transition-colors text-white">
          {race.race_name}
        </h2>
        <div className="flex items-center gap-2">
          <p className="text-slate-300 font-bold uppercase text-[10px] tracking-widest italic font-f1">
            {race.city_name}
          </p>
          <span className="text-slate-700">•</span>
          <p className="text-slate-400 text-[10px] font-bold uppercase italic font-f1">
            {formatDateRange(race.fp1_start, race.race_start)}
          </p>
        </div>
      </div>

      {/* NIEUW: TIJDENSCHEMA SECTIE */}
      <div className="grid grid-cols-5 gap-1 mb-6 relative z-10 border-t border-white/5 pt-4">
        <div className="flex flex-col">
          <span className="text-[7px] text-slate-500 uppercase font-black">FP1</span>
          <span className="text-[10px] text-white font-f1 italic font-bold">{formatSessionTime(race.fp1_start)}</span>
        </div>

        {race.has_sprint ? (
          <>
            <div className="flex flex-col">
              <span className="text-[7px] text-orange-500 uppercase font-black">SQ</span>
              <span className="text-[10px] text-white font-f1 italic font-bold">{formatSessionTime(race.fp2_start)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[7px] text-orange-500 uppercase font-black">Sprint</span>
              <span className="text-[10px] text-white font-f1 italic font-bold">{formatSessionTime(race.sprint_race_start)}</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col">
              <span className="text-[7px] text-slate-500 uppercase font-black">FP2</span>
              <span className="text-[10px] text-white font-f1 italic font-bold">{formatSessionTime(race.fp2_start)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[7px] text-slate-500 uppercase font-black">FP3</span>
              <span className="text-[10px] text-white font-f1 italic font-bold">{formatSessionTime(race.fp3_start)}</span>
            </div>
          </>
        )}

        <div className="flex flex-col">
          <span className="text-[7px] text-[#e10600] uppercase font-black">Qualy</span>
          <span className="text-[10px] text-white font-f1 italic font-bold">{formatSessionTime(race.qualifying_start)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[7px] text-[#e10600] uppercase font-black">Race</span>
          <span className="text-[10px] text-white font-f1 italic font-bold">{formatSessionTime(race.race_start)}</span>
        </div>
      </div>

      <div className="flex gap-3 relative z-10">
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

      <div className="absolute -right-4 -bottom-8 font-f1 text-[100px] font-black italic text-white/[0.03] select-none pointer-events-none uppercase whitespace-nowrap">
        {race.slug || race.race_name}
      </div>
    </Link>
  );
}