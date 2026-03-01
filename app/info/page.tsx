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
        <header className="mb-12 relative">
          <div className="w-16 h-1 bg-[#e10600] mb-4 shadow-[0_0_15px_rgba(225,6,0,0.5)]"></div>
          <h1 className="font-f1 text-4xl md:text-6xl font-black italic uppercase tracking-tighter leading-none">
            Welkom, <span className="text-[#e10600]">{nickname}!</span>
          </h1>
          <p className="mt-6 text-slate-300 font-medium leading-relaxed italic border-l-4 border-[#e10600] pl-4">
            Hierbij eindelijk onze eigen Formule 1 app. Uit nood geboren omdat alle andere apps zuigen!
          </p>
        </header>

        <div className="space-y-10">
          
          {/* SECTIE: INZET & BITCOIN */}
          <section className="bg-[#161a23] rounded-3xl p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="absolute -right-8 -top-8 text-orange-500 opacity-[0.05] rotate-12 pointer-events-none">
               <svg width="200" height="200" viewBox="0 0 24 24" fill="currentColor"><path d="M23.643 12.204c.487-3.257-1.573-5.01-4.246-6.175l.867-3.48-2.118-.528-.844 3.386c-.557-.139-1.127-.269-1.693-.397l.85-3.411-2.118-.527-.867 3.48c-.461-.105-.911-.21-1.343-.319l.002-.01-2.922-.729-.565 2.26s1.572.36 1.539.382c.858.214 1.013.782.987 1.233l-.991 3.974c.059.015.137.034.221.064l-.223-.056-1.388 5.567c-.105.26-.372.651-.973.501.022.032-1.539-.383-1.539-.383l-1.055 2.43 2.758.688c.513.128 1.016.26 1.51.385l-.874 3.507 2.118.527.867-3.48c.578.157 1.139.303 1.688.441l-.863 3.46 2.119.528.875-3.51c3.612.684 6.33.408 7.473-2.859.921-2.63-.041-4.148-1.944-5.143 1.385-.32 2.428-1.233 2.706-3.117zm-4.838 6.793c-.655 2.632-5.093 1.21-6.533.852l1.166-4.674c1.44.359 6.059 1.07 5.367 3.822zm.656-6.83c-.598 2.396-4.298 1.178-5.497.879l1.057-4.238c1.199.299 5.068.857 4.44 3.359z"/></svg>
            </div>

            <h2 className="font-f1 text-2xl font-black italic uppercase text-[#e10600] mb-6 tracking-tight">Inzet & Prijzen</h2>
            
            <div className="space-y-6">
              <p className="text-slate-300 leading-relaxed">
                We zetten allen <span className="text-white font-bold">10 euro per man</span> in. Boudewijn beheert de pot via Bitcoin:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#1c222d] p-4 rounded-2xl border border-slate-700/50">
                  <p className="text-[9px] text-slate-500 uppercase font-black mb-1">Tikkie Deadline</p>
                  <p className="text-sm">Betaal uiterlijk <span className="text-white font-bold italic">vrijdag 6 maart 20:00u</span>.</p>
                </div>
                <div className="bg-[#1c222d] p-4 rounded-2xl border border-slate-700/50">
                  <p className="text-[9px] text-slate-500 uppercase font-black mb-1">BTC Aankoop</p>
                  <p className="text-sm">Vrijdagavond 21:00u worden de Bitcoins gekocht.</p>
                </div>
              </div>

              <div className="bg-orange-500/10 border border-orange-500/30 p-5 rounded-2xl">
                <p className="text-sm text-slate-300">
                  Op de dag van de laatste race worden de Bitcoins om <span className="text-white font-bold italic">21:00u</span> verkocht. 
                  De winnaar ontvangt <span className="text-orange-500 font-black italic">80%</span> en de nr. 2 krijgt <span className="text-orange-500 font-black italic">20%</span>.
                </p>
              </div>
            </div>
          </section>

          {/* SECTIE: PUNTENTELLING */}
          <section className="bg-[#161a23] rounded-3xl p-8 border border-slate-800 shadow-2xl">
            <h2 className="font-f1 text-2xl font-black italic uppercase text-white mb-8 tracking-tight border-b border-slate-800 pb-4">Puntentelling</h2>
            
            <div className="grid gap-8">
              {/* Sprint */}
              <div className="flex gap-4">
                <div className="w-1 bg-orange-500 rounded-full h-auto"></div>
                <div>
                  <h3 className="font-f1 text-lg font-black italic uppercase text-orange-500">Sprint</h3>
                  <p className="text-xs text-slate-400 mb-2">Voorspel de nr. 1 t/m 8</p>
                  <span className="bg-orange-500/20 text-orange-500 px-3 py-1 rounded-full text-[10px] font-black uppercase">1 PT per goede plek</span>
                </div>
              </div>

              {/* Qualy */}
              <div className="flex gap-4">
                <div className="w-1 bg-blue-500 rounded-full h-auto"></div>
                <div>
                  <h3 className="font-f1 text-lg font-black italic uppercase text-blue-500">Qualificatie</h3>
                  <p className="text-xs text-slate-400 mb-2">Voorspel de nr. 1 t/m 3</p>
                  <span className="bg-blue-500/20 text-blue-500 px-3 py-1 rounded-full text-[10px] font-black uppercase">3 PT per goede plek</span>
                </div>
              </div>

              {/* Race */}
              <div className="flex gap-4">
                <div className="w-1 bg-[#e10600] rounded-full h-auto"></div>
                <div>
                  <h3 className="font-f1 text-lg font-black italic uppercase text-[#e10600]">Race</h3>
                  <p className="text-xs text-slate-400 mb-2">Voorspel de nr. 1 t/m 10</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-[#e10600]/20 text-[#e10600] px-3 py-1 rounded-full text-[10px] font-black uppercase whitespace-nowrap">5 PT exact goed</span>
                    <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-[10px] font-black uppercase whitespace-nowrap">2 PT één plek ernaast</span>
                  </div>
                </div>
              </div>

              {/* Kampioenschap */}
              <div className="flex gap-4">
                <div className="w-1 bg-yellow-500 rounded-full h-auto"></div>
                <div>
                  <h3 className="font-f1 text-lg font-black italic uppercase text-yellow-500">Kampioenschap</h3>
                  <p className="text-xs text-slate-400 mb-2">Voorspel de eindstand</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-[10px] font-black uppercase">F1 Kampioen: 25 PT</span>
                    <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-[10px] font-black uppercase">Team Kampioen: 25 PT</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

        </div>

        <footer className="mt-20 pt-8 border-t border-slate-800 text-center">
          <p className="text-slate-600 text-[9px] uppercase tracking-[0.3em] font-bold italic">
            F1 Prediction League 2026 • Made by Fans, for Fans
          </p>
        </footer>
      </div>
    </div>
  );
}