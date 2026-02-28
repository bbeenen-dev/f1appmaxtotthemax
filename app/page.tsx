import NextEventCard from '@/components/nexteventcard'
import RaceCalendar from '@/components/racecalendar'
import GlobalStandings from '@/components/globalstandings'
import { Suspense } from 'react'

// DIT IS CRUCIAAL VOOR NEXT.JS 15/16
export const dynamic = 'force-dynamic'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0f111a] text-white p-4 md:p-8 pb-32">
      <header className="mb-10 text-center relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-1 bg-[#e10600]"></div>
        <h1 className="pt-4 text-5xl font-black italic text-white uppercase tracking-tighter">
          f1 <span className="text-[#e10600]">poule</span>
        </h1>
      </header>

      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Gebruik Suspense om de build te plezieren en de user experience te verbeteren */}
        <section>
          <h2 className="text-slate-400 uppercase text-xs font-black mb-4 lowercase">volgende race</h2>
          <Suspense fallback={<div className="animate-pulse bg-[#15151e] h-24 rounded-xl"></div>}>
            <NextEventCard />
          </Suspense>
        </section>

        <section>
          <h2 className="text-slate-400 uppercase text-xs font-black mb-4 lowercase">race kalender</h2>
          <div className="bg-[#15151e] rounded-xl border border-slate-800 overflow-hidden">
            <Suspense fallback={<div className="p-4 text-xs text-slate-500">kalender laden...</div>}>
              <RaceCalendar />
            </Suspense>
          </div>
        </section>

        <section>
          <h2 className="text-slate-400 uppercase text-xs font-black mb-4 lowercase">global standings</h2>
          <Suspense fallback={<div className="p-4 text-xs text-slate-500">stand laden...</div>}>
             <GlobalStandings />
          </Suspense>
        </section>

      </div>
    </div>
  )
}