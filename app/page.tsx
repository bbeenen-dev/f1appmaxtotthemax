import NextEventCard from '@/components/nexteventcard'
import RaceCalendar from '@/components/racecalendar'
import GlobalStandings from '@/components/globalstandings'
import { Suspense } from 'react'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0f111a] text-white pb-32">
      {/* COMPACTE HERO SECTIE */}
      <div className="relative h-[25vh] w-full overflow-hidden border-b border-slate-800/50 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        <Image 
          src="/hero-2026.JPG" 
          alt="F1 2026 Hero Panorama"
          fill
          priority
          className="object-cover object-center filter saturate-[0.8] brightness-[0.7]"
        />
        
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#0f111a]" />
        
        <header className="absolute inset-0 flex flex-col justify-end items-center text-center pb-8 p-4">
          <div className="w-16 h-1 bg-[#e10600] mb-3 shadow-[0_0_15px_rgba(225,6,0,0.8)]"></div>
          <h1 className="text-5xl md:text-7xl font-f1 font-black italic text-white uppercase tracking-[calc(-0.05em)] drop-shadow-[0_4px_12px_rgba(0,0,0,1)]">
            f1 <span className="text-[#e10600]">poule</span>
          </h1>
          <p className="text-[10px] font-f1 uppercase tracking-[0.5em] text-slate-300 mt-2 opacity-80">
            Season 2026
          </p>
        </header>
      </div>

      {/* CONTENT ZONDER SECTIE-TITELS */}
      <div className="max-w-4xl mx-auto space-y-6 p-4 md:p-8 -mt-6 relative z-10">
        
        {/* NEXT EVENT KAART */}
        <section className="group relative p-[1px] rounded-3xl overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[conic-gradient(from_180deg_at_0%_50%,#e10600_0deg,#e10600_40deg,transparent_90deg)] opacity-40 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative bg-[#161a23] rounded-[calc(1.5rem-1px)] p-1 transition-colors group-hover:bg-[#1c222d]">
            <Suspense fallback={<div className="animate-pulse bg-[#15151e] h-32 rounded-2xl"></div>}>
              <NextEventCard />
            </Suspense>
          </div>
        </section>

        {/* JAARKALENDER LINK */}
        <section className="group relative p-[1px] rounded-3xl overflow-hidden shadow-xl">
          <div className="absolute inset-0 bg-[conic-gradient(from_180deg_at_0%_50%,#e10600_0deg,#e10600_40deg,transparent_90deg)] opacity-40 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative bg-[#161a23] rounded-[calc(1.5rem-1px)] overflow-hidden transition-colors group-hover:bg-[#1c222d]">
            <Suspense fallback={<div className="p-8 text-xs text-slate-500 font-f1 italic uppercase">Laden...</div>}>
              <RaceCalendar />
            </Suspense>
          </div>
        </section>

        {/* STANDEN SECTIE */}
        <section className="group relative p-[1px] rounded-3xl overflow-hidden shadow-xl">
          <div className="absolute inset-0 bg-[conic-gradient(from_180deg_at_0%_50%,#e10600_0deg,#e10600_40deg,transparent_90deg)] opacity-40 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative bg-[#161a23] rounded-[calc(1.5rem-1px)] p-6 transition-colors group-hover:bg-[#1c222d]">
            <Suspense fallback={<div className="p-4 text-xs text-slate-500 font-f1 italic uppercase text-center">Standen berekenen...</div>}>
               <GlobalStandings />
            </Suspense>
          </div>
        </section>

      </div>
    </div>
  )
}