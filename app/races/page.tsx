// Calenderpage
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { headers } from 'next/headers';

// Types voor betere foutcontrole
interface Prediction {
  race_id: number;
  type: 'race' | 'qualy' | 'sprint';
}

interface Race {
  id: number;
  round: number;
  race_name: string;
  city_name: string;
  race_start: string;
  fp1_start: string;
  sprint_race_start?: string;
  qualifying_start: string;
}

export default async function CalendarPage() {
  await headers(); 
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data: races } = await supabase
    .from('races')
    .select('*')
    .order('round', { ascending: true });

  let allPredictions: Prediction[] = [];

  if (user) {
    const [racePreds, qualiPreds, sprintPreds] = await Promise.all([
      supabase.from('predictions_race').select('race_id').eq('user_id', user.id),
      supabase.from('predictions_qualifying').select('race_id').eq('user_id', user.id),
      supabase.from('predictions_sprint').select('race_id').eq('user_id', user.id),
    ]);

    if (racePreds.data) racePreds.data.forEach(p => allPredictions.push({ race_id: p.race_id, type: 'race' }));
    if (qualiPreds.data) qualiPreds.data.forEach(p => allPredictions.push({ race_id: p.race_id, type: 'qualy' }));
    if (sprintPreds.data) sprintPreds.data.forEach(p => allPredictions.push({ race_id: p.race_id, type: 'sprint' }));
  }

  // Aangepaste functie voor de juiste datums
  const formatDateRange = (race: Race) => {
    // Pak de vroegste datum van het weekend (Sprint start vaak eerder dan Qualy/Race)
    // We gebruiken fp1_start als de absolute start van het weekend
    const startDateRaw = race.fp1_start;
    const endDateRaw = race.race_start;

    if (!startDateRaw || !endDateRaw) return "";

    const start = new Date(startDateRaw);
    const end = new Date(endDateRaw);
    const monthEnd = end.toLocaleDateString('nl-NL', { month: 'short' });
    
    // Als start en eind in dezelfde maand vallen: "6-8 mrt"
    if (start.getMonth() === end.getMonth()) {
      return `${start.getDate()}-${end.getDate()} ${monthEnd}`;
    }
    // Als het weekend over twee maanden loopt: "31 mrt - 2 apr"
    const monthStart = start.toLocaleDateString('nl-NL', { month: 'short' });
    return `${start.getDate()} ${monthStart} - ${end.getDate()} ${monthEnd}`;
  };

  return (
    <div className="min-h-screen bg-[#0f111a] text-white p-6 md:p-12 pb-32">
      <div className="max-w-5xl mx-auto">
        
        <header className="mb-12 relative">
          <div className="w-16 md:w-24 h-1 bg-[#e10600] mb-4 shadow-[0_0_15px_rgba(225,6,0,0.5)]"></div>
          <h1 className="font-f1 text-4xl md:text-6xl font-black italic uppercase tracking-tighter">
            F1 Kalender <span className="text-slate-500">2026</span>
          </h1>
        </header>

        {!races || races.length === 0 ? (
          <div className="bg-[#161a23] border border-dashed border-slate-700 p-12 rounded-3xl text-center">
            <p className="text-slate-500 font-medium font-f1 italic uppercase tracking-widest text-xs">De kalender wordt geladen...</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {races.map((race: Race) => {
              const preds = allPredictions.filter(p => p.race_id === race.id);
              const hasQualy = preds.some(p => p.type === 'qualy');
              const hasRace = preds.some(p => p.type === 'race');
              const hasSprint = preds.some(p => p.type === 'sprint');
              const needsSprint = !!race.sprint_race_start;

              const isComplete = needsSprint 
                ? (hasQualy && hasRace && hasSprint) 
                : (hasQualy && hasRace);

              return (
                <Link 
                  key={race.id} 
                  href={`/races/${race.id}`} 
                  className="group relative p-[1px] rounded-3xl transition-all duration-500 overflow-hidden block hover:shadow-[0_0_20px_rgba(225,6,0,0.15)]"
                >
                  <div className={`absolute inset-0 transition-opacity duration-500 ${
                    isComplete 
                      ? 'bg-[conic-gradient(from_180deg_at_0%_50%,#22c55e_0deg,#22c55e_40deg,transparent_90deg)] opacity-100' 
                      : 'bg-[conic-gradient(from_180deg_at_0%_50%,#e10600_0deg,#e10600_40deg,transparent_90deg)] opacity-40 group-hover:opacity-100'
                  }`} />

                  <div className="relative bg-[#161a23] rounded-[calc(1.5rem-1px)] p-6 h-full flex flex-col transition-colors group-hover:bg-[#1c222d]">
                    <div className="flex justify-between items-start mb-4">
                      <span className={`font-f1 ${isComplete ? 'text-green-500' : 'text-slate-500'} uppercase text-xs tracking-[0.2em] leading-none font-black italic`}>
                        Round {race.round}
                      </span>
                      {isComplete && (
                        <div className="text-green-500">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    <h2 className="font-f1 text-2xl font-black italic uppercase mb-1 leading-tight tracking-tight text-white group-hover:text-[#e10600] transition-colors">
                      {race.race_name}
                    </h2>
                    
                    <div className="flex items-center gap-2 mb-8">
                      <p className="text-slate-400 font-f1 font-black uppercase text-sm tracking-wider italic">
                        {race.city_name}
                      </p>
                      <span className="text-slate-700 text-xs">•</span>
                      <p className="text-slate-400 font-f1 text-sm font-bold uppercase tracking-widest italic">
                        {/* Hier roepen we de nieuwe functie aan met het hele race object */}
                        {formatDateRange(race)}
                      </p>
                    </div>

                    <div className="flex gap-3 mt-auto relative z-10">
                      {needsSprint && (
                        <div className="flex flex-col gap-1">
                          <span className="text-[7px] text-slate-600 uppercase font-black tracking-tighter">Sprint</span>
                          <div className={`h-1.5 w-10 rounded-full transition-all duration-500 ${hasSprint ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.3)]' : 'bg-slate-800'}`} />
                        </div>
                      )}
                      <div className="flex flex-col gap-1">
                        <span className="text-[7px] text-slate-600 uppercase font-black tracking-tighter">Qualy</span>
                        <div className={`h-1.5 w-10 rounded-full transition-all duration-500 ${hasQualy ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.3)]' : 'bg-slate-800'}`} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[7px] text-slate-600 uppercase font-black tracking-tighter">Race</span>
                        <div className={`h-1.5 w-10 rounded-full transition-all duration-500 ${hasRace ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.3)]' : 'bg-slate-800'}`} />
                      </div>
                    </div>
                  </div>
                  
                  <div className={`absolute -right-2 -bottom-4 font-f1 text-8xl font-black italic transition-colors select-none pointer-events-none opacity-[0.03] uppercase ${
                    isComplete ? 'text-green-500' : 'text-white'
                  }`}>
                    {race.round}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}