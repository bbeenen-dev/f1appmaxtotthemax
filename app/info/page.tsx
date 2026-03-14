import { createClient } from '@/utils/supabase/server';
import { headers } from 'next/headers';
import Link from 'next/link';

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
        <header className="mb-16"> {/* Iets minder marge onder header */}
          <div className="w-12 h-1 bg-[#e10600] mb-6 shadow-[0_0_10px_rgba(225,6,0,0.5)]"></div>
          <h1 className="font-f1 text-5xl md:text-8xl font-black italic uppercase tracking-tighter leading-none mb-8">
            Welkom, <span className="text-[#e10600]">{nickname}!</span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl font-medium leading-relaxed italic max-w-2xl border-l-2 border-[#e10600] pl-6">
            Eindelijk onze eigen Formule 1 poule app. Gemaakt onder dwang en onder protest omdat de andere apps zuigen!
          </p>
        </header>

        <div className="grid gap-12"> {/* Gap verlaagd van 16 naar 12 */}
          
          {/* SECTIE: INZET & PRIJZEN */}
          <section>
            <h2 className="font-f1 text-3xl font-black italic uppercase tracking-tight mb-8">
              Inzet & Prijzen
            </h2>
            
            <div className="space-y-12">
              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <p className="text-4xl font-f1 italic font-black uppercase text-white">
                    €10 <span className="text-white text-xl italic font-bold tracking-normal lowercase ml-2">per deelnemer</span>
                  </p>
                  <div className="text-slate-400 text-lg md:text-xl font-medium leading-relaxed italic max-w-2xl">
                    <p className="mb-4">De prijzenpot van 130 euro wordt beheerd door Boudewijn in een Bitcoin Wallet</p>
                    <p className="text-white not-italic font-bold uppercase tracking-wider text-sm mb-3">Verdeling prijzenpot:</p>
                    <ul className="space-y-2 not-italic">
                      <li className="flex items-center gap-3">
                        <span className="w-2 h-2 bg-[#e10600] rounded-full shadow-[0_0_5px_#e10600]"></span>
                        <span>80% Winnaar</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <span className="w-2 h-2 bg-[#e10600] rounded-full shadow-[0_0_5px_#e10600]"></span>
                        <span>20% Runner-up</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 py-8 border-y border-slate-800/50">
                <div className="flex items-center gap-4">
                  <p className="text-lg uppercase font-black tracking-[0.15em] text-slate-300">Tikkie Status</p>
                  <div className="text-green-500">
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-lg uppercase font-black tracking-[0.15em] text-slate-300">Aankoop BTC</p>
                  <div className="text-green-500">
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTIE: PUNTENTELLING */}
          <section>
            <h2 className="font-f1 text-3xl font-black italic uppercase tracking-tight mb-8"> {/* mb-10 naar mb-8 */}
              Puntentelling
            </h2>
            
            <div className="grid gap-10"> {/* gap-12 naar gap-10 */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-6">
                <div>
                  <h3 className="font-f1 text-xl font-black italic uppercase text-[#e10600]">Sprint Race</h3>
                  <p className="text-lg uppercase font-black tracking-[0.15em] text-slate-400 mt-1">Top 8 goed voorspellen</p>
                </div>
                <p className="font-f1 font-black italic uppercase text-xl text-white">1 PT</p>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-6">
                <div>
                  <h3 className="font-f1 text-xl font-black italic uppercase text-[#e10600]">Kwalificatie</h3>
                  <p className="text-lg uppercase font-black tracking-[0.15em] text-slate-400 mt-1">Top 3 goed voorspellen</p>
                </div>
                <p className="font-f1 font-black italic uppercase text-xl text-white">3 PT</p>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-6">
                <div className="flex-1">
                  <h3 className="font-f1 text-xl font-black italic uppercase text-[#e10600]">Grand Prix</h3>
                  <p className="text-lg uppercase font-black tracking-[0.15em] text-slate-400 mt-1">Top 10 goed voorspellen</p>
                </div>
                <div className="flex flex-col items-start gap-1">
                  <p className="font-f1 font-black italic uppercase text-xl text-white">5 PT <span className="text-slate-500 text-xs tracking-normal font-bold">goed</span></p>
                  <p className="font-f1 font-black italic uppercase text-xl text-white">2 PT <span className="text-slate-500 text-xs tracking-normal font-bold">ernaast</span></p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-6">
                <div>
                  <h3 className="font-f1 text-xl font-black italic uppercase text-[#e10600]">Seizoen Bonus</h3>
                  <p className="text-lg uppercase font-black tracking-[0.15em] text-slate-400 mt-1">WDC & WCC Titels</p>
                </div>
                <p className="font-f1 font-black italic uppercase text-xl text-white">25 PT</p>
              </div>
            </div>
          </section>

          {/* SECTIE: SUPPORT (COMPACTER) */}
          <section className="mt-4 pt-8 border-t border-slate-800/50"> {/* mt-12 pt-12 naar mt-4 pt-8 */}
            <h2 className="font-f1 text-2xl font-black italic uppercase tracking-tight mb-6">
              Support
            </h2>
            
            <Link href="/info/complaints" className="group block relative">
              <div className="relative bg-[#161a23] p-5 rounded-2xl border border-slate-800 group-hover:border-[#e10600]/50 transition-all shadow-xl overflow-hidden">
                <div className="relative flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-f1 font-black italic uppercase text-white group-hover:text-[#e10600] transition-colors">
                      Klachten indienen
                    </h3>
                    <p className="text-slate-500 text-[10px] font-bold italic uppercase tracking-[0.1em]">
                      Speciaal voor Happie
                    </p>
                  </div>
                  <span className="text-[#e10600] text-xl font-f1 font-black italic transform group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </Link>
          </section>

        </div>
      </div>
    </div>
  );
}