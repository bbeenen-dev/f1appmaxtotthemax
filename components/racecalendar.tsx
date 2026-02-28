import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

export default async function racecalendar() {
  const supabase = await createClient()
  const { data: races } = await supabase
    .from('races')
    .select('*')
    .order('start_date', { ascending: true })

  return (
    <div className="divide-y divide-slate-800">
      {races?.map((race) => (
        <Link 
          key={race.id} 
          href={`/races/${race.id}`}
          className="flex items-center justify-between p-4 hover:bg-[#1a1a24] transition-colors group"
        >
          <div className="flex items-center gap-4">
            <span className="text-slate-600 text-[10px] font-mono lowercase">
              {new Date(race.start_date).toLocaleDateString('nl-NL', { month: 'short', day: 'numeric' })}
            </span>
            <span className="text-sm font-bold text-slate-200 group-hover:text-[#e10600] transition-colors lowercase">
              {race.name}
            </span>
          </div>
          <span className="text-[#e10600] text-lg opacity-0 group-hover:opacity-100 transition-opacity">→</span>
        </Link>
      ))}
    </div>
  )
}