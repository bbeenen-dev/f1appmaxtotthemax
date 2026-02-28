import { createClient } from '@/utils/supabase/server'

export default async function globalstandings() {
  const supabase = await createClient()
  
  // we halen de scores op (ervan uitgaande dat je een tabel of view hebt)
  const { data: standings } = await supabase
    .from('profiles')
    .select('nickname, total_points')
    .order('total_points', { ascending: false })
    .limit(5)

  return (
    <div className="space-y-3 p-4">
      {standings?.map((user, index) => (
        <div key={user.nickname} className="flex justify-between items-center text-sm">
          <div className="flex items-center gap-3">
            <span className="text-[#e10600] font-black italic w-4">{index + 1}</span>
            <span className="text-slate-200 lowercase">{user.nickname}</span>
          </div>
          <span className="font-mono font-bold text-white">{user.total_points || 0} pnt</span>
        </div>
      ))}
    </div>
  )
}