import { createClient } from '@/utils/supabase/server';
import { headers } from 'next/headers';

export default async function InfoPage() {
  await headers();
  const supabase = await createClient();
  
  // Haal de huidige gebruiker en hun profiel op
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
      <div className="max-w-3xl mx-auto">
        
        {/* WELKOM SECTIE */}
        <header className="mb-16 relative">
          <div className="w-16 h-1 bg-[#e10600] mb-4 shadow-[0_0_15px_rgba(225,6,0,0.5)]"></div>
          <h1 className="font-f1 text-4xl md:text-6xl font-black italic uppercase tracking-tighter leading-none">
            Welkom, <span className="text-[#e10600]">{nickname}!</span>
          </h1>
          <p className="mt-6 text-slate-400 font-medium leading-relaxed italic border-l-2 border-slate-800 pl-6 max-w-xl">
            Eindelijk onze eigen Formule 1 poule app. Ontworpen voor snelheid en precisie, precies zoals de sport zelf.
          </p>
        </header>

        <div className="space-y-12">
          
          {/* SECTIE: INZET & PRIJZEN */}
          <section className="bg-[#161a23] rounded-3xl p-8 border border-slate-800 shadow-2xl">
            <h2 className="font-f1 text-2xl font-black italic uppercase text-white mb-6 tracking-tight flex items-center gap-3">
              <span className="w-2 h-6 bg-[#e10600]"></span>
              Inzet & Prijzen
            </h2>
            
            <div className="space-y-8">
              <p className="text-slate-300 leading-relaxed">
                De inzet is <span className="text-white font-bold">10 euro per persoon</span>. De totale pot wordt beheerd in Bitcoin door Boudewijn.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#0f111a] p-5 rounded-2xl border border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-black mb-2 tracking-widest">Tikkie Deadline</p>
                  <p className="text-sm font-f1 italic uppercase">Vrijdag 6 maart <span className="text-white font-bold">20:00u</span></p>
                </div>
                <div className="bg-[#0f111a] p-5 rounded-2xl border border-slate-800">
                  <p className="text-[10px] text-slate-500 uppercase font-black mb-2 tracking-widest">BTC Transactie</p>
                  <p className="text-sm font-f1 italic uppercase">Aankoop: <span className="text-white font-bold text-xs">Vrijdag 21:00u</span></p>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-6">
                <p className="text-xs text-slate-400 leading-loose uppercase tracking-tight">
                  Verkoop vindt plaats op de dag van de laatste race om <span className="text-white font-bold">21:00u</span>. 
                  <br />
                  <span className="inline-block mt-2 bg-slate-800 text-white px-3 py-1 rounded-md font-bold italic mr-2">1e Plek: 80%</span>
                  <span className="inline-block mt-2 bg-slate-800 text-white px-3 py-1 rounded-md font-bold italic">2e Plek: 20%</span>
                </p>
              </div>
            </div>
          </section>

          {/* SECTIE: PUNTENTELLING */}
          <section className="bg-[#161a23] rounded-3xl p-8 border border-slate-800 shadow-2xl">
            <h2 className="font-f1 text-2xl font-black italic uppercase text-white mb-10 tracking-tight flex items-center gap-3">
              <span className="w-2 h-6 bg-white"></span>
              Puntentelling
            </h2>
            
            <div className="grid gap-10">
              {/* Sprint */}
              <div className="flex gap-6 items-start">
                <div className="text-slate-700 font-f1 text-3xl font-black italic leading-none">01</div>
                <div>
                  <h3 className="font-f1 text-lg font-black italic uppercase text-white mb-1">Sprint Race</h3>
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-3 tracking-tighter">Top 8 correct voorspellen</p>
                  <span className="border border-slate-700 text-slate-300 px-3 py-1 rounded-md text-[10px] font-black uppercase italic">1 PT per goede plek</span>
                </div>
              </div>

              {/* Qualy */}
              <div className="flex gap-6 items-start">
                <div className="text-slate-700 font-f1 text-3xl font-black italic leading-none">02</div>
                <div>
                  <h3 className="font-f1 text-lg font-black italic uppercase text-white mb-1">Kwalificatie</h3>
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-3 tracking-tighter">Top 3 correct voorspellen</p>
                  <span className="border border-slate-700 text-slate-300 px-3 py-1 rounded-md text-[10px] font-black uppercase italic">3 PT per goede plek</span>
                </div>
              </div>

              {/* Race */}
              <div className="flex gap-6 items-start">
                <div className="text-slate-700 font-f1 text-3xl font-black italic leading-none">03</div>
                <div>
                  <h3 className="font-f1 text-lg font-black italic uppercase text-white mb-1">Grand Prix</h3>
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-3 tracking-tighter">Top 10 correct voorspellen</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-white text-black px-3 py-1 rounded-md text-[10px] font-black uppercase italic">5 PT exact goed</span>
                    <span className="border border-slate-700 text-slate-400 px-3 py-1 rounded-md text-[10px] font-black uppercase italic">2 PT één plek ernaast</span>
                  </div>
                </div>
              </div>

              {/* Kampioenschap */}
              <div className="flex gap-6 items-start">
                <div className="text-slate-700 font-f1 text-3xl font-black italic leading-none">04</div>
                <div>
                  <h3 className="font-f1 text-lg font-black italic uppercase text-white mb-1">Seizoen Bonus</h3>
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-3 tracking-tighter">Wereldkampioenen voorspellen</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-[#e10600] text-white px-3 py-1 rounded-md text-[10px] font-black uppercase italic shadow-[0_0_10px_rgba(225,6,0,0.3)]">Coureur: 25 PT</span>
                    <span className="bg-[#e10600] text-white px-3 py-1 rounded-md text-[10px] font-black uppercase italic shadow-[0_0_10px_rgba(225,6,0,0.3)]">Constructeur: 25 PT</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

        </div>

        <footer className="mt-24 pt-8 border-t border-slate-900 text-center">
          <p className="text-slate-700 text-[9px] uppercase tracking-[0.4em] font-bold italic">
            F1 Prediction League 2026 • Data Driven Competition
          </p>
        </footer>
      </div>
    </div>
  );
}