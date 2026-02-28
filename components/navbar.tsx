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
    <nav className="bg-[#15151e] border-t border-slate-800 p-4 fixed bottom-0 left-0 right-0 z-50">
      <div className="max-w-6xl mx-auto flex justify-center items-center">
        <div className="flex gap-8 sm:gap-12 text-[10px] font-bold uppercase tracking-[0.2em] items-center text-slate-300">
          <Link href="/" className="hover:text-[#e10600] transition-colors">
            Home
          </Link>
          <Link href="/kalender" className="hover:text-[#e10600] transition-colors">
            Kalender
          </Link>
          <Link href="/info" className="hover:text-[#e10600] transition-colors">
            Info
          </Link>
          
          {isAdmin && (
            <Link href="/admin" className="text-[#e10600] border border-[#e10600] px-2 py-0.5 rounded italic hover:bg-[#e10600] hover:text-white transition-all">
              Admin
            </Link>
          )}

          {user ? (
            <Link href="/logout" className="text-slate-500 hover:text-white transition-colors">
              Uitloggen
            </Link>
          ) : (
            <Link href="/login" className="text-[#e10600] font-black underline decoration-2 underline-offset-4">
              Inloggen
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}