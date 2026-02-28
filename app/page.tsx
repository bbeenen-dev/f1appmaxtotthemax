import NextEventCard from '@/components/nexteventcard'
import RaceCalendar from '@/components/racecalendar'
import GlobalStandings from '@/components/globalstandings'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0f111a] text-white p-4 md:p-8 pb-32">
      <header className="mb-10 text-center relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-1 bg-[#e10600]"></div>
        <h1 className="pt-4 text-5xl font-black italic text-white uppercase tracking-tighter">
          f1 <span className="text-[#e10600]">poule</span>
        </h1>
        <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.3em] mt-2">
          season 2026
        </p>
      </header>

      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* 1. next event */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 bg-[#e10600]"></div>
            <h2 className="text-slate-400 uppercase text-xs font-black tracking-widest lowercase">
              volgende race
            </h2>
          </div>
          <NextEventCard />
        </section>

        {/* 2. kalender */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 bg-[#e10600]"></div>
            <h2 className="text-slate-400 uppercase text-xs font-black tracking-widest lowercase">
              race kalender
            </h2>
          </div>
          <div className="bg-[#15151e] rounded-xl border border-slate-800 overflow-hidden">
            <RaceCalendar />
          </div>
        </section>

        {/* 3. totaalstand */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 bg-[#e10600]"></div>
            <h2 className="text-slate-400 uppercase text-xs font-black tracking-widest lowercase">
              global standings
            </h2>
          </div>
          <div className="bg-gradient-to-b from-[#1a1a24] to-[#15151e] rounded-xl p-1 border border-slate-800">
             <GlobalStandings />
          </div>
        </section>
      </div>
    </div>
  )
}