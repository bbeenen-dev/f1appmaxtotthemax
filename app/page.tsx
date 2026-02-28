import NextEventCard from '@/components/nexteventcard'
import RaceCalendar from '@/components/racecalendar'
import GlobalStandings from '@/components/globalstandings'
import { Suspense } from 'react'
import Link from 'next/link' // Vergeet de import van Link niet

// DIT IS CRUCIAAL VOOR NEXT.JS 15/16
export const dynamic = 'force-dynamic'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0f111a] text-white p-4 md:p-8 pb-32">
      <header className="mb-10 text-center relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-1 bg-[#e10600]"></div>
        <h1 className="pt-4 text-5xl font-f1 font-black italic text-white uppercase tracking-tighter">
          f1 <span className="text-[#e10600]">poule</span>
        </h1>
      </header>

      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Volgende Race Sectie */}
        <section>
          <h2 className="text-slate-500 uppercase text-[10px] font-black mb-4 tracking-widest">volgende race</h2>
          <Suspense fallback={<div className="animate-pulse bg-[#15151e] h-24 rounded-xl"></div>}>
            <NextEventCard />
          </Suspense>
        </section>

        {/* Race Kalender Sectie met Link */}
        <section>
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-slate-500 uppercase text-[10px] font-black tracking-widest">race kalender</h2>
            <Link 
              href="/races" 
              className="text-[#e10600] text-[10px] font-bold uppercase tracking-widest hover:underline flex items-center gap-1"
            >
              Bekijk volledige kalender
              <span>→</span>
            </Link>
          </div>
          
          <Link href="/races" className="block group">
            <div className="bg-[#15151e] rounded-xl border border-slate-800 overflow-hidden transition-all group-hover:border-[#e10600]/50">
              <Suspense fallback={<div className="p-4 text-xs text-slate-500 font-f1">kalender laden...</div>}>
                {/* De component zelf blijft de preview tonen */}
                <RaceCalendar />
              </Suspense>
              
              {/* Een kleine 'overlay' of footer onderaan de preview om klikbaarheid te tonen */}
              <div className="bg-slate-900/50 p-2 text-center text-[10px] text-slate-500 uppercase font-bold tracking-tighter group-hover:text-white transition-colors">
                Klik om alle 2026 races te bekijken
              </div>
            </div>
          </Link>
        </section>

        {/* Standen Sectie */}
        <section>
          <h2 className="text-slate-500 uppercase text-[10px] font-black mb-4 tracking-widest">global standings</h2>
          <Suspense fallback={<div className="p-4 text-xs text-slate-500 font-f1">stand laden...</div>}>
             <GlobalStandings />
          </Suspense>
        </section>

      </div>
    </div>
  )
}