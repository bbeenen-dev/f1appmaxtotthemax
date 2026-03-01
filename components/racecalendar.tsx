import Link from 'next/link'

export default function RaceCalendar() {
  return (
    <div className="bg-[#161a23] hover:bg-[#1c222d] transition-colors duration-300">
      <Link 
        href="/races" 
        className="group flex items-center justify-between p-6 w-full"
      >
        <div className="flex flex-col gap-1">
          {/* Subtitel in dezelfde stijl als de 'Round' indicator */}
          <span className="font-f1 text-[#e10600] uppercase text-[10px] tracking-[0.2em] leading-none">
            Seizoen 2026
          </span>
          
          {/* Hoofdtitel in de stijl van de NextEventCard kop */}
          <h2 className="font-f1 text-2xl font-black italic uppercase leading-none tracking-tighter text-white group-hover:text-[#e10600] transition-colors">
            Bekijk volledige jaarkalender
          </h2>
          
          {/* Extra detailtekst voor de balans */}
          <p className="text-slate-500 text-[10px] font-f1 uppercase tracking-widest mt-1 opacity-70">
            Alle 24 Grand Prix locaties & data
          </p>
        </div>

        {/* De iconische F1-pijl die oplicht bij hover */}
        <div className="flex items-center gap-4">
          <span className="font-f1 text-[#e10600] text-3xl font-black italic transform transition-all duration-300 group-hover:translate-x-2">
            →
          </span>
        </div>
      </Link>
    </div>
  )
}