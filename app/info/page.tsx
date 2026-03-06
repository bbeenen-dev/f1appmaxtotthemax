import { createClient } from '@/utils/supabase/server';
import { headers } from 'next/headers';

export default async function InfoPage() {
  await headers();
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  let nickname = "Racer"; 

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('nickname')
      .eq('id', user.id)
      .single();
    
    if (profile?.nickname) {
      nickname = profile.nickname;
    }
  }

  return (
    <div className="min-h-screen bg-[#0f111a] text-white p-6 md:p-12 pb-32">
      <div className="max-w-4xl mx-auto">
        
        {/* WELKOM SECTIE */}
        <header className="mb-20">
          <div className="w-12 h-1 bg-[#e10600] mb-6"></div>
          <h1 className="font-f1 text-5xl md:text-8xl font-black italic uppercase tracking-tighter leading-none mb-8">
            Welkom, <span className="text-[#e10600]">{nickname}!</span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl font-medium leading-relaxed italic max-w-2xl border-l-2 border-[#e10600] pl-6">
            Eindelijk onze eigen Formule 1 poule app. Gemaakt onder dwang en onder protest omdat de andere apps zuigen!
          </p>
        </header>

        <div className="grid gap-16">
          
          {/* SECTIE: INZET & PRIJZEN */}
          <section>
            <h2 className="font-f1 text-3xl font-black italic uppercase tracking-tight mb-8">
              Inzet & Prijzen
            </h2>
            
            <div className="space-y-6">
              <div className="flex flex-col gap-1">
                <p className="text-2xl font-f1 italic font-black uppercase">
                  €10 <span className="text-slate-500 text-sm italic font-medium tracking-normal lowercase">per deelnemer</span>
                </p>
                <p className="text-white text-sm italic opacity-80 uppercase tracking-wider font-bold">
                  Beheerd in Bitcoin (BTC) door Boudewijn
                </p>
              </div>

              <div className="flex flex-wrap gap-8 py-6 border-y border-slate-800/50">
                <div className="flex items-center gap-2">
                  <p className="text-xs uppercase font-bold tracking-widest text-slate-400">
                    Tikkie Status
                  </p>
                  <div className="text-green-500">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-xs uppercase font-bold tracking-widest text-slate-400">
                    Verdeling: <span className="text-white">80% Winnaar / 20% Runner-up</span>
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* SECTIE: PUNTENTELLING */}
          <section>
            <h2 className="font-f1 text-3xl font-black italic uppercase tracking-tight mb-10">
              Puntentelling
            </h2>
            
            <div className="grid gap-12">
              {/* Sprint */}
              <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-2 border-b border-slate-900 pb-6">
                <div>
                  <h3 className="font-f1 text-xl font-black italic uppercase text-white">Sprint Race</h3>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1">Top 8 correct voorspellen</p>
                </div>
                <p className="font-f1 font-black italic uppercase text-lg text-white">
                  1 PT <span className="text-slate-600 text-xs tracking-normal">per plek</span>
                </p>
              </div>

              {/* Qualy */}
              <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-2 border-b border-slate-900 pb-6">
                <div>
                  <h3 className="font-f1 text-xl font-black italic uppercase text-white">Kwalificatie</h3>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1">Top 3 correct voorspellen</p>
                </div>
                <p className="font-f1 font-black italic uppercase text-lg text-white">
                  3 PT <span className="text-slate-600 text-xs tracking-normal">per plek</span>
                </p>
              </div>

              {/* Race */}
              <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-2 border-b border-slate-900 pb-6">
                <div>
                  <h3 className="font-f1 text-xl font-black italic uppercase text-white">Grand Prix</h3>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1">Top 10 correct voorspellen</p>
                </div>
                <div className="text-right">
                  <p className="font-f1 font-black italic uppercase text-lg text-white">5 PT exact goed</p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">2 PT één plek ernaast</p>
                </div>
              </div>

              {/* Kampioenschap */}
              <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-2 border-b border-slate-900 pb-6">
                <div>
                  <h3 className="font-f1 text-xl font-black italic uppercase text-[#e10600]">Seizoen Bonus</h3>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1">WDC & WCC Titels</p>
                </div>
                <p className="font-f1 font-black italic uppercase text-lg text-white">
                  25 PT <span className="text-slate-600 text-xs tracking-normal">per titel</span>
                </p>
              </div>
            </div>
          </section>

        </div>

        <footer className="mt-32 pb-12 opacity-20">
          <p className="text-white text-[9px] uppercase tracking-[0.6em] font-black italic text-center">
            F1 Prediction League 2026
          </p>
        </footer>
      </div>
    </div>
  );
}