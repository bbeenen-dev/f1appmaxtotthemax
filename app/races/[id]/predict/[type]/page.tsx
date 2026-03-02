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
    <div className="min-h-screen bg-[#0f111a] text-white p-4 md:p-8 pb-32">
      {/* Container breedte: max-w-5xl */}
      <div className="max-w-5xl mx-auto">
        
        {/* WELKOM SECTIE */}
        <header className="mb-16 relative">
          <div className="w-20 h-1.5 bg-[#e10600] mb-6 shadow-[0_0_15px_rgba(225,6,0,0.5)]"></div>
          <h1 className="font-f1 text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-none">
            Welkom, <span className="text-[#e10600]">{nickname}!</span>
          </h1>
          <p className="mt-8 text-slate-300 text-lg md:text-xl font-medium leading-relaxed italic border-l-4 border-slate-800 pl-8">
            Eindelijk onze eigen Formule 1 poule app. Ontworpen voor snelheid en precisie, precies zoals de sport zelf.
          </p>
        </header>

        <div className="space-y-12">
          
          {/* SECTIE: INZET & PRIJZEN */}
          <section className="bg-[#161a23] rounded-3xl p-6 md:p-10 border border-slate-800 shadow-2xl">
            <h2 className="font-f1 text-3xl font-black italic uppercase text-white mb-8 tracking-tight flex items-center gap-4">
              <span className="w-3 h-8 bg-[#e10600]"></span>
              Inzet & Prijzen
            </h2>
            
            <div className="space-y-10">
              <p className="text-slate-300 text-lg md:text-xl leading-relaxed">
                De inzet is <span className="text-white font-bold">10 euro per persoon</span>. De totale pot wordt beheerd in Bitcoin door Boudewijn.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#0f111a] p-6 rounded-2xl border border-slate-800 flex flex-col justify-center">
                  <p className="text-[11px] text-slate-500 uppercase font-black mb-2 tracking-[0.2em]">Tikkie Deadline</p>
                  <p className="text-base md:text-lg font-f1 italic uppercase">Vrijdag 6 maart <span className="text-white font-bold">20:00u</span></p>
                </div>
                <div className="bg-[#0f111a] p-6 rounded-2xl border border-slate-800 flex flex-col justify-center">
                  <p className="text-[11px] text-slate-500 uppercase font-black mb-2 tracking-[0.2em]">BTC Transactie</p>
                  <p className="text-base md:text-lg font-f1 italic uppercase">Aankoop: <span className="text-white font-bold">Vrijdag 21:00u</span></p>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-8">
                <p className="text-sm md:text-base text-slate-400 leading-relaxed uppercase tracking-wide">
                  Verkoop vindt plaats op de dag van de laatste race om <span className="text-white font-bold">21:00u</span>. 
                  <br className="hidden md:block" />
                  <span className="inline-block mt-4 bg-slate-800 text-white px-5 py-2 rounded-lg font-bold italic mr-3 border border-slate-700">1e Plek: 80%</span>
                  <span className="inline-block mt-4 bg-slate-800 text-white px-5 py-2 rounded-lg font-bold italic border border-slate-700">2e Plek: 20%</span>
                </p>
              </div>
            </div>
          </section>

          {/* SECTIE: PUNTENTELLING */}
          <section className="bg-[#161a23] rounded-3xl p-6 md:p-10 border border-slate-800 shadow-2xl">
            <h2 className="font-f1 text-3xl font-black italic uppercase text-white mb-12 tracking-tight flex items-center gap-4">
              <span className="w-3 h-8 bg-white"></span>
              Puntentelling
            </h2>
            
            <div className="grid gap-12">
              {/* Sprint */}
              <div className="flex gap-8 items-start">
                <div className="text-slate-800 font-f1 text-4xl md:text-5xl font-black italic leading-none opacity-50">01</div>
                <div className="flex-1">
                  <h3 className="font-f1 text-xl md:text-2xl font-black italic uppercase text-white mb-2">Sprint Race</h3>
                  <p className="text-xs md:text-sm text-slate-500 uppercase font-bold mb-4 tracking-wider">Top 8 correct voorspellen</p>
                  <span className="border border-slate-700 text-slate-200 px-4 py-2 rounded-lg text-xs md:text-sm font-black uppercase italic">1 PT per goede plek</span>
                </div>
              </div>

              {/* Qualy */}
              <div className="flex gap-8 items-start">
                <div className="text-slate-800 font-f1 text-4xl md:text-5xl font-black italic leading-none opacity-50">02</div>
                <div className="flex-1">
                  <h3 className="font-f1 text-xl md:text-2xl font-black italic uppercase text-white mb-2">Kwalificatie</h3>
                  <p className="text-xs md:text-sm text-slate-500 uppercase font-bold mb-4 tracking-wider">Top 3 correct voorspellen</p>
                  <span className="border border-slate-700 text-slate-200 px-4 py-2 rounded-lg text-xs md:text-sm font-black uppercase italic">3 PT per goede plek</span>
                </div>
              </div>

              {/* Race */}
              <div className="flex gap-8 items-start">
                <div className="text-slate-800 font-f1 text-4xl md:text-5xl font-black italic leading-none opacity-50">03</div>
                <div className="flex-1">
                  <h3 className="font-f1 text-xl md:text-2xl font-black italic uppercase text-white mb-2">Grand Prix</h3>
                  <p className="text-xs md:text-sm text-slate-500 uppercase font-bold mb-4 tracking-wider">Top 10 correct voorspellen</p>
                  <div className="flex flex-wrap gap-3">
                    <span className="bg-white text-black px-4 py-2 rounded-lg text-xs md:text-sm font-black uppercase italic">5 PT exact goed</span>
                    <span className="border border-slate-700 text-slate-300 px-4 py-2 rounded-lg text-xs md:text-sm font-black uppercase italic">2 PT één plek ernaast</span>
                  </div>
                </div>
              </div>

              {/* Kampioenschap */}
              <div className="flex gap-8 items-start">
                <div className="text-slate-800 font-f1 text-4xl md:text-5xl font-black italic leading-none opacity-50">04</div>
                <div className="flex-1">
                  <h3 className="font-f1 text-xl md:text-2xl font-black italic uppercase text-white mb-2">Seizoen Bonus</h3>
                  <p className="text-xs md:text-sm text-slate-500 uppercase font-bold mb-4 tracking-wider">Wereldkampioenen voorspellen</p>
                  <div className="flex flex-wrap gap-3">
                    <span className="bg-[#e10600] text-white px-4 py-2 rounded-lg text-xs md:text-sm font-black uppercase italic shadow-[0_0_15px_rgba(225,6,0,0.3)]">Coureur: 25 PT</span>
                    <span className="bg-[#e10600] text-white px-4 py-2 rounded-lg text-xs md:text-sm font-black uppercase italic shadow-[0_0_15px_rgba(225,6,0,0.3)]">Constructeur: 25 PT</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

        </div>

        <footer className="mt-24 pt-10 border-t border-slate-900 text-center">
          <p className="text-slate-700 text-[10px] md:text-xs uppercase tracking-[0.5em] font-bold italic">
            F1 Prediction League 2026 • Data Driven Competition
          </p>
        </footer>
      </div>
    </div>
  );
}