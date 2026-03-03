import NextEventCard from '@/components/nexteventcard'
import RaceCalendar from '@/components/racecalendar'
import Link from 'next/link'
import { Suspense } from 'react'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/server'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  // We roepen headers aan om dynamische rendering te forceren en awaiten de client
  const headerStack = await headers();
  const supabase = await createClient();
  
  // FEATURE FLAGS
  const showMyPredictions = false;

  // 1. DYNAMISCHE PRIJZENPOT LOGICA (Bitcoin Fluctuaat)
  const initialBtcPrice = 58516; // De koers op moment van inleg
  const initialDepositEuro = 120; // De oorspronkelijke inleg
  const fixedBtcAmount = initialDepositEuro / initialBtcPrice; // ≈ 0.00205072 BTC
  
  let currentEuroValue = initialDepositEuro; 
  let currentBtcPrice = initialBtcPrice;

  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=eur',
      { next: { revalidate: 300 } } // 5 minuten cache
    );
    const data = await response.json();
    if (data.bitcoin && data.bitcoin.eur) {
      currentBtcPrice = data.bitcoin.eur;
      currentEuroValue = fixedBtcAmount * currentBtcPrice;
    }
  } catch (error) {
    console.error("BTC API Error:", error);
  }

  // 2. Deadline logica
  const seasonDeadline = new Date('2026-03-06T17:00:00');
  const now = new Date();
  const isBeforeSeasonStart = now < seasonDeadline;

  // 3. Check user & Jaarvoorspelling
  const { data: { user } } = await supabase.auth.getUser();
  let hasPredictedSeason = false;
  
  if (user) {
    const { data } = await supabase
      .from('predictions_season')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (data) hasPredictedSeason = true;
  }

  // 4. Haal Leaderboard data op (Top 10)
  const { data: leaderboard } = await supabase
    .from('leaderboard')
    .select('*')
    .limit(10);

  return (
    <div className="min-h-screen bg-[#0f111a] text-white pb-32 font-f1">
      {/* HERO SECTIE */}
      <div className="relative h-[25vh] w-full overflow-hidden border-b border-slate-800/50">
        <Image src="/hero-2026.JPG" alt="F1 2026" fill priority className="object-cover brightness-[0.7]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#0f111a]" />
        <header className="absolute inset-0 flex flex-col justify-end items-center pb-8 p-4 text-center">
          <div className="w-16 h-1 bg-[#e10600] mb-3 shadow-[0_0_15px_rgba(225,6,0,0.8)]"></div>
          <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-none">
            f1 <span className="text-[#e10600]">poule</span>
          </h1>
        </header>
      </div>

      <div className="max-w-4xl mx-auto space-y-6 p-4 md:p-8 -mt-6 relative z-10">
        
        {/* 0. PRIJZENPOT (FLUCTUEREND) */}
        <section className="group relative p-[1px] rounded-3xl overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[conic-gradient(from_180deg_at_50%_50%,#f7931a_0deg,#f7931a_40deg,transparent_90deg)] opacity-40" />
          <div className="relative bg-[#161a23] rounded-[calc(1.5rem-1px)] p-6 border border-white/5 transition-all group-hover:bg-[#1c222d]">
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1 h-4 bg-[#f7931a]"></div>
                  <h2 className="text-[10px] font-black italic uppercase text-slate-400 tracking-[0.2em]">Live Prijzenpot (BTC)</h2>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-black italic text-white tracking-tighter">
                    €{currentEuroValue.toFixed(2)}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-[#f7931a] font-f1 italic font-black text-[10px] uppercase leading-none">
                      {fixedBtcAmount.toFixed(8)} BTC
                    </span>
                    <span className="text-[8px] text-slate-600 uppercase font-bold mt-1">
                      Koers: €{currentBtcPrice.toLocaleString('nl-NL')}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-center">
                 <div className={`text-[10px] font-black italic mb-1 ${currentEuroValue >= 120 ? 'text-green-500' : 'text-red-500'}`}>
                    {currentEuroValue >= 120 ? '▲' : '▼'} 
                    {(((currentEuroValue - 120) / 120) * 100).toFixed(1)}%
                 </div>
                 <div className="bg-[#f7931a]/10 p-3 rounded-2xl border border-[#f7931a]/20 shadow-[0_0_15px_rgba(247,147,26,0.1)]">
                    <svg className="w-8 h-8 text-[#f7931a]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.638 14.904c-1.602 6.43-8.113 10.34-14.542 8.736C2.67 22.05-1.244 15.556.362 9.103 1.962 2.67 8.473-1.24 14.904.364c6.415 1.61 10.342 8.097 8.734 14.54zm-6.115-3.082c.284-1.897-1.162-2.915-3.136-3.595l.642-2.572-1.565-.39-.625 2.508c-.412-.102-.832-.198-1.248-.292l.63-2.524-1.565-.392-.642 2.572c-.342-.078-.674-.155-1.012-.238l.002-.01-2.158-.54-.417 1.672s1.16.265 1.135.282c.633.158.748.577.728.91l-.73 2.926c.044.01.102.027.166.052l-.168-.042-1.022 4.1c-.078.193-.275.483-.718.374.017.024-1.136-.283-1.136-.283l-.78 1.79 2.037.51c.38.095.753.193 1.12.285l-.647 2.603 1.563.39.643-2.58c.428.117.844.227 1.25.33l-.64 2.565 1.565.39.646-2.595c2.67.505 4.678.303 5.523-2.112.68-1.944-.033-3.065-1.442-3.803.948-.22 1.662-.843 1.855-2.137zm-3.32 4.65c-.484 1.944-3.755.894-4.814.63l.858-3.44c1.06.264 4.453.784 3.956 2.81zm.485-4.685c-.44 1.766-3.16.87-4.04.65l.78-3.128c.88.22 3.71.63 3.26 2.478z"/>
                    </svg>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* 1. NEXT EVENT */}
        <section className="group relative p-[1px] rounded-3xl overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[conic-gradient(from_180deg_at_0%_50%,#e10600_0deg,#e10600_40deg,transparent_90deg)] opacity-40" />
          <div className="relative bg-[#161a23] rounded-[calc(1.5rem-1px)] p-1">
            <Suspense fallback={<div className="h-32 animate-pulse bg-slate-800 rounded-2xl" />}>
              <NextEventCard />
            </Suspense>
          </div>
        </section>

        {/* 2. JAARVOORSPELLING */}
        {isBeforeSeasonStart && (
          <section className="group relative p-[1px] rounded-3xl overflow-hidden shadow-xl">
            <div className="absolute inset-0 bg-[conic-gradient(from_180deg_at_0%_50%,#eab308_0deg,#eab308_40deg,transparent_90deg)] opacity-40 group-hover:opacity-100 transition-opacity" />
            <Link href="/predict/championship" className="relative block bg-[#161a23] rounded-[calc(1.5rem-1px)] p-6 transition-colors group-hover:bg-[#1c222d]">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {!hasPredictedSeason && <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>}
                    <h2 className="text-2xl font-black italic uppercase text-white">Jaarvoorspelling</h2>
                  </div>
                  <p className="text-slate-500 text-[9px] uppercase tracking-widest italic">Deadline: Vrijdag 6 maart 17:00u</p>
                </div>
                {hasPredictedSeason && (
                  <div className="bg-green-500/20 text-green-500 p-1 rounded-full border border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </Link>
          </section>
        )}

        {/* 3. KALENDER */}
        <section className="group relative p-[1px] rounded-3xl overflow-hidden shadow-xl">
          <div className="absolute inset-0 bg-[conic-gradient(from_180deg_at_0%_50%,#e10600_0deg,#e10600_40deg,transparent_90deg)] opacity-40" />
          <div className="relative bg-[#161a23] rounded-[calc(1.5rem-1px)] overflow-hidden">
            <Suspense fallback={<div className="p-8 text-slate-500 italic uppercase">Laden...</div>}>
              <RaceCalendar />
            </Suspense>
          </div>
        </section>

        {/* 4. MIJN VOORSPELLINGEN */}
        {showMyPredictions && (
          <section className="group relative p-[1px] rounded-3xl overflow-hidden shadow-xl">
            <div className="absolute inset-0 bg-[conic-gradient(from_180deg_at_0%_50%,#3b82f6_0deg,#3b82f6_40deg,transparent_90deg)] opacity-30 group-hover:opacity-100 transition-opacity" />
            <Link href="/my-predictions" className="relative block bg-[#161a23] rounded-[calc(1.5rem-1px)] p-6 transition-colors group-hover:bg-[#1c222d]">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black italic uppercase text-white group-hover:text-blue-400 transition-colors">Mijn Voorspellingen</h2>
                  <p className="text-slate-500 text-[9px] uppercase tracking-widest italic">Bekijk je keuzes & resultaten</p>
                </div>
                <div className="text-blue-500/50 text-xl font-black italic tracking-tighter">HISTORY</div>
              </div>
            </Link>
          </section>
        )}

        {/* 5. STANDEN */}
        <section className="group relative p-[1px] rounded-3xl overflow-hidden shadow-xl">
          <div className="absolute inset-0 bg-[conic-gradient(from_180deg_at_0%_50%,#e10600_0deg,#e10600_40deg,transparent_90deg)] opacity-40" />
          <div className="relative bg-[#161a23] rounded-[calc(1.5rem-1px)] p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1 h-5 bg-[#e10600]"></div>
              <h2 className="text-xl font-black italic uppercase text-white">Algemeen Klassement</h2>
            </div>

            <div className="space-y-2">
              {leaderboard && leaderboard.length > 0 ? (
                leaderboard.map((player, index) => (
                  <div 
                    key={player.user_id} 
                    className={`flex items-center justify-between p-3 rounded-xl border border-white/5 transition-all ${
                      index === 0 ? "bg-yellow-500/10 border-yellow-500/20" : "bg-black/20"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className={`w-6 font-f1 italic font-black text-sm ${
                        index === 0 ? "text-yellow-500" : 
                        index === 1 ? "text-slate-300" : 
                        index === 2 ? "text-orange-400" : "text-slate-600"
                      }`}>
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-[11px] font-black uppercase italic leading-none">{player.urer_name || player.nickname}</p>
                        <p className="text-[8px] text-slate-500 uppercase font-bold tracking-widest mt-1">
                          {index === 0 ? "Championship Leader" : "Challenger"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black italic text-white">{player.grand_total}</p>
                      <p className="text-[8px] text-slate-500 uppercase font-bold">PTS</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center py-8 text-slate-500 text-[10px] uppercase tracking-widest italic">
                  Nog geen scores bekend
                </p>
              )}
            </div>
            
            <Link href="/standings" className="block text-center mt-6 text-[9px] text-slate-500 hover:text-[#e10600] font-f1 font-black uppercase tracking-[0.2em] transition-colors">
              Bekijk de volledige stand →
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}