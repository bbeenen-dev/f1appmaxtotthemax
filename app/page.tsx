import NextEventCard from '@/components/nexteventcard'
import RaceCalendar from '@/components/racecalendar'
import GlobalStandings from '@/components/globalstandings'
import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0f111a] text-white pb-32">
      {/* HERO SECTIE MET PANORAMAFOTO */}
      <div className="relative h-[40vh] md:h-[50vh] w-full overflow-hidden">
        <Image 
          src="/hero-2026.JPG" 
          alt="F1 2026 Hero"
          fill
          priority
          className="object-cover object-center transition-transform duration-1000 hover:scale-105"
        />
        
        {/* Gradients om de foto te blenden met de donkere achtergrond */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0f111a]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Header bovenop de foto */}
        <header className="absolute inset-0 flex flex-col justify-center items-center text-center p-4">
          <div className="w-16 h-1 bg-[#e10600] mb-2 shadow-[0_0_15px_rgba(225,6,0,0.8)]"></div>
          <h1 className="text-3xl md:text-4xl font-f1 font-black italic text-white uppercase tracking-tighter drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
            f1 <span className="text-[#e10600]">poule</span>
          </h1>
          <p className="text-[10px] font-f1 uppercase tracking-[0.4em] text-slate-300 mt-2 opacity-80">
            Season 2026
          </p>
        </header>
      </div>

      <div className="max-w-4xl mx-auto space-y-10 p-4 md:p-8 -mt-10 relative z-10">
        
        {/* SECTION: VOLGENDE RACE (Next Event) */}
        <section>
          <h2 className="text-slate-500 uppercase text-[10px] font-f1 mb-3 tracking-[0.2em] ml-2">Volgende Race</h2>
          <div className="group relative p-[1px] rounded-3xl overflow-hidden transition-all shadow-2xl">
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
          
          <Link href="/races" className="block group relative p-[1px] rounded-3xl overflow-hidden shadow-xl">
            <div className="absolute inset-0 bg-[conic-gradient(from_180deg_at_0%_50%,#e10600_0deg,#e10600_40deg,transparent_90deg)] opacity-40 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative bg-[#161a23] rounded-[calc(1.5rem-1px)] overflow-hidden transition-colors group-hover:bg-[#1c222d]">
              <Suspense fallback={<div className="p-8 text-xs text-slate-500 font-f1 italic uppercase">Gegevens ophalen...</div>}>
                <RaceCalendar />
              </Suspense>
              <div className="bg-slate-900/80 p-3 text-center text-[10px] text-slate-400 uppercase font-f1 tracking-widest group-hover:text-white transition-colors border-t border-white/5">
                Bekijk alle races van 2026
              </div>
            </div>
          </Link>
        </section>

        {/* SECTION: STANDEN */}
        <section>
          <h2 className="text-slate-500 uppercase text-[10px] font-f1 mb-3 tracking-[0.2em] ml-2">Standen</h2>
          <div className="group relative p-[1px] rounded-3xl overflow-hidden shadow-xl">
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