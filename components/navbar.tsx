import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'

export default async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let isAdmin = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    isAdmin = profile?.is_admin || false
  }

  return (
    <nav className="bg-[#15151e] border-b border-slate-800 p-4 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link href="/" className="font-black italic text-[#e10600] text-xl tracking-tighter">
          F1 POULE
        </Link>
        <div className="flex gap-6 text-xs font-bold uppercase tracking-widest items-center">
          <Link href="/" className="hover:text-[#e10600] transition">Home</Link>
          <Link href="/kalender" className="hover:text-[#e10600] transition">Kalender</Link>
          <Link href="/info" className="hover:text-[#e10600] transition">Info</Link>
          {isAdmin && (
            <Link href="/admin" className="bg-[#e10600] text-white px-3 py-1 rounded italic hover:bg-white hover:text-[#e10600] transition">
              Admin
            </Link>
          )}
          {user ? (
            <span className="text-[10px] text-slate-500 lowercase border-l border-slate-700 pl-4 hidden md:block">
              {user.email}
            </span>
          ) : (
            <Link href="/login" className="text-[#e10600]">Inloggen</Link>
          )}
        </div>
      </div>
    </nav>
  )
}