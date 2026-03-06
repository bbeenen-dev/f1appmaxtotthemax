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
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-1 bg-[#e10600]"></div>
            <span className="text-[#e10600] font-f1 font-black uppercase tracking-[0.3em] text-sm italic">Official Rules</span>
          </div>
          <h1 className="font-f1 text-5xl md:text-8xl font-black italic uppercase tracking-tighter leading-none mb-8">
            Welkom, <span className="text-[#e10600]">{nickname}!</span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl font-medium leading-relaxed italic max-w-2xl border-l-2 border-[#e10600] pl-6">
            Eindelijk onze eigen Formule 1 poule app. Gemaakt onder dwang en onder protest omdat volgens de kenners de andere apps zuigen!
          </p>
        </header>

        <div className="grid gap-8">
          
          {/* SECTIE: INZET & PRIJZEN */}
          <section className="group">
            <div className="bg-[#161a23] rounded-2xl p-8 border border-slate-800/50 transition-all duration-300 group-hover:border-[#e10600]/30 shadow-xl">
              <div className="flex items-center justify-between mb-10">
                <h2 className="font-f1 text-2xl font-black italic uppercase tracking-tight flex items-center gap-3">
                  Inzet & Prijzen
                </h2>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">Season 2026</span>
              </div>
              
              <div className="grid md:grid-cols-2 gap-12">
                <div className="space-y-4">
                  <p className="text-slate-400 leading-relaxed uppercase text-xs font-bold tracking-widest">De Pot</p>
                  <p className="text-2xl font-f1 italic font-black uppercase">
                    €10 <span className="text-slate-500 text-sm italic font-medium tracking-normal">per deelnemer</span>
                  </p>
                  <p className="text-sm text-slate-500 italic">
                    Beheerd in Bitcoin (BTC) door Banker Boudewijn.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                    <p className="text-[9px] text-[#e10600] uppercase font-black mb-1">Winnaar</p>
                    <p className="text-xl font-f1 font-black italic">80%</p>
                  </div>
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                    <p className="text-[9px] text-slate-500 uppercase font-black mb-1">Runner-up</p>
                    <p className="text-xl font-f1 font-black italic">20%</p>
                  </div>
                </div>
              </div>

              <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-800/50 pt-8">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-[#e10600] animate-pulse"></div>
                  <p className="text-[10px] md:text-xs uppercase font-bold tracking-widest text-slate-400">
                    Tikkie Deadline: <span className="text-white">6 Maart 20:00u</span>
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  <p className="text-[10px] md:text-xs uppercase font-bold tracking-widest text-slate-400">
                    BTC Aankoop: <span className="text-white">6 Maart 21:00u</span>
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* SECTIE: PUNTENTELLING */}
          <section className="bg-[#161a23] rounded-2xl border border-slate-800/50 shadow-xl overflow-hidden">
            <div className="bg-slate-900/50 p-8 border-b border-slate-800/50">
               <h2 className="font-f1 text-2xl font-black italic uppercase tracking-tight flex items-center gap-3">
                  Puntentelling
                </h2>
            </div>
            
            <div className="divide-y divide-slate-800/50">
              {/* Sprint */}
              <div className="p-8 hover:bg-white/[0.02] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h3 className="font-f1 text-lg font-black italic uppercase text-[#e10600] mb-1">Sprint Race</h3>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Top 8 correct voorspellen</p>
                </div>
                <div className="bg-slate-900 px-6 py-3 rounded-lg border border-slate-800">
                  <span className="text-sm font-f1 font-black uppercase italic italic text-slate-200">1 PT <span className="text-slate-500 text-[10px] tracking-normal">per plek</span></span>
                </div>
              </div>

              {/* Qualy */}
              <div className="p-8 hover:bg-white/[0.02] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h3 className="font-f1 text-lg font-black italic uppercase text-white mb-1">Kwalificatie</h3>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Top 3 correct voorspellen</p>
                </div>
                <div className="bg-slate-900 px-6 py-3 rounded-lg border border-slate-800">
                  <span className="text-sm font-f1 font-black uppercase italic text-slate-200">3 PT <span className="text-slate-500 text-[10px] tracking-normal">per plek</span></span>
                </div>
              </div>

              {/* Race */}
              <div className="p-8 hover:bg-white/[0.02] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h3 className="font-f1 text-lg font-black italic uppercase text-white mb-1">De hoofdrace</h3>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Top 10 correct voorspellen</p>
                </div>
                <div className="flex gap-2">
                  <div className="bg-white text-black px-4 py-2 rounded-lg text-[10px] font-black uppercase italic">
                    5 PT Exact
                  </div>
                  <div className="bg-slate-800 text-slate-300 px-4 py-2 rounded-lg text-[10px] font-black uppercase italic border border-slate-700">
                    2 PT ±1 plek
                  </div>
                </div>
              </div>

              {/* Kampioenschap */}
              <div className="p-8 hover:bg-white/[0.02] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h3 className="font-f1 text-lg font-black italic uppercase text-white mb-1">Seizoen Bonus</h3>
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">World Champions</p>
                </div>
                <div className="bg-[#e10600] px-6 py-3 rounded-lg shadow-[0_0_20px_rgba(225,6,0,0.2)]">
                  <span className="text-sm font-f1 font-black uppercase italic text-white italic">25 PT <span className="text-white/60 text-[10px] tracking-normal uppercase">per titel</span></span>
                </div>
              </div>
            </div>
          </section>

        </div>

        <footer className="mt-32 pb-12 text-center">
          <div className="flex justify-center gap-2 mb-6">
            <div className="w-1 h-1 bg-slate-800"></div>
            <div className="w-1 h-1 bg-slate-800"></div>
            <div className="w-1 h-1 bg-slate-800"></div>
          </div>
          <p className="text-slate-700 text-[9px] uppercase tracking-[0.6em] font-black italic">
            F1 Prediction League 2026 • Data Driven Competition
          </p>
        </footer>
      </div>
    </div>
  );
}