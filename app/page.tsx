import NextEventCard from '@/components/nexteventcard'
import RaceCalendar from '@/components/racecalendar'
import GlobalStandings from '@/components/globalstandings'
import Link from 'next/link'
import { Suspense } from 'react'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

export default function HomePage() {
  // DEADLINE: Vrijdag 6 maart 2026, 17:00u (Start Quali Bahrein)
  const seasonDeadline = new Date('2026-03-06T17:00:00');
  const now = new Date();
  const isBeforeSeasonStart = now < seasonDeadline;

  return (
    <div className="min-h-screen bg-[#0f111a] text-white pb-32">
      {/* HERO SECTIE (Blijft gelijk) */}
      <div className="relative h-[25vh] w-full overflow-hidden border-b border-slate-800/50">
        <Image src="/hero-2026.JPG" alt="F1 2026" fill priority className="object-cover brightness-[0.7]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#0f111a]" />
        <header className="absolute inset-0 flex flex-col justify-end items-center pb-8 p-4 text-center">
          <div className="w-16 h-1 bg-[#e10600] mb-3 shadow-[0_0_15px_rgba(225,6,0,0.8)]"></div>
          <h1 className="text-5xl md:text-7xl font-f1 font-black italic uppercase tracking-tighter">
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

        {/* 2. JAARVOORSPELLING (Alleen zichtbaar VOOR start Quali Bahrein) */}
        {isBeforeSeasonStart && (
          <section className="group relative p-[1px] rounded-3xl overflow-hidden shadow-xl">
            <div className="absolute inset-0 bg-[conic-gradient(from_180deg_at_0%_50%,#eab308_0deg,#eab308_40deg,transparent_90deg)] opacity-40 group-hover:opacity-100 transition-opacity" />
            <Link href="/predict/championship" className="relative block bg-[#161a23] rounded-[calc(1.5rem-1px)] p-6 transition-colors group-hover:bg-[#1c222d]">
              <div className="flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                    <h2 className="text-2xl font-f1 font-black italic uppercase text-white">Jaarvoorspelling</h2>
                  </div>
                  <p className="text-slate-500 text-[9px] font-f1 uppercase tracking-widest italic">Deadline: Vrijdag 6 maart 17:00u</p>
                </div>
                <div className="text-yellow-500 font-f1 text-2xl font-black italic">→</div>
              </div>
            </Link>
          </section>
        )}

        {/* 3. MIJN VOORSPELLINGEN (Nieuwe Sectie voor archief) */}
        <section className="group relative p-[1px] rounded-3xl overflow-hidden shadow-xl">
          <div className="absolute inset-0 bg-[conic-gradient(from_180deg_at_0%_50%,#3b82f6_0deg,#3b82f6_40deg,transparent_90deg)] opacity-30 group-hover:opacity-100 transition-opacity" />
          <Link href="/my-predictions" className="relative block bg-[#161a23] rounded-[calc(1.5rem-1px)] p-6 transition-colors group-hover:bg-[#1c222d]">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-f1 font-black italic uppercase text-white group-hover:text-blue-400 transition-colors">Mijn Voorspellingen</h2>
                <p className="text-slate-500 text-[9px] font-f1 uppercase tracking-widest italic">Bekijk je keuzes & resultaten</p>
              </div>
              <div className="text-blue-500 font-f1 text-xl font-black italic">HISTORY</div>
            </div>
          </Link>
        </section>

        {/* 4. KALENDER & 5. STANDEN */}
        <section className="group relative p-[1px] rounded-3xl overflow-hidden shadow-xl">
          <div className="absolute inset-0 bg-[conic-gradient(from_180deg_at_0%_50%,#e10600_0deg,#e10600_40deg,transparent_90deg)] opacity-40" />
          <div className="relative bg-[#161a23] rounded-[calc(1.5rem-1px)] overflow-hidden">
            <Suspense fallback={<div className="p-8 text-slate-500 italic uppercase">Laden...</div>}>
              <RaceCalendar />
            </Suspense>
          </div>
        </section>

        <section className="group relative p-[1px] rounded-3xl overflow-hidden shadow-xl">
          <div className="absolute inset-0 bg-[conic-gradient(from_180deg_at_0%_50%,#e10600_0deg,#e10600_40deg,transparent_90deg)] opacity-40" />
          <div className="relative bg-[#161a23] rounded-[calc(1.5rem-1px)] p-6">
            <Suspense fallback={<div className="p-4 text-slate-500 italic text-center">Standen laden...</div>}>
                <GlobalStandings />
            </Suspense>
          </div>
        </section>
      </div>
    </div>
  )
}