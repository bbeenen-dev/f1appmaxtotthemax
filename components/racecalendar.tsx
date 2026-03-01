import Link from 'next/link'

export default function RaceCalendar() {
  return (
    <div className="bg-[#161a23] hover:bg-[#1c222d] transition-colors duration-300">
      <Link 
        href="/races" 
        className="group flex items-center p-6 w-full"
      >
        <div className="flex flex-col">
          {/* Alleen de kerntitel in de vette F1-stijl */}
          <h2 className="font-f1 text-2xl md:text-3xl font-black italic uppercase leading-none tracking-tighter text-white group-hover:text-[#e10600] transition-colors">
            Jaarkalender
          </h2>
          
          {/* Subtiele indicatie van de inhoud zonder de extra knop */}
          <p className="text-slate-500 text-[9px] font-f1 uppercase tracking-[0.3em] mt-2 opacity-60">
            24 Grands Prix • Bekijk alles
          </p>
        </div>
      </Link>
    </div>
  )
}