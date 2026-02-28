import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

export default async function nexteventcard() {
  const supabase = await createClient()
  
  // we halen de eerstvolgende race op die nog niet is geweest
  const { data: race } = await supabase
    .from('races')
    .select('*')
    .gt('end_date', new Date().toISOString())
    .order('start_date', { ascending: true })
    .limit(1)
    .single()

  if (!race) return <div className="text-slate-500 text-xs text-center p-8 bg-[#15151e] rounded-xl border border-slate-800">geen races gepland</div>

  return (
    <div className="bg-[#15151e] rounded-xl p-6 border-l-4 border-[#e10600] shadow-xl">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-2xl font-black italic uppercase tracking-tighter">{race.name}</h3>
          <p className="text-slate-400 text-xs font-medium lowercase">
            {new Date(race.start_date).toLocaleDateString('nl-NL')} - {new Date(race.end_date).toLocaleDateString('nl-NL')}
          </p>
        </div>
        <Link 
          href={`/races/${race.id}`}
          className="bg-[#e10600] text-white text-[10px] font-bold py-2 px-4 rounded italic hover:bg-white hover:text-[#e10600] transition-all uppercase"
        >
          voorspellen
        </Link>
      </div>
    </div>
  )
}