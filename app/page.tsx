import NextEventCard from '@/components/nexteventcard'
import RaceCalendar from '@/components/racecalendar'
import GlobalStandings from '@/components/globalstandings'
import { Suspense } from 'react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0f111a] text-white p-4 md:p-8 pb-32">
      {/* Header */}
      <header className="mb-12 text-center relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-1 bg-[#e10600]"></div>
        <h1 className="pt-4 text-5xl font-f1 font-black italic text-white uppercase tracking-tighter">
          f1 <span className="text-[#e10600]">poule</span>
        </h1>
      </header>

      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* SECTION: VOLGENDE RACE (Next Event) */}
        <section>
          <h2 className="text-slate-500 uppercase text-[10px] font-f1 mb-3 tracking-[0.2em] ml-2">Volgende Race</h2>
          <div className="group relative p-[1px] rounded-3xl overflow-hidden transition-all">
             {/* De F1 Gradient Border */}
             <div className="absolute inset-0 bg-[conic-gradient(from_180deg_at_0%_50%,#e10600_0deg,#e10600_40deg,transparent_90deg)] opacity-40 group-hover:opacity-100 transition-opacity duration-500" />
             
             <div className="relative bg-[#161a23] rounded-[calc(1.5rem-1px)] p-1 transition-colors group-hover:bg-[#1c222d]">
                <Suspense fallback={<div className="animate-pulse bg-[#15151e] h-32 rounded-2xl"></div>}>
                  <NextEventCard />
                </Suspense>
             </div>
          </div>
        </section>

        {/* SECTION: RACE KALENDER */}
        <section>
          <div className="flex justify-between items-end mb-3 ml-2">
            <h2 className="text-slate-500 uppercase text-[10px] font-f1 tracking-[0.2em]">Kalender</h2>
            <Link href="/races" className="text-[#e10600] text-[10px] font-f1 uppercase tracking-widest hover:italic transition-all">
              Full Schedule →
            </Link>
          </div>
          
          <Link href="/races" className="block group relative p-[1px] rounded-3xl overflow-hidden">
            {/* De F1 Gradient Border */}
            <div className="absolute inset-0 bg-[conic-gradient(from_180deg_at_0%_50%,#e10600_0deg,#e10600_40deg,transparent_90deg)] opacity-40 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative bg-[#161a23] rounded-[calc(1.5rem-1px)] overflow-hidden transition-colors group-hover:bg-[#1c222d]">
              <Suspense fallback={<div className="p-8 text-xs text-slate-500 font-f1 italic uppercase">Gegevens ophalen...</div>}>
                <RaceCalendar />
              </Suspense>
              
              <div className="bg-slate-900/80 p-3 text-center text-[10px] text-slate-400 uppercase font-f1 tracking-widest group-hover:text-white transition-colors border-t border-white/5">
                Bekijk alle races van 2026
              </div>
            </div>

            {/* Decoratief groot nummer op de achtergrond voor de look */}
            <div className="absolute -right-4 -bottom-6 font-f1 text-9xl font-black italic text-white/[0.03] select-none pointer-events-none uppercase">
              GP
            </div>
          </Link>
        </section>

        {/* SECTION: STANDEN */}
        <section>
          <h2 className="text-slate-500 uppercase text-[10px] font-f1 mb-3 tracking-[0.2em] ml-2">Standen</h2>
          <div className="group relative p-[1px] rounded-3xl overflow-hidden">
             {/* De F1 Gradient Border */}
             <div className="absolute inset-0 bg-[conic-gradient(from_180deg_at_0%_50%,#e10600_0deg,#e10600_40deg,transparent_90deg)] opacity-40 group-hover:opacity-100 transition-opacity duration-500" />
             
             <div className="relative bg-[#161a23] rounded-[calc(1.5rem-1px)] p-6 transition-colors group-hover:bg-[#1c222d]">
                <Suspense fallback={<div className="p-4 text-xs text-slate-500 font-f1 italic uppercase">Standen berekenen...</div>}>
                   <GlobalStandings />
                </Suspense>
             </div>
          </div>
        </section>

      </div>
    </div>
  )
}