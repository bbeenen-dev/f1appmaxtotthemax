import Link from 'next/link'

export default function RaceCalendar() {
  return (
    <div className="bg-[#161a23] hover:bg-[#1c222d] transition-colors duration-300">
      <Link 
        href="/races" 
        className="group flex items-center p-6 w-full"
      >
        <div className="flex flex-col">
          {/* Titel: Nu exact hetzelfde font en grootte als Jaarvoorspelling (text-2xl) */}
          <h2 className="text-2xl font-black italic uppercase text-white leading-tight group-hover:text-[#e10600] transition-colors">
            Jaarkalender
          </h2>
          
          {/* Subtekst: Nu text-slate-400, text-xs en dezelfde vette F1-stijl */}
          <p className="text-slate-400 text-xs font-black uppercase tracking-[0.1em] italic mt-1">
            Alle races van het 2026 seizoen
          </p>
        </div>
      </Link>
    </div>
  )
}