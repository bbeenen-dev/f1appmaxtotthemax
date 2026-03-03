import NextEventCard from '@/components/nexteventcard'
import RaceCalendar from '@/components/racecalendar'
import Link from 'next/link'
import { Suspense } from 'react'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/server'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  await headers();
  const supabase = await createClient();
  
  // FEATURE FLAGS (Zet op true om weer aan te zetten)
  const showMyPredictions = false;

  // 1. Deadline logica
  const seasonDeadline = new Date('2026-03-06T17:00:00');
  const now = new Date();
  const isBeforeSeasonStart = now < seasonDeadline;

  // 2. Check user & Jaarvoorspelling
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

  // 3. Haal Leaderboard data op (Top 10)
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

        {/* 4. MIJN VOORSPELLINGEN (Tijdelijk conditioneel) */}
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