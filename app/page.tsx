import NextEventCard from '@/components/nexteventcard'
import RaceCalendar from '@/components/racecalendar'
import Leaderboard from '@/components/leaderboard'
import Link from 'next/link'
import { Suspense } from 'react'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/server'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  await headers();
  const supabase = await createClient();
  
  // --- BITCOIN CONFIGURATIE ---
  const initialDepositEuro = 130;
  const fixedBtcAmount = 0.00218923;
  let currentEuroValue = initialDepositEuro; 
  let currentBtcPrice = 59381;

  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=eur',
      { next: { revalidate: 300 } }
    );
    const data = await response.json();
    if (data.bitcoin && data.bitcoin.eur) {
      currentBtcPrice = data.bitcoin.eur;
      currentEuroValue = fixedBtcAmount * currentBtcPrice;
    }
  } catch (error) {
    console.error("BTC API Error:", error);
  }

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
        
        {/* 1. PRIJZENPOT (BTC) */}
        <section className="group relative p-[1px] rounded-3xl overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[conic-gradient(from_180deg_at_50%_50%,#f7931a_0deg,#f7931a_40deg,transparent_90deg)] opacity-40" />
          <div className="relative bg-[#161a23] rounded-[calc(1.5rem-1px)] p-6 border border-white/5 transition-all group-hover:bg-[#1c222d]">
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1 h-4 bg-[#f7931a]"></div>
                  <h2 className="text-[10px] font-black italic uppercase text-slate-400 tracking-[0.2em]">Live Prijzenpot</h2>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-black italic text-white tracking-tighter">
                    €{currentEuroValue.toFixed(2)}
                  </span>
                  <span className="text-[#f7931a] font-f1 italic font-black text-[10px] uppercase leading-none">
                    {fixedBtcAmount.toFixed(8)} BTC
                  </span>
                </div>
              </div>
              <div className={`text-sm font-black italic tracking-tighter ${currentEuroValue >= initialDepositEuro ? 'text-green-500' : 'text-red-500'}`}>
                {(((currentEuroValue - initialDepositEuro) / initialDepositEuro) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </section>

        {/* 2. NEXT EVENT */}
        <section className="group relative p-[1px] rounded-3xl overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[conic-gradient(from_180deg_at_0%_50%,#e10600_0deg,#e10600_40deg,transparent_90deg)] opacity-40" />
          <div className="relative bg-[#161a23] rounded-[calc(1.5rem-1px)] p-1">
            <Suspense fallback={<div className="h-32 animate-pulse bg-slate-800 rounded-2xl" />}>
              <NextEventCard />
            </Suspense>
          </div>
        </section>

        {/* 3. KALENDER */}
        <section className="group relative p-[1px] rounded-3xl overflow-hidden shadow-xl">
          <div className="absolute inset-0 bg-[conic-gradient(from_180deg_at_0%_50%,#e10600_0deg,#e10600_40deg,transparent_90deg)] opacity-40" />
          <div className="relative bg-[#161a23] rounded-[calc(1.5rem-1px)] overflow-hidden">
            <Suspense fallback={<div className="p-8 text-slate-500 italic uppercase">Kalender laden...</div>}>
              <RaceCalendar />
            </Suspense>
          </div>
        </section>

        {/* 4. STANDEN MATRIX (DYNAMISCH) */}
        <section>
          <Suspense fallback={
            <div className="bg-[#161a23] rounded-3xl p-10 text-center animate-pulse text-slate-500 uppercase italic text-xs border border-white/5">
              WK Matrix opbouwen...
            </div>
          }>
            <Leaderboard />
          </Suspense>
        </section>

        {/* 5. SEIZOENSVOORSPELLINGEN (NU ONDERAAN) */}
        <section className="group relative p-[1px] rounded-3xl overflow-hidden shadow-xl">
          <div className="absolute inset-0 bg-[conic-gradient(from_180deg_at_0%_50%,#eab308_0deg,#eab308_40deg,transparent_90deg)] opacity-40 group-hover:opacity-100 transition-opacity" />
          <Link 
            href="/predict/season-overview" 
            className="relative block bg-[#161a23] rounded-[calc(1.5rem-1px)] p-6 transition-colors group-hover:bg-[#1c222d]"
          >
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black italic uppercase text-white leading-tight">
                  Seizoensvoorspellingen
                </h2>
                <p className="text-slate-400 text-xs font-black uppercase tracking-[0.1em] italic">
                  Bekijk wie wereldkampioen wordt volgens de groep
                </p>
              </div>
              <div className="text-yellow-500 text-2xl">→</div>
            </div>
          </Link>
        </section>

      </div>
    </div>
  )
}